#!/usr/bin/env node
'use strict';
/*!
 * s1panel - main
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads     = require('worker_threads');
const fs          = require('fs');
const http        = require('http');

const express     = require('express');
const node_canvas = require('canvas');

const logger      = require('./logger');
const api         = require('./api');

function get_hr_time() {

    return Math.floor(Number(process.hrtime.bigint()) / 1000000);
}

function lcd_redraw(state, imageData) {

    state.drawing = true;

    const pixelData = new Uint16Array(imageData.data);

    state.lcd_thread.postMessage({ type: 'redraw', pixelData}, [pixelData.buffer]);
}

function lcd_update(state, rect, imageData) {

    state.drawing = true;

    const pixelData = new Uint16Array(imageData.data);

    state.lcd_thread.postMessage({ type: 'update', rect, pixelData }, [pixelData.buffer]);
}

function lcd_orientation(state, portrait) {

    state.lcd_thread.postMessage({ type: 'orientation', portrait });
}

function lcd_set_time(state) {

    state.lcd_thread.postMessage({ type: 'heartbeat' });
}

function lcd_set_config(state, config) {

    state.lcd_thread.postMessage({ type: 'config', poll: config.poll, refresh: config.refresh, heartbeat: config.heartbeat });
}

function load_config(filename) {

    return new Promise((fulfill, reject) => {

        fs.readFile(filename, 'utf8', (err, jsonData) => {

            if (err) {
                logger.error('load_config: ' + err);
                return reject();
            }

            try {
                fulfill(JSON.parse(jsonData));
            }
            catch (ex) {
                logger.error('load_config: failed to parse json from ' + filename);
                reject();
            }
        });
    });
}

function translate_rect(portrait, rect, height) {

    return portrait ? { x: rect.y, y: (height - (rect.x + rect.width)), width: rect.height, height: rect.width } : rect;
}

function next_update_region(context, state, config, fulfill) {

    if (!state.changes.length) {

        return fulfill();
    }

    const _change = state.changes.shift();
    const _rect = translate_rect(config.portrait, _change, config.canvas.height);
    const _image = context.getImageData(_rect.x, _rect.y, _rect.width, _rect.height);

    if (config.debug_update) {

        _image.data.fill(Math.floor(Math.random() * 65025) + 1);
    }

    state.change_count--;

    lcd_update(state, _rect, _image);

    next_update_region(context, state, config, fulfill);
}

function start_update_screen(context, state, config, fulfill) {

    const _start = get_hr_time();
    const _count = state.change_count;

    next_update_region(context, state, config, () => {

        state.stat_update = get_hr_time() - _start;
        state.stat_count = _count;

        fulfill(_count ? true : false);
    });
}

function clear_pending_screen_updates(state) {

    while (state.changes.length) {

        state.changes.shift();
        state.change_count--;
    }
}

function update_device_screen(context, state, config, theme) {

    return new Promise(fulfill => {

        if (state.update_orientation) {

            config.portrait = theme.orientation === 'portrait';

            state.update_orientation = false;

            lcd_orientation(state, config.portrait);

            return fulfill();
        }
        else if (!state.drawing) {

            if ('redraw' === theme.refresh || state.pending_redraw(state)) {

                clear_pending_screen_updates(state);

                lcd_redraw(state, context.getImageData(0, 0, config.canvas.width, config.canvas.height));

                return fulfill(true);
            }
            else if (state.changes.length) {

                // lcd update methods:
                //
                // redraw   : always redraw the whole screen (slowest)
                // update   : update by the widget rect (fastest)
                //
                // row      : update whole screen by drawing strips down x (landscape going down)
                // column   : update whole screen by drawing strips down y (portrait going down)
                // gridx    : update screen by a grid of 32x10 (only changed parts)
                // gridy    : update screen by a grid of 10x32 (only changed parts)
                //
                switch (theme.refresh) {

                    case 'update':
                        return start_update_screen(context, state, config, fulfill);

                    case 'row':
                    case 'column':
                    case 'gridx':
                    case 'gridy':
                        break;
                }
            }
        }
        fulfill();
    });
}

function fetch_screen(state, config, theme) {

    const _count = theme.screens.length;
    const _old_index = state.screen_index;

    var _screen = theme.screens[state.screen_index];

    if (_count > 1) {

        const _now = get_hr_time();
        const _diff = _now - state.screen_start;

        if (state.change_screen !== state.screen_index) {

            // jump to change_screen
            if (state.change_screen < _count) {

                state.screen_index = state.change_screen;
            }
            else {

                state.change_screen = 0;
            }
        }
        else if (_screen.duration && _diff > _screen.duration) {

            if (!state.screen_paused) {

                // move to next screen, or cycle back
                state.screen_index++;

                if (state.screen_index >= _count) {

                    state.screen_index = 0;
                }
            }
            else {
                state.screen_start = get_hr_time();
            }
        }

        // did we change?
        if (_old_index !== state.screen_index) {

            _screen = theme.screens[state.screen_index];

            // does new screen have a wallpaper?
            if (_screen.wallpaper) {

                state.wallpaper_image = null;
            }

            if (_screen.led_config) {

                config.led_config.theme = _screen.led_config.theme || 4;
                config.led_config.intensity = _screen.led_config.intensity || 3;
                config.led_config.speed = _screen.led_config.speed || 3;
                state.update_led = true;
            }

            // sync up everything, and force full screen redraw
            state.change_screen = state.screen_index;
            state.screen_start = get_hr_time();
            state.force_redraw(state);
        }
    }
    else {
        state.screen_start = get_hr_time();
    }
    return _screen;
}

function calc_update_region(rect) {

    const _max_size = 2048;   // 4096 buffer limit
    const _totalPixels = rect.width * rect.height;
    const _chunks = [];

    if (_totalPixels > _max_size) {

        const _rows = Math.ceil(rect.height / Math.sqrt(_max_size));
        const _cols = Math.ceil(rect.width / Math.sqrt(_max_size));
        const _area_width = Math.ceil(rect.width / _cols);
        const _area_height = Math.ceil(rect.height / _rows);

        for (let i = 0; i < _rows; i++) {

            for (let j = 0; j < _cols; j++) {

                const _areaX = rect.x + j * _area_width;
                const _areaY = rect.y + i * _area_height;

                _chunks.push({
                    x: _areaX,
                    y: _areaY,
                    width: Math.min(_area_width, rect.width - j * _area_width),
                    height: Math.min(_area_height, rect.height - i * _area_height)
                });
            }
        }
    }
    else {
        _chunks.push(rect);
    }

    return _chunks;
}

function fix_rect_bounds(config, rect) {

    var _width = rect.width;
    var _height = rect.height;

    const _total_width = rect.x + _width;
    const _total_height = rect.y + _height;

    const _max_width = config.portrait ? config.canvas.height : config.canvas.width;
    const _max_height = config.portrait ? config.canvas.width : config.canvas.height;

    if (_total_width > _max_width) {

        _width -= _total_width - _max_width;
    }

    if (_total_height > _max_height) {

        _height -= _total_height - _max_height;
    }

    return { x: rect.x, y: rect.y, width: _width, height: _height };
}

function next_draw_widgets(context, state, config, widgets, index, total, fulfill) {

    if (index < total) {

        const _widget_config = widgets[index];

        var _sensor_reading = Promise.resolve();

        if (_widget_config.refresh && _widget_config.sensor) {

            const _sensor = state.sensors[_widget_config.value];

            if (_sensor) {

                _sensor_reading = _sensor.sample(_widget_config.refresh, _widget_config.format);
            }
        }

       return _sensor_reading.then(sensor => {

            const _widget = state.widgets[_widget_config.name];
            const _value = sensor ? sensor.value : _widget_config.value;
            const _min = sensor ? sensor.min : 0;
            const _max = sensor ? sensor.max : 0;

            var _draw_promise = Promise.resolve(false);

            if (_widget) {

                _draw_promise = _widget.draw(context, _value, _min, _max, _widget_config);
            }

            _draw_promise.then(changed => {

                if (!state.drawing && changed) {

                    calc_update_region(fix_rect_bounds(config, _widget_config.rect)).forEach(each => {

                        state.changes.push(each);
                        state.change_count++;
                    });
                }

                next_draw_widgets(context, state, config, widgets, 1 + index, total, fulfill);
            });
        });
    }

    fulfill(); // we are done
}

function load_wallpaper(context, state, config, screen) {

    return new Promise(fulfill => {

        if (screen.background) {

            context.fillStyle = screen.background;
            context.rect(0, 0, config.canvas.width, config.canvas.height);
            context.fill();
        }

        if (screen.wallpaper) {

            if (state.wallpaper_image) {

                return fulfill(state.wallpaper_image);
            }

            return node_canvas.loadImage(screen.wallpaper).then(image => {

                state.wallpaper_image = image;

                return fulfill(state.wallpaper_image);
            });
        }

        fulfill();
    });
}

function draw_screen(context, state, config, screen) {

    return new Promise(fulfill => {

        context.resetTransform();
        context.rotate(0);
        context.clearRect(0, 0, config.canvas.width, config.canvas.height);

        load_wallpaper(context, state, config, screen).then(image => {

            if (image) {

                context.drawImage(image, 0, 0, config.canvas.width, config.canvas.height);
            }

            if (config.portrait) {

                context.translate(0, 170);
                context.rotate(-Math.PI / 2);
            }

            next_draw_widgets(context, state, config, screen.widgets, 0, screen.widgets.length, () => {

                fulfill();
            });
        });
    });
}

function update_led_strip(state, config) {

    return new Promise(fulfill => {

        if (!state.update_led) {
            return fulfill();
        }

        // led strip manipulation is done on a seperate thread...
        state.led_thread.postMessage(config.led_config);
        state.update_led = false;

        fulfill();
    });
}

function next_sensor(state, widgets, index, fulfill) {

    if (index < widgets.length) {

        const _widget_config = widgets[index];

        var _sensor_reading = Promise.resolve();

        if (_widget_config.refresh && _widget_config.sensor) {

            const _sensor = state.sensors[_widget_config.value];

            if (_sensor) {

                _sensor_reading = _sensor.sample(_widget_config.refresh, '');
            }
        }

        return _sensor_reading.then(() => {

            next_sensor(state, widgets, 1 + index, fulfill);
        });
    }

    fulfill(); // we are done
}

/*
 * we need to poll each widget/sensor in all the inactive screens or we
 * going to have missed data points. ie: if cpu_usage is only on screen 1
 * and temp is only on screen 2, if we stay on screen 1 too long screen 2
 * temp sensor will have missed data points. we skip the active screen,
 * since its going to be taken care of by the draw_screen.
 */
function poll_inactive_screen_sensors(state, screens, index, active, fulfill) {

    if (index < screens.length) {

        const _screen = screens[index];

        if (_screen.id !== active.id) {

            return next_sensor(state, _screen.widgets, 0, () => {

                poll_inactive_screen_sensors(state, screens, 1 + index, active, fulfill);
            });
        }

        return poll_inactive_screen_sensors(state, screens, 1 + index, active, fulfill);
    }

    fulfill(); // we are done
}


function start_draw_canvas(state, config, theme) {

    const _context = state.canvas_context[state.active_context];
    const _active_screen = fetch_screen(state, config, theme);

    poll_inactive_screen_sensors(state, theme.screens, 0, _active_screen, () => {

        // pick a screen and draw it
        draw_screen(_context, state, config, _active_screen).then(() => {

            // update lcd screen
            update_device_screen(_context, state, config, theme).then(device_updated => {

                state.output_context.putImageData(_context.getImageData(0, 0, config.canvas.width, config.canvas.height), 0, 0);

                if (device_updated) {

                    state.active_context ^= 1;  // flip buffer to use
                }

                update_led_strip(state, config).then(() => {

                    setTimeout(() => {

                        lcd_set_config(state, config);

                        start_draw_canvas(state, config, theme);

                    }, config.poll);
                });
            });
        });
    });
}

function initialize(state, config, theme) {

    config.widgets.forEach(widget => {

        const _file = './' + widget;
        const _module = require(_file);

        if (_module) {

            const _name = _module.info().name;

            logger.info('initialize: widget ' + _name + ' loaded...');

            state.widgets[_name] = { name: _name, info: _module.info, draw: _module.draw };
        }
    });

    config.sensors.forEach(sensor => {

        const _file = './' + sensor.module;
        const _module = require(_file);

        if (_module) {

            const _config = sensor.config || {};
            const _name = _module.init(_config);

            logger.info('initialize: sensor ' + _name + ' loaded...');

            state.sensors[_name] = { config: _config, name: _name, sample: (rate, format) => {
                return _module.sample(rate, format, _config);
            }};
        }
    });

    config.portrait = theme.orientation === 'portrait';

    logger.info('initialize: device orientation is ' + theme.orientation);

    // sort screens by id
    theme.screens.sort((a, b) => a.id - b.id);

    lcd_set_time(state);

    return Promise.resolve();
}

function init_web_gui(state, config, theme) {

    return new Promise(fulfill => {

        const _web = express();

        const _listen = config.listen.split(':');
        const _ip = _listen[0];
        const _port = Number(_listen[1]);

        _web.use(express.static('gui/dist'));
        _web.use(express.json());

        api.init(_web, { state, config, theme });

        http.createServer(_web).listen(_port, _ip, () => {

            logger.info('initialize: gui started on ' + _ip + ':' + _port);
            fulfill();
        });
    });
}

function lcd_thread_status(state, theme, message) {

    if (state.drawing && message.complete) {

        if ('redraw' === message.type) {

            state.done_redraw(state);
        }

        state.drawing = false;
    }
}

function main() {
    // additional commandline args
    var args = process.argv.slice(2);

    var config_file = null

    if (args.length > 0) {
        config_file = args[0]
    }
    else {
        config_file = 'config.json'
    }

    load_config(config_file).then(config => {

        load_config(config.theme).then(theme => {

            const _output_canvas = node_canvas.createCanvas(config.canvas.width, config.canvas.height);
            const _canvas1 = node_canvas.createCanvas(config.canvas.width, config.canvas.height).getContext('2d', { pixelFormat: config.canvas.pixel });
            const _canvas2 = node_canvas.createCanvas(config.canvas.width, config.canvas.height).getContext('2d', { pixelFormat: config.canvas.pixel });

            const _state = {

                widgets            : {},
                sensors            : {},

                redraw_want        : 1,
                redraw_count       : 0,

                drawing            : false,             // drawing in progress
                changes            : [],                // screen update regions
                change_count       : 0,                 // screen update count

                output_canvas      : _output_canvas,
                output_context     : _output_canvas.getContext('2d', { pixelFormat: config.canvas.pixel }),
                active_context     : 0,
                canvas_context     : [ _canvas1, _canvas2 ],

                change_screen      : 0,                 // index of forced screen change
                screen_paused      : false,             // pause screen change
                screen_index       : 0,                 // array index into screens, not screen id
                screen_start       : get_hr_time(),

                update_orientation : true,
                update_led         : true,

                wallpaper_image    : null,

                led_thread         : new threads.Worker('./led_thread.js', { workerData: config.led_config }),
                lcd_thread         : new threads.Worker('./lcd_thread.js', { workerData: { device: config.device, poll: config.poll, refresh: config.refresh, heartbeat: config.heartbeat }}),

                unsaved_changes    : false,

                // helpers to keep things consistant between here and api
                pending_redraw     : (state) => state.redraw_count < state.redraw_want,
                force_redraw       : (state) => state.redraw_want++,
                done_redraw        : (state) => state.redraw_count < state.redraw_want ? state.redraw_count++ : state.redraw_count
            };

            initialize(_state, config, theme).then(() => {

                const _screen = theme.screens[_state.screen_index];

                _screen.widgets.sort((a, b) => a.id - b.id);

                if (_screen.led_config) {

                    config.led_config.theme = _screen.led_config.theme || 4;    // off by default
                    config.led_config.intensity = _screen.led_config.intensity || 3;
                    config.led_config.speed = _screen.led_config.speed || 3;
                }

                _state.lcd_thread.on('message', message => {

                    lcd_thread_status(_state, theme, message);
                });

                init_web_gui(_state, config, theme).then(() => {

                    start_draw_canvas(_state, config, theme);
                });

            }, err => {

                logger.error('initialization failed');
            });

        }, err => {

            logger.error('failed to load ' + config.theme);
        });

    }, err => {

        logger.error('failed to load config.json');
    });
}

logger.info('starting up ' + __filename);

main();
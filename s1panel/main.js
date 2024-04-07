#!/usr/bin/env node
'use strict';
/*!
 * s1panel - lcd_device
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads     = require('worker_threads');
const fs          = require('fs');
const http        = require('http');

const express     = require('express');
const node_hid    = require('node-hid');
const node_canvas = require('canvas');

const lcd         = require('./lcd_device');
const logger      = require('./logger');
const api         = require('./api');

const usb_hid = node_hid.HIDAsync;

const START_COOL_DOWN = 3000;


function get_hr_time() {

    return Math.floor(Number(process.hrtime.bigint()) / 1000000);
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

function next_update_region(handle, context, state, config, fulfill) {

    if (!state.change_count) {

        state.last_activity = get_hr_time();
        return fulfill();
    }

    const _change = state.changes[0];
    const _rect = translate_rect(config.portrait, _change, config.canvas.height);

    const _image = context.getImageData(_rect.x, _rect.y, _rect.width, _rect.height);

    if (config.debug_update) {

        _image.data.fill(Math.floor(Math.random() * 65025) + 1);
    }

    state.changes.shift();
    state.change_count--;

    lcd.refresh(handle, _rect.x, _rect.y, _rect.width, _rect.height, _image).then(() => {

        // intentionally blank
    
    }, err => {

        //console.log({ x: _rect.x, y: _rect.y, w: _rect.width, h: _rect.height });
        logger.error('next_update_region: lcd.refresh error ' + err);

    }).finally(() => {

        next_update_region(handle, context, state, config, fulfill);        
    });
}

function start_update_screen(handle, context, state, config, fulfill) {

    const _start = get_hr_time();
    const _count = state.change_count;

    next_update_region(handle, context, state, config, () => {

        state.stat_update = get_hr_time() - _start;
        state.stat_count = _count;
        fulfill(_count ? true : false);
    });
}

function fullscreen_redraw(handle, context, state, config, fulfill) {
    
    const _now = get_hr_time();
    const _last_heartbeat = _now - state.last_heartbeat;

    if (_last_heartbeat > config.heartbeat) {

        //console.log('heartbeat forced = ' + _last_heartbeat);

        lcd.heartbeat(handle).then(() => {

            const _finished = get_hr_time();

            state.last_activity = _finished;
            state.last_heartbeat = _finished;

            //fulfill();
            setTimeout(fulfill, 1000);

        }, err => {

            logger.error('fullscreen_redraw: lcd.heartbeat error ' + err);
            fulfill();
        });
    }
    else {

        //console.log('lcd_redraw forced = ' + _last_heartbeat);

        lcd.redraw(handle, context.getImageData(0, 0, config.canvas.width, config.canvas.height)).then(() => {

            const _finished = get_hr_time();

            state.last_activity = _finished;
            state.full_draw = false;

            fulfill(true);

        }, err => {

            logger.error('fullscreen_redraw: lcd.redraw error ' + err);
            fulfill();
        });
    }
}

function update_device_screen(handle, context, state, config, theme) {

    return new Promise((fulfill, reject) => {

        const _now = get_hr_time();
        const _last_activity = _now - state.last_activity;
        
        if (_last_activity > config.refresh) {

            if (state.update_orientation) {
                
                config.portrait = theme.orientation === 'portrait';

                return lcd.set_orientation(handle, config.portrait).then(() => {
                    
                    const _finished = get_hr_time();
    
                    state.last_activity = _finished;
                    state.update_orientation = false;
                    state.full_draw = true; // next cycle redraw the whole screen...       

                    logger.info('update_device_screen: device orientation set to ' + (config.portrait ? 'portrait' : 'landscape'));

                }, err => {

                    logger.error('update_device_screen: set_orientation failed ' + err);

                }).finally(fulfill);
            }
            else if (state.full_draw) {

                fullscreen_redraw(handle, context, state, config, fulfill);
            }        
            else if (state.change_count) {
                
                const _last_heartbeat = _now - state.last_heartbeat;

                if (_last_heartbeat > config.heartbeat) {
                    
                    //console.log('heartbeat forced = ' + _last_heartbeat);

                    return lcd.heartbeat(handle).then(() => {

                        const _finished = get_hr_time();
    
                        state.last_activity = _finished;
                        state.last_heartbeat = _finished;
    
                    }, err => {
    
                        logger.error('update_device_screen: lcd.heartbeat error ' + err);
    
                    }).finally(fulfill);
                }

                //console.log('update last idle = ' + _last_activity);

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
                        start_update_screen(handle, context, state, config, fulfill);
                        break;

                    case 'row':
                        fulfill();
                        break;

                    case 'column':
                        fulfill();
                        break;

                    case 'gridx':
                        fulfill();
                        break;

                    case 'gridy':
                        fulfill();
                        break;

                    default:
                        fulfill();
                        break;
                }
            }
            else {

                //console.log('heartbeat idle = ' + _last_activity);

                lcd.heartbeat(handle).then(() => {

                    const _finished = get_hr_time();

                    state.last_activity = _finished;
                    state.last_heartbeat = _finished;

                }, err => {

                    logger.error('update_device_screen: lcd.heartbeat error ' + err);

                }).finally(fulfill);
            }
        }
        else {
            fulfill();
        }
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
            state.full_draw = true;
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
                const _area = {
                    x: _areaX,
                    y: _areaY,
                    width: Math.min(_area_width, rect.width - j * _area_width),
                    height: Math.min(_area_height, rect.height - i * _area_height)
                };

                _chunks.push(_area);
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

function next_draw_widgets(handle, context, state, config, widgets, index, total, fulfill) {

    const _widget_config = widgets[index];

    if (index < total) {

        var _sensor_reading = Promise.resolve();

        if (_widget_config.refresh && _widget_config.sensor) {

            const _sensor = state.sensors[_widget_config.value];
            
            if (_sensor) {
                _sensor_reading = _sensor.sample(_widget_config.refresh, _widget_config.format);  
            }          
        }

        _sensor_reading.then(sensor => {
            
            const _widget = state.widgets[_widget_config.name];
            const _value = sensor ? sensor.value : _widget_config.value;
            const _min = sensor ? sensor.min : 0;
            const _max = sensor ? sensor.max : 0;

            var _draw_promise = Promise.resolve(false);            

            if (_widget) {
                
                _draw_promise = _widget.draw(context, _value, _min, _max, _widget_config);
            }

            _draw_promise.then(changed => {

                if (!state.full_draw && changed) {
                
                    calc_update_region(fix_rect_bounds(config, _widget_config.rect)).forEach(each => {

                        state.changes.push(each);
                        state.change_count++;
                    });                    
                }

                next_draw_widgets(handle, context, state, config, widgets, 1 + index, total, fulfill);
            });
        });
    }
    else {
        fulfill(); // we are done
    }
}

function load_wallpaper(context, state, config, screen) {

    return new Promise((fulfill, reject) => {

        if (screen.background) {

            context.fillStyle = screen.background;
            context.rect(0, 0, config.canvas.width, config.canvas.height);
            context.fill();
        }
        
        if (screen.wallpaper) { 
        
            if (state.wallpaper_image) {

                return fulfill(state.wallpaper_image);
            }

            node_canvas.loadImage(screen.wallpaper).then(image => {

                state.wallpaper_image = image;

                return fulfill(state.wallpaper_image);
            });
        }
        else {
            fulfill();
        }
    });
}

function draw_screen(handle, context, state, config, screen) {
    
    return new Promise((fulfill, reject) => {

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

            next_draw_widgets(handle, context, state, config, screen.widgets, 0, screen.widgets.length, () => {

                fulfill();
            });
        });
    });
}

function update_led_strip(state, config) {

    return new Promise((fulfill, reject) => {

        if (!state.update_led) {
            return fulfill();
        }

        // led strip manipulation is done on a seperate thread...
        state.led_thread.postMessage(config.led_config);
        state.update_led = false;

        fulfill();
    });
}

function start_draw_canvas(handle, state, config, theme) {

    if (theme.refresh === 'redraw') {
        state.full_draw = true;
    }

    const _context = state.canvas_context[state.active_context];

    // pick a screen and draw it
    draw_screen(handle, _context, state, config, fetch_screen(state, config, theme)).then(() => {

        // update lcd screen
        update_device_screen(handle, _context, state, config, theme).then(device_updated => {
            
            state.output_context.putImageData(_context.getImageData(0, 0, config.canvas.width, config.canvas.height), 0, 0);

            if (device_updated) {
                
                state.active_context ^= 1;  // flip buffer to use
            }
            
            update_led_strip(state, config).then(() => {

                setTimeout(() => {

                    start_draw_canvas(handle, state, config, theme);
                
                }, config.poll);
            });            
        });    
    });
}

function initialize(handle, state, config, theme) {
    
    config.widgets.forEach(widget => {

        const _file = './' + widget;
        const _module = require(_file);

        if (_module) {
            
            const _name = _module.info().name;

            logger.info('initialize: widget ' + _name + ' loaded...');

            state.widgets[_name] = _module;
        }
    });

    config.sensors.forEach(sensor => {

        const _file = './' + sensor.module;
        const _module = require(_file);

        if (_module) {
            
            const  _name = _module.init(sensor.config);
            
            logger.info('initialize: sensor ' + _name + ' loaded...');
            
            state.sensors[_name] = _module;
        }
    });

    config.portrait = theme.orientation === 'portrait';

    logger.info('initialize: device orientation is ' + theme.orientation);

    // sort screens by id
    theme.screens.sort((a, b) => a.id - b.id);
    
    return lcd.heartbeat(handle);
}

function init_web_gui(state, config, theme) {

    return new Promise((fulfill, reject) => {

        const web = express();

        const _listen = config.listen.split(':');
        const _ip = _listen[0];
        const _port = Number(_listen[1]);
        
        web.use(express.static('gui/dist'));
        web.use(express.json());

        api.init(web, { state, config, theme });

        http.createServer(web).listen(_port, _ip, () => {

            logger.info('initialize: gui started on ' + _ip + ':' + _port);
            fulfill();
        });
    });
}

function main() {

    node_hid.setDriverType('libusb');

    load_config('config.json').then(config => {

        load_config(config.theme).then(theme => {
            
            usb_hid.open(config.device).then(handle => {

                const _output_canvas = node_canvas.createCanvas(config.canvas.width, config.canvas.height);
                const _canvas1 = node_canvas.createCanvas(config.canvas.width, config.canvas.height).getContext('2d', { pixelFormat: config.canvas.pixel });
                const _canvas2 = node_canvas.createCanvas(config.canvas.width, config.canvas.height).getContext('2d', { pixelFormat: config.canvas.pixel });

                const _state = {

                    widgets            : {},
                    sensors            : {},
                    last_heartbeat     : get_hr_time(),
                    last_activity      : get_hr_time(),
                    output_canvas      : _output_canvas,
                    output_context     : _output_canvas.getContext('2d', { pixelFormat: config.canvas.pixel }),
                    active_context     : 0,
                    canvas_context     : [ _canvas1, _canvas2 ],            
                    change_screen      : 0,     // index of forced screen change
                    screen_paused      : false, // pause screen change         
                    screen_index       : 0,     // array index into screens, not screen id
                    screen_start       : get_hr_time(),   
                    full_draw          : true,
                    update_orientation : true,
                    change_count       : 0,
                    changes            : [],
                    wallpaper_image    : null,
                    update_led         : true,
                    led_thread         : new threads.Worker('./led_thread.js', { workerData: config.led_config })
                };

                initialize(handle, _state, config, theme).then(() => {
            
                    const _screen = theme.screens[_state.screen_index];

                    if (_screen.led_config) {
                        config.led_config.theme = _screen.led_config.theme || 4;
                        config.led_config.intensity = _screen.led_config.intensity || 3;
                        config.led_config.speed = _screen.led_config.speed || 3;
                    }

                    _screen.widgets.sort((a, b) => a.id - b.id);

                    init_web_gui(_state, config, theme).then(() => {
            
                        start_draw_canvas(handle, _state, config, theme);
                    });
                
                }, err => {
                    
                    logger.error('initialization failed');
                });

            }, err => {

                logger.error('failed to open usbhid ' + config.device);
            });

        }, err => {

            logger.error('failed to load ' + config.theme);
        });
        
    }, err => {

        logger.error('failed to load config.json');
    });
}

logger.info('starting up ' + __filename);

// cool down period
setTimeout(main, START_COOL_DOWN);
'use strict';
/*!
 * s1panel - api
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const node_canvas = require('canvas');
const logger      = require('./logger');
const fs          = require('fs');
const path        = require('path');
const multer      = require('multer');
const upload      = multer();

const service = process.env.SERVICE || false;

function set_dirty(context, redraw) {

    const _state = context.state;

    if (redraw) {
        _state.force_redraw(_state);
    }
                       
    _state.screen_paused = true;
    _state.unsaved_changes = true;
}

function find_theme_screen(context, id) {

    const _theme = context.theme;

    return _theme.screens.find(screen => screen.id === id);
}

function find_screen_widget(screen, id) {

    if (screen) {
        return screen.widgets.find(widget => widget.id === id);
    }
}

function find_widget(context, screen, widget) {
    
    return find_screen_widget(find_theme_screen(context, screen), widget);
}

function get_theme_dir(context) {

    const _config = context.config;

    return path.dirname(_config.theme);
}

function get_theme_file_path(context, file) {

    return get_theme_dir(context) + '/' + file;
}

function get_widget_list(context) {

    return new Promise((fulfill, reject) => {

        const _state = context.state;
        const _list = [];

        Object.getOwnPropertyNames(_state.widgets).forEach(each => {

            const _widget = _state.widgets[each];
            const _info = _widget.info();

            // standard required fields are added here...
            _info.fields = [].concat([ 

                { name: 'name',        value: 'string'   },
                { name: 'rect',        value: 'rect'     },
                { name: 'sensor',      value: 'reserved' },
                { name: 'value',       value: ('image' === _info.name ? 'image' : 'string') },
                { name: 'format',      value: 'string'   },
                { name: 'refresh',     value: 'clock'    },
                { name: 'debug_frame', value: 'reserved' }

            ], _info.fields);

            _list.push(_info);
        });

        fulfill(_list);
    });
}

function get_config(context) {

    return new Promise(fulfill => {
        
        const _state = context.state;

        fulfill({ ...context.config, unsaved_changes: _state.unsaved_changes });
    });
}

function get_lcd_screen(context) {

    return new Promise(fulfill => {

        const _state = context.state;

        fulfill(_state.output_canvas.toBuffer('image/png', { compressionLevel: 3, filters: node_canvas.PNG_FILTER_NONE }));
    });
}

function get_sensor_list(context) {
    
    return new Promise(fulfill => {

        const _state = context.state;
        const _list = [];

        Object.getOwnPropertyNames(_state.sensors).forEach(each => {

            _list.push({ name: each, value: each });
        });

        fulfill(_list);
    });
}

function get_theme(context) {

    return new Promise(fulfill => {

        fulfill(JSON.parse(JSON.stringify(context.theme, (key, value) => '_private' === key ? undefined : value, 3)));
    });
}

function get_active_screen(context) {

    return new Promise(fulfill => {

        const _theme = context.theme;
        const _state = context.state;
        const _screen = _theme.screens[_state.screen_index];

        fulfill({ id: _screen.id });
    });
}

function toggle_debug_rect(context, request) {

    return new Promise((fulfill, reject) => {

        const _widget = find_widget(context, request.screen, request.widget);

        if (_widget) {

            _widget.debug_frame = !_widget.debug_frame;

            set_dirty(context, true);

            return fulfill({ value: _widget.debug_frame });
        }

        reject(); 
    });
}

function adjust_rect(context, request) {

    return new Promise((fulfill, reject) => {

        const _widget = find_widget(context, request.screen, request.widget);

        if (_widget) {

            _widget.rect.x = request.rect.x;
            _widget.rect.y = request.rect.y;
            _widget.rect.width = request.rect.width;
            _widget.rect.height = request.rect.height;

            set_dirty(context, true);

            return fulfill();
        }

        reject();
    });
}

function update_property(context, request) {

    return new Promise((fulfill, reject) => {

        const _widget = find_widget(context, request.screen, request.widget);

        if (_widget) {
            
            const _value = _widget[request.key] = request.value;

            if ('value' === request.key && _value.sensor) {

                _widget.sensor = false;       
            }

            set_dirty(context);
            
            return fulfill({ value: _value });
        }
        
        reject();
    });
}

function set_sensor(context, request) {

    return new Promise((fulfill, reject) => {

        const _widget = find_widget(context, request.screen, request.widget);

        if (_widget) {

            _widget.value = request.sensor;
            _widget.sensor = true;

            set_dirty(context);

            return fulfill({ value: _widget.value });
        }

        reject();
    });
}

function set_background(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);
        
        if (_screen) {

            _screen.background = request.value;    

            set_dirty(context, true);
    
            return fulfill({ value: _screen.background });
        }

        reject();
    });
}


function set_led_settings(led_config, request) {

    var _changed = false;

    if (request) {

        if (request.theme !== led_config.theme) {

            led_config.theme = request.theme;
            _changed = true;
        }

        if (request.intensity !== led_config.intensity) {

            led_config.intensity = request.intensity;
            _changed = true;
        }

        if (request.speed !== led_config.speed) {

            led_config.speed = request.speed;
            _changed = true;
        }
    }

    return _changed;
}

function set_led_strip(context, request) {

    return new Promise((fulfill, reject) => {

        const _state = context.state;
        const _config = context.config;
        const _led_config = _config.led_config;
        
        if (request.screen) {

            const _screen = find_theme_screen(context, request.screen);

            if (_screen) {
                
                if (!_screen.led_config) {
                    _screen.led_config = {};
                }

                set_led_settings(_screen.led_config, request);
                set_dirty(context);
            }            
        }

        set_led_settings(_led_config, request);

        _state.update_led = true;

        read_file('config.json').then(buffer => {

            const _file_config = JSON.parse(buffer);
            
            _file_config.led_config = _led_config;

            return write_file('config.json', JSON.stringify(_file_config, null, 3)).then(() => {

                logger.info('api set_led_strip: config.json updated');
                
                fulfill({ theme: _led_config.theme, intensity: _led_config.intensity, speed: _led_config.speed, dirty: true });
            
            }, reject);
        
        }, reject); 
    });
}

function get_led_strip(context) {
    
    return new Promise(fulfill => {
        
        const _config = context.config;
        const _led_config = _config.led_config;

        fulfill({ theme: _led_config.theme, intensity: _led_config.intensity, speed: _led_config.speed });
    });
}

function set_orientation(context, request) {

    return new Promise(fulfill => {

        const _theme = context.theme;
        const _state = context.state;

        if (request.orientation !== _theme.orientation) {

            switch (request.orientation) {

                case 'portrait':
                    _theme.orientation = 'portrait';
                    break;

                case 'landscape':
                    _theme.orientation = 'landscape';
                    break;
            }

            _state.update_orientation = true;

            set_dirty(context, true);
        }

        fulfill({ orientation: _theme.orientation });
    });
}

function set_refresh(context, request) {

    return new Promise(fulfill => {

        const _theme = context.theme;
        const _config = context.config;

        if (request.refresh !== _theme.refresh) {

            switch (request.refresh) {

                case 'redraw':
                    _config.refresh_method = _theme.refresh = 'redraw';
                    break;

                case 'update':
                    _config.refresh_method = _theme.refresh = 'update';
                    break;
            }

            set_dirty(context);
        }

        fulfill({ refresh: _theme.refresh });
    });
}

function set_screen_name(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            _screen.name = request.name;

            set_dirty(context);

            return fulfill({ name: _screen.name });
        }

        reject();
    });
}

function set_screen_duration(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            _screen.duration = request.duration;

            set_dirty(context);

            return fulfill({ duration: _screen.duration });
        }

        reject();
    });
}

function get_last_screen_id(screens) {

    var _id = 0;
    
    screens.forEach(each => { 
        _id = Math.max(_id, each.id); 
    });
    
    return _id;
}


function add_screen(context, request) {

    return new Promise((fulfill, reject) => {

        const _theme = context.theme;

        const _screen = { id: 1 + get_last_screen_id(_theme.screens), name: request.name, background: '#000000', duartion: 0, widgets: [] };

        _theme.screens.push(_screen);

        set_dirty(context);

        fulfill(_screen);
    });
}

function remove_screen(context, request) {

    return new Promise(fulfill => {

        const _state = context.state;
        const _theme = context.theme;

        const _current_screen = _theme.screens[_state.screen_index];
        
        _theme.screens = _theme.screens.filter(each => each.id !== request.id);
        
        // adjust screen_index to new array
        for (var i = 0; i < _theme.screens.length; i++) {
            
            const _screen = _theme.screens[i];
            
            if (_screen.id === _current_screen.id) {
                _state.change_screen = _state.screen_index = i;
                break;
            }
        }

        set_dirty(context);

        fulfill();
    });
}

function get_config_dirty(context) {

    return new Promise(fulfill => {

        const _state = context.state;

        fulfill({ unsaved_changes: _state.unsaved_changes || false });
    });
}

function next_screen(context, request) {

    return new Promise(fulfill => {

        const _state = context.state;
        const _theme = context.theme;
        const _count = _theme.screens.length;

        // calculate the "next" screen
        var _next_screen_index = _state.screen_index + 1;
        if (_next_screen_index >= _count) {

            _next_screen_index = 0;
        }

        var _id = 0;

        for (var i = 0; i < _theme.screens.length; i++) {

            var _screen = _theme.screens[i];

            if (request.id) {
                // if id was passed, use that
                if (_screen.id === request.id) {

                    _id = _screen.id;
                    _next_screen_index = i;
                    break;
                }
            }
            else if (i === _next_screen_index) { 
                // pick based on next screen
                _id = _screen.id;
                break;
            }
        }

        _state.change_screen = _next_screen_index;

        fulfill({ id: _id });
    });
}

function get_random_color() {

    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
  
    const _hex_r = r.toString(16).padStart(2, '0');
    const _hex_g = g.toString(16).padStart(2, '0');
    const _hex_b = b.toString(16).padStart(2, '0');
    
    return '#' + _hex_r + _hex_g + _hex_b;  
}

function get_last_widget_id(widgets) {

    var _id = 0;
    
    widgets.forEach(widget => { 
        _id = Math.max(_id, widget.id); 
    });
    
    return _id;
}

function make_blank_widget(id, info) {

    const _obj = {
        id: id,
        group: 1,
        name: info.name,
        rect: { "x": 10, "y": 10, "width": 50, "height": 50 },
        sensor: false,
        value: '',
        format: '',
        refresh: 1000,
        debug_frame: true
    };

    info.fields.forEach(field => {

        switch (field.value) {

            case 'color':
                _obj[field.name] = get_random_color();
                break;

            case 'reserved':
            case 'boolean':
                _obj[field.name] = false;
                break;

            case 'clock':
            case 'number':
                _obj[field.name] = 0;
                break;

            case 'font':
                _obj[field.name] = '18px Arial';
                break;

            default:
                {
                    const _syntax = field.value.split(':');

                    if (_syntax.length > 1) {                                    

                        if ('list' === _syntax[0]) {
                            _obj[field.name] = _syntax[1].split(',')[0];
                        }
                    }
                    else {
                        _obj[field.name] = '';
                    }                
                }
                break;
        }
    });

    return _obj;
}

function add_widget(context, request) {

    return new Promise((fulfill, reject) => {

        const _state = context.state;
    
        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            const _name = Object.getOwnPropertyNames(_state.widgets).find(name => name === request.name);     

            if (_name) {

                const _widget = _state.widgets[_name];
                const _new_widget = make_blank_widget(1 + get_last_widget_id(_screen.widgets), _widget.info());
                
                _screen.widgets.push(_new_widget);

                set_dirty(context, true);
                
                return fulfill(_new_widget);
            }
        }

        reject();
    });
}

function delete_widget(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            _screen.widgets = _screen.widgets.filter(widget => widget.id !== request.widget);

            set_dirty(context, true);

            return fulfill();
        }
        
        reject();
    });
}

function read_png(file_path) {

    return new Promise((fulfill, reject) => {

        fs.readFile(file_path, (err, data) => {
            
            if (err) {
                return reject();
            }

            fulfill(data);
        });
    });
}

function get_wallpaper(context, request) {
    
    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, Number(request.screen));

        if (_screen) {

            return read_png(_screen.wallpaper).then(data => {
                
                fulfill(data);
            
            }, reject);            
        }

        reject();
    });
}

function get_image(context, request) {
    
    return new Promise((fulfill, reject) => {

        const _widget = find_widget(context, Number(request.screen), Number(request.widget));

        if (_widget) {

            return read_png(_widget.value).then(data => {
                    
                fulfill(data);
            
            }, reject);
        }

        reject();
    });
}

function clear_wallpaper(context, request) {
    
    return new Promise((fulfill, reject) => {
        
        const _screen = find_theme_screen(context, Number(request.screen));

        if (_screen) {

            delete _screen.wallpaper;

            set_dirty(context, true);

            return fulfill();
        }

        reject();
    });            
}

function clear_image(context, request) {

    return new Promise((fulfill, reject) => {

        const _widget = find_widget(context, Number(request.screen), Number(request.widget));

        if (_widget) {

            _widget.value = null;

            set_dirty(context, true);

            return fulfill();
        }

        reject();
    });
}

function write_file(file_path, buffer) {

    return new Promise((fulfill, reject) => {

        fs.writeFile(file_path, buffer, (err) => {

            if (err) {

                logger.error('api write_file: error saving file ' + file_path + ' to disk ' + err);
                return reject();
            }
            
            fulfill(); 
        });
    });
}

function read_file(file_path) {

    return new Promise((fulfill, reject) => {
        
        fs.readFile(file_path, (err, buffer) => {

            if (err) {

                logger.error('api read_file: error reading file ' + file_path + ' from disk ' + err);
                return reject();
            }

            fulfill(buffer);
        });
    });
}

function save_config(context, request) {
    
    return new Promise((fulfill, reject) => {

        read_file('config.json').then(buffer => {

            const _file_config = JSON.parse(buffer);
            const _live_config = context.config;

            var _changed = false;
            var _restart = false;

            if (request.listen && 0 !== _live_config.listen.localeCompare(request.listen)) {
                
                _live_config.listen = _file_config.listen = request.listen;
                _changed = true;
                _restart = true;
            }
    
            if (request.poll && _live_config.poll !== request.poll) {

                _live_config.poll = _file_config.poll = request.poll;
                _changed = true;
            }

            if (request.refresh && _live_config.refresh !== request.refresh) {

                _live_config.refresh = _file_config.refresh = request.refresh;
                _changed = true;
            }

            if (request.heartbeat && _live_config.heartbeat !== request.heartbeat) {

                _live_config.heartbeat = _file_config.heartbeat = request.heartbeat;
                _changed = true;
            }

            if (_changed) {
                
                return write_file('config.json', JSON.stringify(_live_config, (key, value) => '_private' === key ? undefined : value, 3)).then(() => {

                    logger.info('api: config.json updated');

                    if (service && _restart) {
                        process.exit(1);
                    }

                    return fulfill(_live_config);
                });
            }

            fulfill(_live_config);
        
        }, reject);
    });            
}

function theme_save(context) {

    return new Promise((fulfill, reject) => {
        
        const _state = context.state;
        const _config = context.config;
        const _theme = context.theme;

        return write_file(_config.theme, JSON.stringify(_theme, (key, value) => '_private' === key ? undefined : value, 3)).then(() => {

            logger.info('api: theme ' + _config.theme + ' saved');

            _state.screen_paused = false;
            _state.unsaved_changes = false;
        
            fulfill(_theme);
        
        }, reject);
    });
}

function theme_revert(context) {

    return new Promise((fulfill, reject) => {

        const _state = context.state;
        const _config = context.config;

        read_file(_config.theme).then(buffer => {

            const _theme = JSON.parse(buffer);
            const _screen = _theme.screens[0];
            
            _screen.widgets.sort((a, b) => a.id - b.id);
            
            _state.update_orientation = true;
            _state.redraw_want++;
            _state.screen_index = _state.change_screen = 0;
            
            if (_screen.led_config) {
                _config.led_config.theme = _screen.led_config.theme || 4;
                _config.led_config.intensity = _screen.led_config.intensity || 3;
                _config.led_config.speed = _screen.led_config.speed || 3;
                _state.update_led = true;
            }
            
            context.theme.orientation = _theme.orientation;
            context.theme.refresh = _theme.refresh;
            context.theme.screens = _theme.screens;

            _state.force_redraw(_state);
            _state.unsaved_changes = false;

            logger.info('api: theme reverted back from ' + _config.theme);
        
            fulfill(_theme);
        
        }, reject);
    });
}

function up_widget(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            var _previous = null; 

            _screen.widgets.find(widget => {

                if (_previous && widget.id === request.widget) {

                    widget.id = [_previous.id, _previous.id = widget.id][0];
                    return true;
                }

                _previous = widget;
            });

            _screen.widgets.sort((a, b) => a.id - b.id);

            set_dirty(context, true);

            return fulfill();
        }
        reject();
    });
}

function down_widget(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            var _previous = null;

            _screen.widgets.find(widget => {

                if (_previous && _previous.id === request.widget) {

                    widget.id = [_previous.id, _previous.id = widget.id][0];
                    return true;
                }

                _previous = widget;
            });
            
            _screen.widgets.sort((a, b) => a.id - b.id);
            
            set_dirty(context, true);
            
            return fulfill();
        }
        reject();
    });
}

function top_widget(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            var _count = 2;

            _screen.widgets.forEach(widget => {

                widget.id = (widget.id === request.widget) ? 1 : _count++; 
            });

            _screen.widgets.sort((a, b) => a.id - b.id);
            
            set_dirty(context, true);

            return fulfill();
        }

        reject();
    });
}

function bottom_widget(context, request) {

    return new Promise((fulfill, reject) => {

        const _screen = find_theme_screen(context, request.screen);

        if (_screen) {

            var _count = 1;

            _screen.widgets.forEach(widget => {

                widget.id = (widget.id === request.widget) ? _screen.widgets.length : _count++; 
            });
    
            _screen.widgets.sort((a, b) => a.id - b.id);
            
            set_dirty(context, true);

            return fulfill();
        }

        reject();
    });
}

function upload_image(context, req, res) {
            
    return new Promise((fulfill, reject) => {
        
        const _request = req.query;
        const _file = req.files[0];                        

        const _widget = find_widget(context, Number(_request.screen), Number(_request.widget));

        if (_widget) {

            const _file_path = get_theme_file_path(context, _file.originalname);

            return write_file(_file_path, _file.buffer).then(() => {

                _widget.value = _file_path;

                set_dirty(context, true);

                fulfill({ value: _file_path, id: _widget.id });
            
            }, reject);
        }

        reject();

    }).then(obj => {

        res.type('application/json').status(201).send({ value: obj.value, widget: obj.id });

    }, () => {

        res.status(500).end();
    });
}

function upload_wallpaper(context, req, res) {

    return new Promise((fulfill, reject) => {

        const _state = context.state;

        const _request = req.query;
        const _file = req.files[0];            

        const _screen = find_theme_screen(context, Number(_request.screen));

        if (_screen) {

            const _file_path = get_theme_file_path(context, _file.originalname);

            return write_file(_file_path, _file.buffer).then(() => {
                                        
                node_canvas.loadImage(_file_path).then(image => {
                                        
                    _screen.wallpaper = _file_path;                    
                    _state.wallpaper_image = image;    
                    
                    set_dirty(context, true);

                    fulfill(_file_path);
                });
            
            }, reject);
        }

        reject();

    }).then(value => {

        res.type('application/json').status(201).send({ value: value });

    }, () => {

        res.status(500).end();
    });
}

function callback_wrapper(method, url, req, res, callback, type, context) {

    const _request = (method === 'get' ? req.query : req.body);

    callback(context, _request).then(respone => {

        res.type(type).status(200).send(respone || {});
    
    }, err => {

        logger.error('api: request ' + url + ' error ' + err);
        res.status(500).end();
    });
}

module.exports.init = function(web, context) {

    [
        { method: 'get',  url: '/api/config',              type: 'application/json', callback: get_config },
        { method: 'get',  url: '/api/theme',               type: 'application/json', callback: get_theme },
        { method: 'get',  url: '/api/screen',              type: 'application/json', callback: get_active_screen },
        { method: 'get',  url: '/api/lcd_screen',          type: 'image/png',        callback: get_lcd_screen },
        { method: 'get',  url: '/api/image',               type: 'image/png',        callback: get_image },
        { method: 'get',  url: '/api/wallpaper',           type: 'image/png',        callback: get_wallpaper },
        { method: 'get',  url: '/api/widget_list',         type: 'application/json', callback: get_widget_list },
        { method: 'get',  url: '/api/sensor_list',         type: 'application/json', callback: get_sensor_list },
        { method: 'get',  url: '/api/config_dirty',        type: 'application/json', callback: get_config_dirty },
        { method: 'post', url: '/api/toggle_debug_frame',  type: 'application/json', callback: toggle_debug_rect },
        { method: 'post', url: '/api/adjust_rect',         type: 'application/json', callback: adjust_rect },
        { method: 'post', url: '/api/update_property',     type: 'application/json', callback: update_property },
        { method: 'post', url: '/api/set_background',      type: 'application/json', callback: set_background },
        { method: 'post', url: '/api/led_strip',           type: 'application/json', callback: set_led_strip },
        { method: 'get',  url: '/api/led_strip',           type: 'application/json', callback: get_led_strip },
        { method: 'post', url: '/api/set_orientation',     type: 'application/json', callback: set_orientation },
        { method: 'post', url: '/api/set_refresh',         type: 'application/json', callback: set_refresh },
        { method: 'post', url: '/api/set_screen_name',     type: 'application/json', callback: set_screen_name },
        { method: 'post', url: '/api/set_screen_duration', type: 'application/json', callback: set_screen_duration },
        { method: 'post', url: '/api/add_screen',          type: 'application/json', callback: add_screen },
        { method: 'post', url: '/api/remove_screen',       type: 'application/json', callback: remove_screen },
        { method: 'post', url: '/api/next_screen',         type: 'application/json', callback: next_screen },
        { method: 'post', url: '/api/add_widget',          type: 'application/json', callback: add_widget },
        { method: 'post', url: '/api/set_sensor',          type: 'application/json', callback: set_sensor },
        { method: 'post', url: '/api/delete_widget',       type: 'application/json', callback: delete_widget },
        { method: 'post', url: '/api/clear_wallpaper',     type: 'application/json', callback: clear_wallpaper },
        { method: 'post', url: '/api/clear_image',         type: 'application/json', callback: clear_image },
        { method: 'post', url: '/api/save_config',         type: 'application/json', callback: save_config },
        { method: 'post', url: '/api/theme_save',          type: 'application/json', callback: theme_save },
        { method: 'post', url: '/api/theme_revert',        type: 'application/json', callback: theme_revert },
        { method: 'post', url: '/api/up_widget',           type: 'application/json', callback: up_widget },
        { method: 'post', url: '/api/down_widget',         type: 'application/json', callback: down_widget },
        { method: 'post', url: '/api/top_widget',          type: 'application/json', callback: top_widget },
        { method: 'post', url: '/api/bottom_widget',       type: 'application/json', callback: bottom_widget },

    ].forEach(each => {

        switch (each.method) {

            case 'get':
                web.get(each.url, (req, res) => callback_wrapper(each.method, each.url, req, res, each.callback, each.type, context));
                break;

            case 'post':
                web.post(each.url, (req, res) => callback_wrapper(each.method, each.url, req, res, each.callback, each.type, context));
                break;
        }
    });

    web.post('/api/upload_image', upload.any(), (req, res) => upload_image(context, req, res));    
    web.post('/api/upload_wallpaper', upload.any(), (req, res) => upload_wallpaper(context, req, res));    
};

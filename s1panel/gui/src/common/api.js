/*!
 * s1panel-gui - api
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */

var _poll_time = 500;

function set_poll_time(ms) {
    _poll_time = ms;
}

function api_fetch_config() {

    return new Promise((fulfill, reject) => {

        fetch('/api/config').then(response => {

            response.json().then(config => {

                fulfill(config);
            });
        });            
    });
}

function api_fetch_theme() {

    return new Promise((fulfill, reject) => {

        fetch('/api/theme').then(response => {
        
            response.json().then(theme => {  

                fulfill(theme);             
            });
        });
    });
}

function api_fetch_screen() {

    return new Promise((fulfill, reject) => {

        fetch('/api/screen').then(response => {
        
            response.json().then(theme => {  

                fulfill(theme);             
            });
        });
    });
}

function api_fetch_widgets() {
    return new Promise((fulfill, reject) => {

        fetch('/api/widget_list').then(response => {
        
            response.json().then(list => {  

                fulfill(list);             
            });
        });
    });
}

function api_fetch_sensors() {
    return new Promise((fulfill, reject) => {

        fetch('/api/sensor_list').then(response => {
        
            response.json().then(list => {  

                fulfill(list);             
            });
        });
    });
}

function api_load_image() {

    return new Promise((fulfill, reject) => {

        const img = new Image();

        img.onload = () => {
            fulfill(img);
        };

        img.onerror = () => {
            reject();
        };

        img.src = '/api/lcd_screen?r' + new Date().getTime();
    });
}

function api_toggle_debug_frame(screen, id) {

    return new Promise((fulfill, reject) => {

        fetch('/api/toggle_debug_frame', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen: screen, widget: id })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

var _throttle_adjust_rect = null;

function api_adjust_rect(screen, id, rect) {

    return new Promise((fulfill, reject) => {

        if (_throttle_adjust_rect) {

            clearTimeout(_throttle_adjust_rect);
        }

        _throttle_adjust_rect = setTimeout(() => {

            fetch('/api/adjust_rect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen: screen, widget: id, rect: rect })}).then(response => {

                response.json().then(json => {  

                    fulfill(json);             
                });
            });

        }, _poll_time);
    });
}

var _throttle_update_property = [];

function api_update_property(screen, id, key, value) {

    return new Promise((fulfill, reject) => {

        if (_throttle_update_property[key]) {

            clearTimeout(_throttle_update_property[key]);
        }

        _throttle_update_property[key] = setTimeout(() => {

            fetch('/api/update_property', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen: screen, widget: id, key: key, value: value })}).then(response => {

                response.json().then(json => {  

                    fulfill(json);             
                });
            });

        }, _poll_time);
    }); 
}

var _throttle_set_background = null;

function api_set_background(screen, value) {

    return new Promise((fulfill, reject) => {

        if (_throttle_set_background) {

            clearTimeout(_throttle_set_background);
        }

        _throttle_set_background = setTimeout(() => {

            fetch('/api/set_background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, value })}).then(response => {

                response.json().then(json => {  

                    fulfill(json);             
                });
            });

        }, _poll_time);
    }); 
}

function api_set_sensor(screen, id, value) {

    return new Promise((fulfill, reject) => {

        fetch('/api/set_sensor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen: screen, widget: id, sensor: value })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_set_orientation(value) {

    return new Promise((fulfill, reject) => {

        fetch('/api/set_orientation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orientation: value })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_set_refresh(value) {

    return new Promise((fulfill, reject) => {

        fetch('/api/set_refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: value })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_fetch_config_dirty() {

    return new Promise((fulfill, reject) => {

        fetch('/api/config_dirty').then(response => {
        
            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

var _throttle_set_name = null;

function api_set_screen_name(screen, name) {

    return new Promise((fulfill, reject) => {

        if (_throttle_set_name) {

            clearTimeout(_throttle_set_name);
        }

        _throttle_set_name = setTimeout(() => {

            fetch('/api/set_screen_name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, name })}).then(response => {

                response.json().then(json => {  

                    fulfill(json);             
                });
            });

        }, _poll_time);
    }); 
}

var _throttle_set_duration = null;

function api_set_screen_duration(screen, duration) {

    return new Promise((fulfill, reject) => {

        if (_throttle_set_duration) {

            clearTimeout(_throttle_set_duration);
        }

        _throttle_set_duration = setTimeout(() => {

            fetch('/api/set_screen_duration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, duration })}).then(response => {

                response.json().then(json => {  

                    fulfill(json);             
                });
            });

        }, _poll_time);
    }); 
}

function api_add_screen(name) {

    return new Promise((fulfill, reject) => {

        fetch('/api/add_screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_remove_screen(id) {

    return new Promise((fulfill, reject) => {

        fetch('/api/remove_screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_next_screen(id) {

    return new Promise((fulfill, reject) => {

        fetch('/api/next_screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_add_widget(screen, name) {

    return new Promise((fulfill, reject) => {

        fetch('/api/add_widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, name })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_delete_widget(screen, widget) {

    return new Promise((fulfill, reject) => {

        fetch('/api/delete_widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, widget })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_clear_wallpaper(screen) {

    return new Promise((fulfill, reject) => {

        fetch('/api/clear_wallpaper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_clear_image(screen, widget) {

    return new Promise((fulfill, reject) => {

        fetch('/api/clear_image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, widget })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_save_config(config) {
   
    return new Promise((fulfill, reject) => {

        fetch('/api/save_config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config)}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_theme_save() {
 
    return new Promise((fulfill, reject) => {

        fetch('/api/theme_save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_theme_revert() {
  
    return new Promise((fulfill, reject) => {

        fetch('/api/theme_revert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

var _throttle_led_setting = null;

function api_set_led_strip(theme, intensity, speed, screen) {

    return new Promise((fulfill, reject) => {

        if (_throttle_led_setting) {

            clearTimeout(_throttle_led_setting);
        }

        _throttle_led_setting = setTimeout(() => {

            fetch('/api/led_strip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme, intensity, speed, screen })}).then(response => {

                response.json().then(json => {  

                    fulfill(json);             
                });
            });

        }, _poll_time);
    }); 
}

function api_get_led_strip() {

    return new Promise((fulfill, reject) => {

        fetch('/api/led_strip').then(response => {
        
            response.json().then(theme => {  

                fulfill(theme);             
            });
        });
    });
}

function api_up_widget(screen, widget) {

    return new Promise((fulfill, reject) => {

        fetch('/api/up_widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, widget })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_down_widget(screen, widget) {

    return new Promise((fulfill, reject) => {

        fetch('/api/down_widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, widget })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}

function api_top_widget(screen, widget) {

    return new Promise((fulfill, reject) => {

        fetch('/api/top_widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, widget })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}


function api_bottom_widget(screen, widget) {

    return new Promise((fulfill, reject) => {

        fetch('/api/bottom_widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screen, widget })}).then(response => {

            response.json().then(json => {  

                fulfill(json);             
            });
        });
    });
}


export default {
    set_poll_time       : set_poll_time,
    fetch_config        : api_fetch_config,
    fetch_theme         : api_fetch_theme,
    fetch_screen        : api_fetch_screen,
    fetch_widgets       : api_fetch_widgets,
    fetch_sensors       : api_fetch_sensors,
    load_image          : api_load_image,
    toggle_debug_frame  : api_toggle_debug_frame,
    adjust_rect         : api_adjust_rect,
    update_property     : api_update_property,
    set_background      : api_set_background,
    set_sensor          : api_set_sensor,
    set_orientation     : api_set_orientation,
    set_refresh         : api_set_refresh,
    fetch_config_dirty  : api_fetch_config_dirty,
    set_screen_name     : api_set_screen_name,
    set_screen_duration : api_set_screen_duration,
    add_screen          : api_add_screen,
    remove_screen       : api_remove_screen,
    next_screen         : api_next_screen,
    add_widget          : api_add_widget,
    delete_widget       : api_delete_widget,
    clear_wallpaper     : api_clear_wallpaper,
    clear_image         : api_clear_image,
    save_config         : api_save_config,
    theme_save          : api_theme_save,
    theme_revert        : api_theme_revert,
    set_led_strip       : api_set_led_strip,
    get_led_strip       : api_get_led_strip,
    up_widget           : api_up_widget,
    down_widget         : api_down_widget,
    top_widget          : api_top_widget,
    bottom_widget       : api_bottom_widget
};
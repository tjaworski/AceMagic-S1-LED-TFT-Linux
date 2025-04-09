'use strict';
/*!
 * s1panel - widget/weather_icon.js
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */
const node_canvas = require('canvas');
const logger = require('../logger');

const wmo_weather_icons = {
     0: { day: 'wi/forecast-io-clear-day',           night: 'wi/night-clear' },
     1: { day: 'wi/forecast-io-clear-day',           night: 'wi/night-clear' },
     2: { day: 'wi/forecast-io-partly-cloudy-day',   night: 'wi/forecast-io-partly-cloudy-night' },
     3: { day: 'wi/cloudy',                          night: 'wi/cloudy' },
    45: { day: 'wi/day-fog',                         night: 'wi/night-fog' },
    48: { day: 'wi/fog',                             night: 'wi/fog' },
    51: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    53: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    55: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    56: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    57: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    61: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    63: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    65: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    66: { day: 'wi/day-rain-mix',                    night: 'wi/night-rain-mix' },
    67: { day: 'wi/day-rain-mix',                    night: 'wi/night-rain-mix' },
    71: { day: 'wi/day-snow',                        night: 'wi/night-snow' },  
    73: { day: 'wi/day-snow',                        night: 'wi/night-snow' },
    75: { day: 'wi/day-snow',                        night: 'wi/night-snow' },
    77: { day: 'wi/day-snow',                        night: 'wi/night-snow' },
    80: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    81: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    82: { day: 'wi/day-rain',                        night: 'wi/night-rain' },
    85: { day: 'wi/day-snow',                        night: 'wi/night-snow' },
    86: { day: 'wi/day-snow',                        night: 'wi/night-snow' },
    95: { day: 'wi/day-thunderstorm',                night: 'wi/night-thunderstorm' },
    96: { day: 'wi/day-snow-thunderstorm',           night: 'wi/night-snow-thunderstorm' },
    99: { day: 'wi/day-snow-thunderstorm',           night: 'wi/night-snow-thunderstorm' },
};

const wind_direction_icons = {
    'N' : 'wi/direction-up',
    'NE': 'wi/direction-up-right',
    'E' : 'wi/direction-right',
    'SE': 'wi/direction-down-right',
    'S' : 'wi/direction-down',
    'SW': 'wi/direction-down-left',
    'W' : 'wi/direction-left',
    'NW': 'wi/direction-up-left'
};

const wind_directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const wind_direction_background = 'gis/compass';

function start_draw(context, rect) {
    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
}

function debug_rect(context, rect) {

    context.lineWidth = 1;
    context.strokeStyle = "red";
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.stroke();
}

function replaceRootSVGProperties(svgData, properties) {

    const groups = /^<svg ([^>]*)>/.exec(svgData);

    if (!groups) {
        return svgData;
    }

    const newProperties = [];

    for(let prop of groups[1].split(' ')) {

        let filteredOut = false;

        for (let key in properties) {

            if (prop.match(key)) {

                filteredOut = true;
                break;
            }
        }

        if (!filteredOut) {

            newProperties.push(prop);
        }
    }

    for (let key in properties) {
        
        const value = properties[key];
        newProperties.push(`${key}='${value}'`);
    }

    return svgData
        .replace(/^<svg [^>]*>/, `<svg ${newProperties.join(' ')}>`)
        .replaceAll(/[\r\n]+/g, '')
        .replaceAll(/fill=[\'\"]currentColor[\'\"]/g, `fill='${properties.fill || "currentColor"}'`);
}

function load_icon(name, _private) {

    return new Promise((fulfill, reject) => {

        const _slug = name;

        if (_private.icons[_slug]) {

            return fulfill(_private.icons[_slug]);
        }
        
        const _url = 'https://api.iconify.design/' + (_slug || 'carbon/document-unknown') + '.svg';

        fetch(_url).then(response => {

            if (response.status !== 200) {
           
                logger.error('error ' + response.status + ' for ' + _url);

                return reject();
            }

            return response.text().then(image => {

                _private.icons[_slug] = image;
    
                return fulfill(image);
            });
        
        }, error => {
            
            logger.error('error ' + error + ' for ' + _url);
            reject();
        });
    });
}

function get_private(config) {

    if (!config._private) {

        config._private = {
            icons: {}
        };
    }

    return config._private;
}

function draw(context, value, min, max, config) {

    return new Promise(fulfill => {

        const _private = get_private(config);
        const _rect = config.rect;
        const _color = config.color || '#ffffff';        
        const _value = Number(value || 0);        
        const _has_changed = _private.last_value !== _value ? true : false;
        var _icon = 'carbon/document-unknown';

        switch (config.type) {
            
            case 'weather':
                {
                    const _table = wmo_weather_icons[_value];
                    if (_table) {
                        _icon = max ? _table.day : _table.night;
                    }
                }
                break;
            
            case 'temperature':
                if (min) {
                    _icon = _value >= 70 ? 'hot' : (_value <= 50 ? 'snowflake-cold' : 'thermometer');
                }
                else {
                    _icon = _value >= 21 ? 'hot' : (_value <= 10 ? 'snowflake-cold' : 'thermometer');
                }
                break;
            
            case 'winddirection':
                {
                    const _index = Math.round(_value / 45) % 8;
                    const _direction = wind_directions[_index];
                    _icon = wind_direction_icons[_direction];                    
                }                
                break;
        }

        Promise.all([ load_icon(wind_direction_background, _private), load_icon(_icon, _private) ]).then(images => { 

            var _promises = [];

            if ('winddirection' === config.type) {

                const _image_bg = replaceRootSVGProperties(images[0], {
                    width: _rect.width,
                    height: _rect.height,
                    fill: _color,
                });
    
                _promises.push(node_canvas.loadImage('data:image/svg+xml,' + _image_bg));
            }

            const _image2 = replaceRootSVGProperties(images[1], {
                width: _rect.width,
                height: _rect.height,
                fill: _color,
            });

            _promises.push(node_canvas.loadImage('data:image/svg+xml,' + _image2));

            start_draw(context, _rect);

            Promise.all(_promises).then(loaded_images => {
        
                loaded_images.forEach(image => {
                    context.drawImage(image, _rect.x, _rect.y, _rect.width, _rect.height);
                });
                
            }, () => {

                // fetch failed 

            }).finally(() => {
                
                if (config.debug_frame) {
                    debug_rect(context, _rect);
                }
                
                if (_has_changed) {
                    _private.last_value = _value;
                }

                context.restore();

                fulfill(_has_changed);
            });
        
        }, () => {

            fulfill(false);
        });
    }); 
}

function info() {

    return {
        name: 'weather_icon',
        description: 'weather icon',
        fields: [
            { name: "type", value: "list:weather,temperature,winddirection" },
            { name: "color", value: "color" }
        ]
    };
}


module.exports = {
    info,
    draw
};
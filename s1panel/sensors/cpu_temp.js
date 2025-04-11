'use strict';
/*!
 * s1panel - sensor/cpu_temp
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */
const fs        = require('fs');
const path      = require('path');
const logger    = require('../logger');

var _fault = false;

var _max_points = 10;
var _fahrenheit = false;
var _last_sampled = 0;
var _history = [];
var _max_temp = 0;
var _min_temp = 0;

function read_file(path) {
  
    return new Promise((fulfill, reject) => {

        fs.readFile(path, 'utf8', (err, data) => {
            
            if (err) {
                return reject(err);
            }

            fulfill(data);
        });
    });
}

function celsius_fahrenheit(c) {
    return (c * 9/5) + 32;
}

function walk_directory(dir, cb) {

    return new Promise((fulfill, reject) => {
        
        fs.readdir(dir, (err, files) => {
            
            if (err) {
                return reject;
            }
            
            var _promises = [];

            files.forEach(file => {                
                _promises.push(cb(path.join(dir, file)));
            });
            
            Promise.all(_promises).then(fulfill, reject);
        });
    });
}

function cpu_temp() {

    return new Promise((fulfill, reject) => {

        const _hwmon = '/sys/class/hwmon/';

        // /sys/class/hwmon/
        // /sys/class/hwmon/hwmon1/name === 'coretemp'
        // /sys/class/hwmon/hwmon1/temp1_label === 'Package id 0'
        // /sys/class/hwmon/hwmon1/temp1_input 47000 / 1000 = C
        
        var _found_coretemp = false;
        var _path_coretemp = null;

        walk_directory(_hwmon, fullpath => {

            const _hwmon_name = path.join(fullpath, 'name');
            
            return read_file(_hwmon_name).then(name => {

                if (name.startsWith('coretemp')) {
                                        
                    _path_coretemp = fullpath;
                    _found_coretemp = true;
                }

                return Promise.resolve();

            }, reject);

        }).then(() => {

            if (_found_coretemp) {

                var _temp_path = null;
                var _temp_found = false;

                return walk_directory(_path_coretemp, fullpath => {
                    
                    if (fullpath.includes('temp') && fullpath.includes('label')) {

                        return read_file(fullpath).then(name => {
                        
                            if (name.startsWith('Package id 0')) {
                                _temp_path = fullpath;
                                _temp_found = true;
                            }
                        }, reject);
                    }
                    
                    return Promise.resolve();

                }).then(() => {

                    if (_temp_found) {

                        const _input_path = _temp_path.replace('_label', '_input');
                        const _max_path = _temp_path.replace('_label', '_max');

                        return Promise.all([read_file(_input_path), read_file(_max_path) ]).then(values => {

                            var _value = Number(values[0]) / 1000;
                            var _max = Number(values[1]) / 1000;

                            fulfill({ 
                                value: _fahrenheit ? celsius_fahrenheit(_value) : _value, 
                                max: _fahrenheit ? celsius_fahrenheit(_max) : _max 
                            });

                        }, reject);
                    }

                    fulfill();

                }, reject);

            }

            return fulfill();

        }, reject);
    });
}

function get_current_value(json) {

    if (!_max_temp) {

        if (json.max) {
            _max_temp = json.max;
        }
        else {
            _max_temp = _fahrenheit ? 230.0 : 105.0;
        }

        logger.info('initialize: cpu temp max set to ' + _max_temp);
    }

    if (!_min_temp) {

        if (json.min) {
            _min_temp = json.min;
        }
        else {
            _min_temp = _fahrenheit ? 70.0 : 21;
        }
        
        logger.info('initialize: cpu temp min set to ' + _min_temp);
    }

    return json.value;
}

function sample(rate, format) {

    return new Promise((fulfill, reject) => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;
        var _dirty = false;
        var _temp_promise = Promise.resolve();

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);

            _temp_promise = cpu_temp();
            _dirty = true;
        }

        _temp_promise.then(result => {

            if (result && _dirty) {
                
                var _value = get_current_value(result);

                if (!_history.length) {

                    for (var i = 0; i < _max_points; i++) {
                        _history.push(0);
                    }
                }

                _history.push(_value.toFixed(0));
                _history.shift();
            }

            const _output = format.replace(/{(\d+)}/g, function (match, number) { 
        
                switch (number) {

                    case '0':   // degrees
                        return _history[_history.length - 1];

                    case '1':   // history
                        return _history.join();  

                    case '2':
                        return _fahrenheit ? 'F' : 'C';  
                                 
                    default:
                        return 'null';
                }
            }); 

            fulfill({ value: _output, min: _min_temp, max: _max_temp });
        
        }, err => {

            if (!_fault) {

                logger.error('cpu_temp: sensors reported error: ' + err);
                _fault = true;
            }

            fulfill({ value: 0, min: 0, max: 0 });
        });
    });
}

function init(config) {
    
    if (config) {
        _max_points = config.max_points || 10;
        _fahrenheit = config.fahrenheit || false;
    }

    logger.info('initialize: cpu tempature max points are set to ' + _max_points);
    
    if (_fahrenheit) {
        logger.info('initialize: cpu temp set to use fahrenheit');

    }
    return 'cpu_temp';
}

function stop() {
    return Promise.resolve();
}

/* this will only be used for GUI configuration */

function settings() {
    return {
        name: 'cpu_temp',
        description: 'cpu temp monitor',
        icon: 'pi-sun',
        multiple: false,
        ident: [],        
        fields: [
            { name: 'max_points', type: 'number', value: 300 },
            { name: 'fahrenheit', type: 'boolean', value: true },
        ]
    };
}

module.exports = {
    init,
    settings,
    sample,
    stop
};
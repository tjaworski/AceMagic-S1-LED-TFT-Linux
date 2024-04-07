'use strict';
/*!
 * s1panel - sensor/power
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const fs = require('fs');

const logger = require('../logger');

function read_file(path) {
  
    return new Promise((fulfill, reject) => {

        fs.readFile(path, 'utf8', (err, data) => {
            
            if (err) {
                return reject();
            }

            fulfill(data);
        });
    });
}

function file_exists(path) {
    
    return new Promise((fulfill, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                return fulfill();
            }

            fulfill(path);
        });
    });
}

var _previous = null;

function power_usage() {

    return new Promise((fulfill, reject) => {

        var _base_dir = '/sys/class/powercap/'; 

        fs.readdir(_base_dir, (err, dir) => {
            
            const _promises = [];

            dir.forEach(each => {

                var _path_to_energy = _base_dir + each + '/energy_uj';

                _promises.push(file_exists(_path_to_energy).then(exists => {

                    if (exists) {
                        return read_file(_path_to_energy);
                    }
                }));
            });

            Promise.all(_promises).then(results => {

                var _response = { watts: 0.00 };
                var _current = [];

                results.forEach(each => {
                   
                    if (each) {
                        _current.push(Number(each));
                    }
                });


                if (_previous) {
                    
                    var _watts = 0.0;

                    for (var i = 0; i < _current.length; i++) {

                        var _curr_value = _current[i];
                        var _prev_value = _previous[i];

                        _watts += (_curr_value - _prev_value) / 1000000;
                    }

                    _response.watts = _watts;
                }

                _previous = _current;
        
                fulfill(_response);
            });
        });

    });
}

var _max_points = 10;
var _last_sampled = 0;
var _history = [];

function sample(rate, format) {

    return new Promise((fulfill, reject) => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;
        var _dirty = false;
        var _cpu_promise = Promise.resolve();

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _cpu_promise = power_usage();
            _dirty = true;
        }

        _cpu_promise.then(result => {

            if (result && _dirty) {
                
                var _seconds = _diff / 1000;

                if (!_history.length) {

                    for (var i = 0; i < _max_points; i++) {
                        _history.push(0);
                    }
                } 

                if (_seconds > 1) {
                    result.watts = result.watts / _seconds;
                }

                _history.push(result.watts.toFixed(0));
                _history.shift();
            }

            const _output = format.replace(/{(\d+)}/g, function (match, number) { 
        
                switch (number) {
                    case '0':
                        return _history[_history.length - 1];
                    case '1':
                        return _history.join();
                    default:
                        return 'null';
                }
            }); 

            fulfill({ value: _output, min: 0, max: 28 });
        });
    });
}

function init(config) {
    
    if (config) {
        _max_points = config.max_points;
    }

    logger.info('initialize: cpu power max points are set to ' + _max_points);
    
    return 'cpu_power';
}


module.exports = {
    init,
    sample
};
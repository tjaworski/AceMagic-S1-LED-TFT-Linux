'use strict';
/*!
 * s1panel - sensor/cpu_usage
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const fs = require('fs');

const logger = require('../logger');

var _fault = false;

var _max_points = 10;
var _last_sampled = 0;
var _history = [];

var _previous = null;

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

function calc_cpu_usage(previous, current) {
    
    var _total_diff = 0;
    var _major_diff = 0;

    for (var i = 1; i < 10; i++) {

        const _current_value = Number(current[i]);
        const _previous_value = Number(previous[i]);

        _total_diff += _current_value - _previous_value; 
        if (i < 4) {
            _major_diff += _current_value - _previous_value;
        }
    }

    return (_major_diff / _total_diff) * 100.0;
}

function cpu_usage() {

    return new Promise(fulfill => {

        read_file('/proc/stat').then(cpuinfo => {

            const _response = { usage: 0.00 };
            const _current = cpuinfo.match(/^cpu\s\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)/);
            
            if (_previous) {
                var _cpu_usage = calc_cpu_usage(_previous, _current);
                _response.usage = _cpu_usage;
            }

            _previous = _current;
            
            fulfill(_response);
        
        }, err => {
            
            if (!_fault) {
                logger.error('cpu_usage: failed to read /proc/stat: ' + err);
                _fault = true;
            }

            fulfill();
        });
    });
}


function sample(rate, format) {

    return new Promise(fulfill => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;
        var _dirty = false;
        var _cpu_promise = Promise.resolve();

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _cpu_promise = cpu_usage();
            _dirty = true;
        }

        _cpu_promise.then(result => {

            if (result && _dirty) {
                
                if (!_history.length) {

                    for (var i = 0; i < _max_points; i++) {
                        _history.push(0);
                    }
                } 

                _history.push(result.usage.toFixed(0));
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

            fulfill({ value: _output, min: 0, max: 100 });
        });
    });
}

function init(config) {
    
    if (config) {
        _max_points = config.max_points;
    }

    logger.info('initialize: cpu sensor max points are set to ' + _max_points);
    
    return 'cpu_usage';
}


module.exports = {
    init,
    sample
};
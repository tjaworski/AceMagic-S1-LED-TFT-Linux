'use strict';
/*!
 * s1panel - sensor/cpu_temp
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const spawn = require('child_process').exec;

const logger = require('../logger');

var _fault = false;

var _max_points = 10;
var _fahrenheit = false;
var _last_sampled = 0;
var _history = [];
var _max_temp = 0;
var _min_temp = 0;

function run_command(cmdline) {

    return new Promise((fulfill, reject) => {

        var _runit = spawn(cmdline);
        var _output = '';

        _runit.stdout.on('data', function(data) {

            _output += data;
        });

        _runit.stderr.on('data', function(data) {});

        _runit.on('close', code => {

            return code === 0 ? fulfill(_output) : reject('error executing');
        });

        _runit.on('error', err => {

            reject(err);
        });
    });
}

function cpu_temp() {

    return new Promise(fulfill => {

        var _command_line = 'sensors -j';

        if (_fahrenheit) {
            _command_line += ' --fahrenheit';
        }

        run_command(_command_line).then(output => {

            fulfill(JSON.parse(output));
        
        }, err => {

            if (!_fault) {

                logger.error('cpu_temp: sensors reported error: ' + err);
                _fault = true;
            }

            fulfill();
        });
    });
}

function get_current_value(json) {

    var _value = 0;

    const _coretemp = json['coretemp-isa-0000'];

    if (_coretemp) {

        const _package = _coretemp['Package id 0'];
        
        if (_package) {

            _value = _package.temp1_input;

            if (!_max_temp) {

                if (_package.temp1_max) {
                    _max_temp = _package.temp1_max;
                }
                else {
                    _max_temp = _fahrenheit ? 230.0 : 105.0;
                }

                logger.info('initialize: cpu temp max set to ' + _max_temp);
            }
            if (!_min_temp) {

                if (_package.temp1_min) {
                    _min_temp = _package.temp1_min;
                }
                else {
                    _min_temp = _fahrenheit ? 70.0 : 21;
                }
                
                logger.info('initialize: cpu temp max set to ' + _min_temp);
            }
        }
    }
    return _value;
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


module.exports = {
    init,
    sample
};
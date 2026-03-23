'use strict';
/*!
 * s1panel - sensor/nvme_temp
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
                return reject(err);
            }

            var _promises = [];

            files.forEach(file => {
                _promises.push(cb(path.join(dir, file)));
            });

            Promise.all(_promises).then(fulfill, reject);
        });
    });
}

function nvme_temp() {

    return new Promise((fulfill, reject) => {

        const _hwmon = '/sys/class/hwmon/';

        // /sys/class/hwmon/hwmonX/name === 'nvme'
        // /sys/class/hwmon/hwmonX/temp1_label === 'Composite'
        // /sys/class/hwmon/hwmonX/temp1_input  e.g. 57850 / 1000 = 57.85°C

        var _found_nvme = false;
        var _path_nvme = null;

        walk_directory(_hwmon, fullpath => {

            const _hwmon_name = path.join(fullpath, 'name');

            return read_file(_hwmon_name).then(name => {

                if (name.trim() === 'nvme') {
                    _path_nvme = fullpath;
                    _found_nvme = true;
                }

                return Promise.resolve();

            }, () => Promise.resolve());

        }).then(() => {

            if (!_found_nvme) {
                return fulfill();
            }

            var _temp_path = null;
            var _temp_found = false;

            return walk_directory(_path_nvme, fullpath => {

                if (fullpath.includes('temp') && fullpath.includes('label')) {

                    return read_file(fullpath).then(name => {

                        if (name.trim() === 'Composite') {
                            _temp_path = fullpath;
                            _temp_found = true;
                        }

                    }, () => Promise.resolve());
                }

                return Promise.resolve();

            }).then(() => {

                if (!_temp_found) {
                    return fulfill();
                }

                const _input_path = _temp_path.replace('_label', '_input');
                const _max_path   = _temp_path.replace('_label', '_max');
                const _crit_path  = _temp_path.replace('_label', '_crit');

                return Promise.all([
                    read_file(_input_path),
                    read_file(_max_path),
                    read_file(_crit_path).catch(() => '84000')
                ]).then(values => {

                    const _value = Number(values[0]) / 1000;
                    const _max   = Number(values[1]) / 1000;
                    const _crit  = Number(values[2]) / 1000;

                    fulfill({
                        value: _fahrenheit ? celsius_fahrenheit(_value) : _value,
                        max:   _fahrenheit ? celsius_fahrenheit(_max)   : _max,
                        crit:  _fahrenheit ? celsius_fahrenheit(_crit)  : _crit
                    });

                }, reject);

            }, reject);

        }, reject);
    });
}

function get_current_value(json) {

    if (!_max_temp) {
        _max_temp = json.crit || json.max || (_fahrenheit ? 185.0 : 85.0);
        logger.info('initialize: nvme temp max set to ' + _max_temp);
    }

    if (!_min_temp) {
        _min_temp = _fahrenheit ? 68.0 : 20.0;
        logger.info('initialize: nvme temp min set to ' + _min_temp);
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

            _temp_promise = nvme_temp();
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

                    case '0':   // composite temp (current)
                        return _history[_history.length - 1];

                    case '1':   // history
                        return _history.join();

                    case '2':   // unit
                        return _fahrenheit ? 'F' : 'C';

                    default:
                        return 'null';
                }
            });

            fulfill({ value: _output, min: _min_temp, max: _max_temp });

        }, err => {

            if (!_fault) {
                logger.error('nvme_temp: sensor reported error: ' + err);
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

    logger.info('initialize: nvme temp max points set to ' + _max_points);

    if (_fahrenheit) {
        logger.info('initialize: nvme temp set to use fahrenheit');
    }

    return 'nvme_temp';
}

function stop() {
    return Promise.resolve();
}

function settings() {
    return {
        name: 'nvme_temp',
        description: 'NVMe SSD temperature monitor (Composite)',
        icon: 'pi-database',
        multiple: false,
        ident: [],
        fields: [
            { name: 'max_points', type: 'number', value: 300 },
            { name: 'fahrenheit', type: 'boolean', value: false },
        ]
    };
}

module.exports = {
    init,
    settings,
    sample,
    stop
};

'use strict';
/*!
 * s1panel - sensor/cpu_freq
 * Copyright (c) 2024-2025
 * GPL-3 Licensed
 */
const fs = require('fs');
const logger = require('../logger');

var _fault = false;
var _max_points = 10;
var _last_sampled = 0;
var _history = [];
var _max_freq = 3400;

function read_file(path) {

    return new Promise((fulfill, reject) => {

        fs.readFile(path, 'utf8', (err, data) => {

            if (err) {
                return reject(err);
            }

            fulfill(data.trim());
        });
    });
}

function cpu_freq() {

    return new Promise(fulfill => {

        const _path = '/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq';

        read_file(_path).then(data => {

            fulfill({ mhz: Math.round(Number(data) / 1000) });

        }, err => {

            if (!_fault) {
                logger.error('cpu_freq: failed to read ' + _path + ': ' + err.message);
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
        var _freq_promise = Promise.resolve();

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _freq_promise = cpu_freq();
            _dirty = true;
        }

        _freq_promise.then(result => {

            if (result && _dirty) {

                if (!_history.length) {
                    for (var i = 0; i < _max_points; i++) {
                        _history.push(0);
                    }
                }

                _history.push(result.mhz);
                _history.shift();
            }

            const _output = format.replace(/{(\d+)}/g, function (match, number) {

                switch (number) {
                    case '0':
                        return _history[_history.length - 1] || 0;
                    case '1':
                        return _history.join();
                    default:
                        return 'null';
                }
            });

            fulfill({ value: _output, min: 0, max: _max_freq });
        });
    });
}

function init(config) {

    if (config) {
        _max_points = config.max_points || 10;
    }

    const _max_path = '/sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq';

    fs.readFile(_max_path, 'utf8', (err, data) => {

        if (!err) {
            _max_freq = Math.round(Number(data.trim()) / 1000);
        }

        logger.info('initialize: cpu freq max ' + _max_freq + 'MHz, max_points: ' + _max_points);
    });

    return 'cpu_freq';
}

function stop() {
    return Promise.resolve();
}

function settings() {
    return {
        name: 'cpu_freq',
        description: 'cpu frequency monitor',
        icon: 'pi-microchip',
        multiple: false,
        ident: [],
        fields: [
            { name: 'max_points', type: 'number', value: 300 }
        ]
    };
}

module.exports = {
    init,
    settings,
    sample,
    stop
};

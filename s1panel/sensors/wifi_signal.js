'use strict';
/*!
 * s1panel - sensor/wifi_signal
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */
const { exec }  = require('child_process');
const logger    = require('../logger');

var _fault      = false;
var _max_points = 10;
var _last_sampled = 0;
var _interface  = 'wlp3s0';

var _ssid       = '--';
var _signal     = 0;
var _channel    = 0;
var _rate       = '--';
var _connected  = false;
var _history    = [];

function read_wifi() {

    return new Promise((fulfill) => {

        exec('nmcli -t -f IN-USE,SSID,SIGNAL,CHAN,RATE dev wifi', (err, stdout) => {

            if (err) {
                return fulfill(null);
            }

            var _active = null;

            stdout.split('\n').forEach(line => {

                if (line.startsWith('*:')) {
                    _active = line;
                }
            });

            if (!_active) {
                return fulfill({ connected: false, ssid: '--', signal: 0, channel: 0, rate: '--' });
            }

            // format: *:SSID:SIGNAL:CHAN:RATE
            const _parts = _active.split(':');

            fulfill({
                connected : true,
                ssid      : _parts[1] || '--',
                signal    : parseInt(_parts[2]) || 0,   // 0-100 %
                channel   : parseInt(_parts[3]) || 0,
                rate      : (_parts[4] || '--').trim()
            });
        });
    });
}

function sample(rate, format) {

    return new Promise((fulfill) => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;
        var _dirty  = false;
        var _promise = Promise.resolve();

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _promise = read_wifi();
            _dirty = true;
        }

        _promise.then(result => {

            if (result && _dirty) {

                _connected = result.connected;
                _ssid      = result.ssid;
                _signal    = result.signal;
                _channel   = result.channel;
                _rate      = result.rate;

                if (!_history.length) {
                    for (var i = 0; i < _max_points; i++) {
                        _history.push(0);
                    }
                }

                _history.push(_signal);
                _history.shift();
            }

            const _output = format.replace(/{(\d+)}/g, function (match, number) {

                switch (number) {

                    case '0':   // SSID
                        return _ssid;

                    case '1':   // signal % (0-100)
                        return _signal;

                    case '2':   // channel
                        return _channel;

                    case '3':   // link rate (e.g. "270 Mbit/s")
                        return _rate;

                    case '4':   // signal history (for sparkline)
                        return _history.join();

                    case '5':   // connection status
                        return _connected ? 'online' : 'offline';

                    default:
                        return 'null';
                }
            });

            fulfill({ value: _output, min: 0, max: 100 });

        }, err => {

            if (!_fault) {
                logger.error('wifi_signal: error reading wifi info: ' + err);
                _fault = true;
            }

            fulfill({ value: format.replace(/{(\d+)}/g, '0'), min: 0, max: 100 });
        });
    });
}

function init(config) {

    if (config) {
        _max_points = config.max_points || 10;
        _interface  = config.interface  || 'wlp3s0';
    }

    logger.info('initialize: wifi_signal interface=' + _interface + ' max_points=' + _max_points);

    return 'wifi_' + _interface;
}

function stop() {
    return Promise.resolve();
}

function settings() {
    return {
        name        : 'wifi_signal',
        description : 'WiFi signal strength and connection info',
        icon        : 'pi-wifi',
        multiple    : true,
        ident       : ['interface'],
        fields: [
            { name: 'interface',  type: 'string', value: 'wlp3s0' },
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

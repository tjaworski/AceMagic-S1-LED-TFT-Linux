'use strict';
/*!
 * s1panel - sensor/network
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads = require('worker_threads');

const logger  = require('../logger');

function record_sample(array, value, max_points) {

    if (!array.length) {

        for (var i = 0; i < max_points; i++) {
            array.push(0);
        }
    }

    array.push(value);
    array.shift();

    return value;
}

function bytes_to_data_rate(bytes, bits) {

    const _value = bits ? bytes * 8 : bytes;

    const kb = _value / 1024.0;
    const mb = kb / 1024.0;
    const gb = mb / 1024.0;

    if (gb >= 1) {
        return gb.toFixed(bits ? 3 : 3) + (bits ? ' Gbit/s' : 'Gb/s');
    }
    else if (mb >= 1) {
        return mb.toFixed(bits ? 1 : 2) + (bits ? ' Mbit/s' : ' Mb/s');
    }
    else if (kb >= 1) {
        return kb.toFixed(bits ? 0 : 2) + (bits ? ' kbit/s' : ' Kb/s');
    }
    return bytes + (bits ? ' bit/s' : ' B/s');
}


function max_link_capacity_bytes(link_speed) {

    return (link_speed * 0.125) * (1024 * 1024);
}

function sample(rate, format, config) {

    return new Promise(fulfill => {

        const _private = config._private;

        const _diff = _private.last_sampled ? Math.floor(Number(process.hrtime.bigint()) / 1000000) - _private.last_sampled : 0;
        var _dirty = false;
        var _network_promise = Promise.resolve();

        if (!_private.last_sampled || _diff > rate) {

            _private.last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);

            _private.worker.postMessage({ iface: _private.iface, rate: rate });

            _dirty = _private.thread_checkin_count ? true : false;
            _private.thread_checkin_count = 0;
        }

        _network_promise.then(() => {

            if (_dirty) {

                _private.max_rx_bytes = Math.max(..._private.history_rx_bytes);
                _private.max_tx_bytes = Math.max(..._private.history_tx_bytes);

                _private.max_rx_packets = Math.max(..._private.history_rx_packets);
                _private.max_tx_packets = Math.max(..._private.history_tx_packets);
            }

            const _absolute_max = max_link_capacity_bytes(_private.link_speed);
            var _max = _absolute_max;

            const _output = format.replace(/{(\d+)}/g, function (match, number) {

                switch (number) {
                    case '0':
                        return _private.iface;

                    case '1': // download
                        _max = _private.scale_factor ? Math.min(Math.ceil(_private.max_rx_bytes * _private.scale_factor), _absolute_max) : _absolute_max;
                        return _private.history_rx_bytes[_private.history_rx_bytes.length - 1];
                    case '2':
                        _max = _private.scale_factor ? Math.min(Math.ceil(_private.max_rx_bytes * _private.scale_factor), _absolute_max) : _absolute_max;
                        return _private.history_rx_bytes.join();
                    case '3':
                        _max = _private.scale_factor ? Math.min(Math.ceil(_private.max_rx_bytes * _private.scale_factor), _absolute_max) : _absolute_max;
                        return bytes_to_data_rate(_private.history_rx_bytes[_private.history_rx_bytes.length - 1]);

                    case '4': // upload
                        _max = _private.scale_factor ? Math.min(Math.ceil(_private.max_tx_bytes * _private.scale_factor), _absolute_max) : _absolute_max;
                        return _private.history_tx_bytes[_private.history_tx_bytes.length - 1];
                    case '5':
                        _max = _private.scale_factor ? Math.min(Math.ceil(_private.max_tx_bytes * _private.scale_factor), _absolute_max) : _absolute_max;
                        return _private.history_tx_bytes.join();
                    case '6':
                        _max = _private.scale_factor ? Math.min(Math.ceil(_private.max_tx_bytes * _private.scale_factor), _absolute_max) : _absolute_max;
                        return bytes_to_data_rate(_private.history_tx_bytes[_private.history_tx_bytes.length - 1]);

                    case '7': // download packets
                        _max = _private.max_rx_packets;
                        return _private.history_rx_packets[_private.history_rx_packets.length - 1];
                    case '8':
                        _max = _private.max_rx_packets;
                        return _private.history_rx_packets[_private.history_rx_packets.length - 1] + ' rx/pps';
                    case '9':
                        _max = _private.max_rx_packets;
                        return _private.history_rx_packets.join();

                    case '10': // upload packets
                        _max = _private.max_tx_packets;
                        return _private.history_tx_packets[_private.history_tx_packets.length - 1];
                    case '11':
                        _max = _private.max_tx_packets;
                        return _private.history_tx_packets[_private.history_tx_packets.length - 1] + ' tx/pps';
                    case '12':
                        _max = _private.max_tx_packets;
                        return _private.history_tx_packets.join();

                    case '13':
                        return _private.link_speed;
                    case '14':
                        return _private.link_mtu;

                    case '15':  // bits
                        return bytes_to_data_rate(_private.history_rx_bytes[_private.history_rx_bytes.length - 1], true);
                    case '16':
                        return bytes_to_data_rate(_private.history_tx_bytes[_private.history_tx_bytes.length - 1], true);

                    case '17':
                        return _private.ipv4;

                    case '18':
                        return _private.ipv6;

                    default:
                        return 'null';
                }
            });

            fulfill({ value: _output, min: 0, max: _max });
        });
    });
}

function init(config) {

    const _private = {

        max_points: config?.max_points || 300,
        iface: config?.interface || 'enp2s0',
        history_rx_bytes: [],
        history_tx_bytes: [],

        max_rx_bytes: 0,
        max_tx_bytes: 0,

        history_rx_packets: [],
        history_tx_packets: [],

        max_rx_packets: 0,
        max_tx_packets: 0,

        link_speed: 1000,
        link_mtu: 1500,

        scale_factor: config?.scaling || 1.5,

        thread_checkin_count: 0
    };

    logger.info('initialize: monitoring interface ' + _private.iface);
    logger.info('initialize: network max points are set to ' + _private.max_points);

    _private.worker = new threads.Worker(__dirname + '/network_thread.js', { workerData: { iface: _private.iface } });

    _private.worker.on('message', message => {

        _private.link_mtu = message.mtu;
        _private.link_speed = message.speed;

        record_sample(_private.history_rx_bytes, message.rx.bytes, _private.max_points);
        record_sample(_private.history_tx_bytes, message.tx.bytes, _private.max_points);

        record_sample(_private.history_rx_packets, message.rx.packets, _private.max_points);
        record_sample(_private.history_tx_packets, message.tx.packets, _private.max_points);

        _private.ipv4 = message.ipv4;
        _private.ipv6 = message.ipv6;

        _private.thread_checkin_count++;
    });

    config._private = _private;

    return 'network_' + _private.iface;
}

module.exports = {
    init,
    sample
};

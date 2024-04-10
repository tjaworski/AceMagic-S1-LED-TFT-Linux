'use strict';
/*!
 * s1panel - sensor/network
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads = require('worker_threads');

const logger  = require('../logger');

const _worker = new threads.Worker(__dirname + '/network_thread.js', { workerData: { } });

var _max_points = 300; // 5 minutes if rate is 1000ms
var _iface = 'enp2s0'; // need something here...
var _last_sampled = 0;

var _history_rx_bytes = [];
var _history_tx_bytes = [];

var _max_rx_bytes = 0;
var _max_tx_bytes = 0;

var _history_rx_packets = [];
var _history_tx_packets = [];

var _max_rx_packets = 0;
var _max_tx_packets = 0;

var _thread_checkin_count = 0;

function record_sample(array, value) {

    if (!array.length) {

        for (var i = 0; i < _max_points; i++) {
            array.push(0);
        }
    }

    array.push(value);
    array.shift();

    return value;
}


function bytes_to_data_rate(bytes) {

    const kb = bytes/ 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;

    if (gb >= 1) {
        return gb.toFixed(2) + ' GB/s';
    }
    else if (mb >= 1) {
        return mb.toFixed(2) + ' MB/s';
    }
    else if (kb >= 1) {
        return kb.toFixed(2) + ' KB/s'
    }
    return bytes + ' B/s';
}

_worker.on('message', message => {
    
    record_sample(_history_rx_bytes, message.rx.bytes);
    record_sample(_history_tx_bytes, message.tx.bytes);

    record_sample(_history_rx_packets, message.rx.packets);
    record_sample(_history_tx_packets, message.tx.packets);

    _thread_checkin_count++;
});

function sample(rate, format) {

    return new Promise((fulfill, reject) => {

        const _diff = _last_sampled ? Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled : 0;
        var _dirty = false;
        var _network_promise = Promise.resolve();
        
        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            
            // refresh worker thread
            _worker.postMessage({ iface: _iface, rate: rate });

            _dirty = _thread_checkin_count ? true : false;
            _thread_checkin_count = 0;
        }

        _network_promise.then(() => {

            if (_dirty) {
                
                _max_rx_bytes = Math.max(..._history_rx_bytes);
                _max_tx_bytes = Math.max(..._history_tx_bytes);

                _max_rx_packets = Math.max(..._history_rx_packets);
                _max_tx_packets = Math.max(..._history_tx_packets);
            }

            var _max = 1000 * 1000000; // hard coded to 1g for now, 10/100/1000

            const _output = format.replace(/{(\d+)}/g, function (match, number) { 
        
                switch (number) {
                    case '0':
                        return _iface;

                    case '1':   // download
                        return _history_rx_bytes[_history_rx_bytes.length - 1];
                    case '2':
                        _max = _max_rx_bytes;
                        return _history_rx_bytes.join();
                    case '3':  
                        return bytes_to_data_rate(_history_rx_bytes[_history_rx_bytes.length - 1]);

                    case '4':   // upload
                        return _history_tx_bytes[_history_tx_bytes.length - 1];
                    case '5':   
                        _max = _max_tx_bytes;
                        return _history_tx_bytes.join();
                    case '6':
                        return bytes_to_data_rate(_history_tx_bytes[_history_tx_bytes.length - 1]);
                        
                    case '7':  // download packets
                        return _history_rx_packets[_history_rx_packets.length - 1];
                    case '8':
                        return _history_rx_packets[_history_rx_packets.length - 1] + ' rx/pps'
                    case '9':
                        _max = _max_rx_packets;
                        return _history_rx_packets.join();

                    case '10':  // upload packets
                        return _history_tx_packets[_history_tx_packets.length - 1];
                    case '11':
                        return _history_tx_packets[_history_tx_packets.length - 1] + ' tx/pps';
                    case '12':
                        _max = _max_tx_packets;
                        return _history_tx_packets.join();

                    default:
                        return 'null';
                }
            }); 

            fulfill({ value: _output, min: 0, max: _max });
        });
    });
}

function init(config) {
    
    if (config) {
        _max_points = config.max_points;
        _iface = config.interface;
    }

    logger.info('initialize: monitoring interface ' + _iface);
    logger.info('initialize: network max points are set to ' + _max_points);

    return 'network_' + _iface;
}


module.exports = {
    init,
    sample
};
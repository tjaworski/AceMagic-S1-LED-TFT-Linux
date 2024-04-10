'use strict';
/*!
 * s1panel - sensors/network_thread
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const fs       = require('fs');
const threads  = require('worker_threads');
const logger   = require('../logger');

const DEFAULT_RATE_MS = 1000;
const TIMEOUT_COUNT = 30;

var _running = false;
var _collect_count = 0;

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

function network_usage(iface) {

    const _path = '/sys/class/net/' + iface + '/statistics';
    
    return Promise.all([
    
        read_file(_path + '/rx_bytes'),
        read_file(_path + '/tx_bytes'),
        read_file(_path + '/rx_packets'),
        read_file(_path + '/tx_packets')
    ]);
}

var _last_rx_bytes = 0;
var _last_tx_bytes = 0;
var _last_rx_packets = 0;
var _last_tx_packets = 0;

function collect(message) {

    _collect_count++;

    if (_collect_count < TIMEOUT_COUNT) {
        
        return network_usage(message.iface).then(results => {
        
            const _current_rx_bytes = Number(results[0]);
            const _current_tx_bytes = Number(results[1]);

            const _current_rx_packets = Number(results[2]);
            const _current_tx_packets = Number(results[3]);

            const _delta_rx_bytes = _last_rx_bytes ? _current_rx_bytes - _last_rx_bytes : 0;
            const _delta_tx_bytes = _last_tx_bytes ? _current_tx_bytes - _last_tx_bytes : 0;

            const _delta_rx_packets = _last_rx_packets ? _current_rx_packets - _last_rx_packets : 0;
            const _delta_tx_packets = _last_tx_packets ? _current_tx_packets - _last_tx_packets : 0;

            _last_rx_bytes = _current_rx_bytes;
            _last_tx_bytes = _current_tx_bytes;

            _last_rx_packets = _current_rx_packets;
            _last_tx_packets = _current_tx_packets;

            threads.parentPort.postMessage({ 
                rx: { bytes: _delta_rx_bytes, packets: _delta_rx_packets }, 
                tx: { bytes: _delta_tx_bytes, packets: _delta_tx_packets } 
            });
            
            setTimeout(() => {

                collect(message);

            }, message.rate || DEFAULT_RATE_MS)
        });
    }

    logger.info('network_thread: collector stopped for iface ' + message.iface);

    _running = false;
}

threads.parentPort.on('message', message => {

    _collect_count = 0; // reset 

    if (!_running) {

        _running = true;

        logger.info('network_thread: collector started for iface ' + message.iface);
        
        collect(message);
    }
});


logger.info('network_thread: started...');

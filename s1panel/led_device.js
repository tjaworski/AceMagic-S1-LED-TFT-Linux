'use strict';
/*!
 * s1panel - led_device
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const fs = require('fs');
const { SerialPort } = require('serialport');

const BUFFER_SIZE     = 5;
const HEADER_SIZE     = 5;

const SIGNATURE_BYTE  = 0xFA;

const THEME_RAINBOW   = 0x01;
const THEME_BREATHING = 0x02;
const THEME_COLORS    = 0x03;
const THEME_OFF       = 0x04;
const THEME_AUTO      = 0x05;

const MAX_VALUE       = 0x05;
const MIN_VALUE       = 0x01;

const DELAY           = 5;  // 0.005 second

var _port_cache;

function printBytesInHex(array) {

    var _hexString = "";

    for (var i = 0; i < Math.min(array.length, HEADER_SIZE); i++) {
        _hexString += ('0' + array[i].toString(16)).slice(-2) + ' ';
    }

    console.log(_hexString);
}

function fix_value(num) {

    return Math.min(MAX_VALUE, Math.max(6 - num, MIN_VALUE));
}

function checksum(dv) {
    
    var _crc = 0x00;
        
    for (var i = 0; i < 4; i++) {
        _crc += dv.getUint8(i);
    }

    return _crc;
}

function open_device(device) {

    return new Promise((fulfill, reject) => {
    
        if (_port_cache) {
            return fulfill(_port_cache);
        }

        const _port = new SerialPort({ path: device, baudRate: 10000, autoOpen: false });
    
        _port.open(err => {
           
            if (err) {

                console.log('led_device: error opening port ', err.message);        
                return reject();      
            }
          
            _port_cache = _port;

            fulfill(_port);
        });
    });
}

function port_byte_write(port, buffer, index, size, fulfill) {
    
    if (index < size) {
        
        const _one_byte = Buffer.from( [ buffer[index] ]);

        port.write(_one_byte, err => {

            if (err) {
                console.log('led_device: ' + err);
                return fulfill();
            }

            setTimeout(() => {
            
                port_byte_write(port, buffer, 1 + index, size, fulfill);

            }, DELAY);

        });
    }
    else {
        fulfill();
    }
}

function set_rainbow(device, intensity, speed) {

    return new Promise(fulfill => {

        const _buffer = new Uint8ClampedArray(BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer);

        _header.setUint8(0, SIGNATURE_BYTE);
        _header.setUint8(1, THEME_RAINBOW);
        _header.setUint8(2, fix_value(intensity));
        _header.setUint8(3, fix_value(speed));
        _header.setUint8(4, checksum(_header));

        //console.log('set_rainbow: speed=' + speed + ' intensity=' + intensity);
        //printBytesInHex(_buffer);

        open_device(device).then(port => {
            
            port_byte_write(port, _buffer, 0, BUFFER_SIZE, () => {

                fulfill();
            });

        }, fulfill);
    });
}

function set_breathing(device, intensity, speed) {

    return new Promise(fulfill => {

        const _buffer = new Uint8ClampedArray(BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer);

        _header.setUint8(0, SIGNATURE_BYTE);
        _header.setUint8(1, THEME_BREATHING);
        _header.setUint8(2, fix_value(intensity));
        _header.setUint8(3, fix_value(speed));
        _header.setUint8(4, checksum(_header));

        //console.log('set_breathing: speed=' + speed + ' intensity=' + intensity);
        //printBytesInHex(_buffer);

        open_device(device).then(port => {
            
            port_byte_write(port, _buffer, 0, BUFFER_SIZE, () => {

                fulfill();
            });
        
        }, fulfill);
    });
}

function set_color(device, intensity, speed) {

    return new Promise(fulfill => {

        const _buffer = new Uint8ClampedArray(BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer);

        _header.setUint8(0, SIGNATURE_BYTE);
        _header.setUint8(1, THEME_COLORS);
        _header.setUint8(2, fix_value(intensity));
        _header.setUint8(3, fix_value(speed));
        _header.setUint8(4, checksum(_header));

        //console.log('led_color: speed=' + speed + ' intensity=' + intensity);
        //printBytesInHex(_buffer);

        open_device(device).then(port => {
            
            port_byte_write(port, _buffer, 0, BUFFER_SIZE, () => {

                fulfill();
            });
        
        }, fulfill);
    });
}

function set_automatic(device, intensity, speed) {

    return new Promise(fulfill => {

        const _buffer = new Uint8ClampedArray(BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer);

        _header.setUint8(0, SIGNATURE_BYTE);
        _header.setUint8(1, THEME_AUTO);
        _header.setUint8(2, fix_value(intensity));
        _header.setUint8(3, fix_value(speed));
        _header.setUint8(4, checksum(_header));

        //console.log('led_auto: speed=' + speed + ' intensity=' + intensity);
        //printBytesInHex(_buffer);

        open_device(device).then(port => {
            
            port_byte_write(port, _buffer, 0, BUFFER_SIZE, () => {

                fulfill();
            });

        }, fulfill);
    });
}

function set_off(device) {

    return new Promise(fulfill => {

        const _buffer = new Uint8ClampedArray(BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer);

        _header.setUint8(0, SIGNATURE_BYTE);
        _header.setUint8(1, THEME_OFF);
        _header.setUint8(2, 0x05);
        _header.setUint8(3, 0x05);
        _header.setUint8(4, checksum(_header));

        //console.log('led_off');
        //printBytesInHex(_buffer);

        open_device(device).then(port => {
            
            port_byte_write(port, _buffer, 0, BUFFER_SIZE, () => {

                fulfill();
            });
            
        }, fulfill);
    });
}

module.exports = {
    set_rainbow,
    set_breathing,
    set_color,
    set_automatic,
    set_off
};

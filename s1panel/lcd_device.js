'use strict';
/*!
 * s1panel - lcd_device
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const BUFFER_SIZE         = 4104;
const HEADER_SIZE         = 8;
const DATA_SIZE           = 4096;
const REPORT_SIZE         = 1;

const LCD_SIGNATURE       = 0x55;

const LCD_CONFIG          = 0xA1;
const LCD_REFRESH         = 0xA2;
const LCD_REDRAW          = 0xA3;

const LCD_ORIENTATION     = 0xF1;
const LCD_SET_TIME        = 0xF2;

const LCD_LANDSCAPE       = 0x01;
const LCD_PORTRAIT        = 0x02;

const LCD_REDRAW_START    = 0xF0;
const LCD_REDRAW_CONTINUE = 0xF1;
const LCD_REDRAW_END      = 0xF2;


function printBytesInHex(array) {
    var _hexString = "";
    for (var i = 1; i < Math.min(array.length, REPORT_SIZE + HEADER_SIZE); i++) {
        _hexString += ('0' + array[i].toString(16)).slice(-2) + ' ';
    }
    console.log(_hexString);
}

function set_orientation(handle, portrait) {
    
    return new Promise((fulfill, reject) => {

        const _buffer = new Uint8ClampedArray(REPORT_SIZE + BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer, REPORT_SIZE);

        _header.setUint8(0, LCD_SIGNATURE);
        _header.setUint8(1, LCD_CONFIG);
        _header.setUint8(2, LCD_ORIENTATION);
        _header.setUint8(3, portrait ? LCD_PORTRAIT : LCD_LANDSCAPE);
        
        //console.log('set orientation');
        //printBytesInHex(_buffer);

        handle.write(_buffer).then(fulfill, reject);
    });
}

function heartbeat(handle) {

    return new Promise((fulfill, reject) => {

        const _buffer = new Uint8ClampedArray(REPORT_SIZE + BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer, REPORT_SIZE);

        const _date = new Date();

        _header.setUint8(0, LCD_SIGNATURE);
        _header.setUint8(1, LCD_CONFIG);
        _header.setUint8(2, LCD_SET_TIME);
        _header.setUint8(3, _date.getHours());
        _header.setUint8(4, _date.getMinutes());
        _header.setUint8(5, _date.getSeconds());

        //console.log('heartbeat');
        //printBytesInHex(_buffer);

        handle.write(_buffer).then(fulfill, reject);
    });
}

function redraw_next(handle, header, image, buffer, index, fulfill, reject) {

    if (index < 27) {

        switch (index) {
            case 0:
                header.setUint8(2, LCD_REDRAW_START);
                break;
            case 26:
                header.setUint8(2, LCD_REDRAW_END);
                break;
            default:
                header.setUint8(2, LCD_REDRAW_CONTINUE);
                break;
        }

        const _length = (index < 26) ? DATA_SIZE : 2304;    // hard coded for now

        header.setUint8(3, 1 + index);              // sequence, 1, 2, 3...
        header.setUint16(5, index * DATA_SIZE);     // offset into image
        header.setUint16(7, _length);               // chunk size

        // copy from part of the image to xmit buffer
        {
            const _data = new DataView(buffer.buffer, REPORT_SIZE + HEADER_SIZE);
            const _pixel_start = (index * DATA_SIZE) / 2;
            const _pixel_length = _length / 2;
            var _offset = 0;

            for (var i = 0; i < _pixel_length; i++) {                
                _data.setUint16(_offset, image.data[_pixel_start + i]);
                _offset += 2;
            }
        }

        //printBytesInHex(buffer);

        handle.write(buffer).then(() => {

            redraw_next(handle, header, image, buffer, ++index, fulfill, reject);

        }, reject);
    }
    else {
        fulfill();
    }
}

function redraw(handle, image) {

    return new Promise((fulfill, reject) => {

        const _buffer = new Uint8ClampedArray(REPORT_SIZE + BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer, REPORT_SIZE);
        
        _header.setUint8(0, LCD_SIGNATURE);
        _header.setUint8(1, LCD_REDRAW);

        //console.log('lcd_redraw');

        redraw_next(handle, _header, image, _buffer, 0, fulfill, reject);
    });
}

function refresh(handle, x, y, width, height, image) {

    return new Promise((fulfill, reject) => {

        const _buffer = new Uint8ClampedArray(REPORT_SIZE + BUFFER_SIZE);
        const _header = new DataView(_buffer.buffer, REPORT_SIZE);

        _header.setUint8(0, LCD_SIGNATURE);
        _header.setUint8(1, LCD_REFRESH);

        _header.setUint16(2, x, true);
        _header.setUint16(4, y, true);

        _header.setUint8(6, width);
        _header.setUint8(7, height);

        {
            const _data = new DataView(_buffer.buffer, REPORT_SIZE + HEADER_SIZE);
            const _length = width * height;
            var _offset = 0;

            for (var i = 0; i < _length; i++) {
                _data.setUint16(_offset, image.data[i]);
                _offset += 2;
            }
        }

        //console.log('lcd_refresh');
        //printBytesInHex(_buffer);

        handle.write(_buffer).then(fulfill, reject);
    });
}

module.exports = {
    set_orientation,
    heartbeat,
    redraw,
    refresh
};
'use strict';
/*!
 * s1panel - sensor/clock
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
var _last_sampled = 0;
var _value = new Date();

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function sample(rate, format) {

    return new Promise(fulfill => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _value = new Date();
        }

        var _output = format.replace(/{(\d+)}/g, function (match, number) { 

            const _24hours = _value.getHours();
            const _minutes = _value.getMinutes();
            const _seconds = _value.getSeconds();
            var _12hours = _24hours;
            var _am_pm = 'am';

            if (_24hours >= 12) {
                
                _am_pm = 'pm';
                
                if (_24hours > 12) {

                    _12hours = _24hours - 12;
                }
            }
            else if (_24hours === 0) {
                _12hours = 12;
            }
    
            switch (number) {
                case '0':
                    return _24hours + ':' + pad(_minutes, 2);
                case '1':
                    return _12hours + ':' + pad(_minutes, 2);
                case '2':
                    return pad(_seconds, 2);
                case '3':
                    return _am_pm;
                default:
                    return 'undefined'; 
            }
        }); 

        fulfill({ value: _output, min: 0, max: 0 });
    });
}

function init(config) {
    return 'clock';
}

module.exports = {
    init,
    sample
};
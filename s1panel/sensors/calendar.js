'use strict';
/*!
 * s1panel - sensor/calendar
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

    return new Promise((fulfill, reject) => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _value = new Date();
        }

        var _output = format.replace(/{(\d+)}/g, function (match, number) { 

            const _month = 1 + _value.getMonth();
            const _day = _value.getDay();
            const _full_year = _value.getFullYear();
            const _short_year = _value.getFullYear().toString().substr(-2);
    
            switch (number) {
                case '0':   // M/D/YY 
                    return _month + '/' + _day + '/' + _short_year;
                case '1':   // YYYY-M-D
                    return _full_year + '-' + _month + '-' + _day;
                default:
                    return 'undefined'; 
            }
        }); 

        fulfill({ value: _output, min: 0, max: 0 });
    });
}

function init(config) {
    return 'calendar';
}

module.exports = {
    init,
    sample
};
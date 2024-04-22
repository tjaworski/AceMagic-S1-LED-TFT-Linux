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

const _weekday = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const _months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

function get_ordinal_suffix(number) {
    
    if (number >= 11 && number <= 13) {
        return number + 'th';
    }

    switch (number % 10) {
        case 1:
            return number + 'st';
        case 2:
            return number + 'nd';
        case 3:
            return number + 'rd';
        default:
            return number + 'th';
    }
}

function sample(rate, format) {

    return new Promise(fulfill => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _value = new Date();
        }

        var _output = format.replace(/{(\d+)}/g, function (match, number) { 

            const _month = 1 + _value.getMonth();
            const _day = _value.getDate();
            const _full_year = _value.getFullYear();
            const _short_year = _value.getFullYear().toString().substring(2);
    
            switch (number) {
                case '0':   // M/D/YY 
                    return _month + '/' + _day + '/' + _short_year;
                case '1':   // YYYY-M-D
                    return _full_year + '-' + _month + '-' + _day;
                case '2':   // Day of Month
                    return _value.getDate();
                case '3':   // 1st, 2nd, 3rd, 4th
                    return get_ordinal_suffix(_value.getDate());
                case '4':   // Day of Week
                    return _weekday[_value.getDay()];
                case '5':   // Day of Week short
                    return _weekday[_value.getDay()].substring(0, 3);
                case '6':   // Month of year
                    return _months[_value.getMonth()];
                case '7':   // Month of year short
                    return _months[_value.getMonth()].substring(0, 3);
                case '8':   // 4 digit year
                    return _value.getFullYear();
                case '9':   // get month
                    return 1 +_value.getMonth();
                case '10':  // 2 digit year
                    return _short_year;                               
                case '11':  // dot notation
                    return _full_year + '.' + _month + '.' + _day;
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

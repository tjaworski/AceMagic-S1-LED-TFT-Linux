'use strict';
/*!
 * s1panel - sensor/memory
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const fs = require('fs');

const logger = require('../logger');

var _fault = false;

var _max_points = 10;
var _last_sampled = 0;

var _free_history = [];
var _cache_history = [];
var _active_history = [];
var _usage_history = [];
var _used_swap_history = [];
var _swap_history = [];

var _total_memory = 0;
var _swap_total = 0;

var _previous = null;

function read_file(path) {
  
    return new Promise((fulfill, reject) => {

        fs.readFile(path, 'utf8', (err, data) => {
            
            if (err) {
                return reject(err);
            }

            fulfill(data);
        });
    });
}

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

function calc_memory_usage(current) {

    var _current_total = 0;
    var _current_free = 0;
    var _current_cached = 0;
    var _current_swap_total = 0;
    var _current_swap_free = 0;

    current.forEach(each => {

        const _match_total = each.match(/^MemTotal:\s+(\d+)/);
        const _match_free = each.match(/^MemFree:\s+(\d+)/);
        const _match_cached = each.match(/^Cached:\s+(\d+)/);
        const _match_swap_total = each.match(/^SwapTotal:\s+(\d+)/);
        const _match_swap_free = each.match(/^SwapFree:\s+(\d+)/);

        if (_match_total) {
            _current_total = Number(_match_total[1]);
        }
        else if (_match_free) {
            _current_free = Number(_match_free[1]);
        }
        else if (_match_cached) {
            _current_cached = Number(_match_cached[1]);
        }
        else if (_match_swap_total) {
            _current_swap_total = Number(_match_swap_total[1]);
        }
        else if (_match_swap_free) {
            _current_swap_free = Number(_match_swap_free[1]);
        }
    });

    const _current_used = _current_total - _current_free;
    const _active = _current_used - _current_cached;
    const _swap_used = _current_swap_total - _current_swap_free;
    
    return {
        total: _current_total * 1024,
        free: _current_free * 1024,
        cached: _current_cached * 1024,
        active: _active * 1024,
        usage:  ((_active / _current_total) * 100.0).toFixed(2),
        swap_total: _current_swap_total * 1024,
        swap_used: _swap_used * 1024,
        swap: ((_swap_used / _current_swap_total) * 100.0).toFixed(2)
    };
}

function mem_usage() {

    return new Promise(fulfill => {

        read_file('/proc/meminfo').then(meminfo => {

            const _response = { total: 0, free: 0, cached: 0, active: 0, usage: 0, swap_total: 0, swap_used: 0, swap: 0 };
            const _current = meminfo.match(/(^MemTotal:\s+(\d+))|(^MemFree:\s+(\d+))|(^Cached:\s+(\d+))|(^SwapTotal:\s+(\d+))|(^SwapFree:\s+(\d+))/gm);
            
            if (_previous) {
                
                const _memory = calc_memory_usage(_current);

                _response.total = _memory.total;
                _response.free = _memory.free;
                _response.cached = _memory.cached;
                _response.active = _memory.active;
                _response.usage = _memory.usage;
                _response.swap_total = _memory.swap_total;
                _response.swap_used = _memory.swap_used;
                _response.swap = _memory.swap;
            }

            _previous = _current;
            
            fulfill(_response);
        
        }, err => {
            
            if (!_fault) {
                logger.error('cpu_usage: failed to read /proc/stat: ' + err);
                _fault = true;
            }

            fulfill();
        });
    });
}

function format_bytes(bytes) {

    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;

    if (gb >= 1) {
        return gb.toFixed(2) + ' GB';
    }
    else if (mb >= 1) {
        return mb.toFixed(2) + ' MB';
    }
    else if (kb >= 1) {
        return kb.toFixed(2) + ' KB';
    }
    return bytes + ' B';
}

function sample(rate, format) {

    return new Promise(fulfill => {

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _last_sampled;
        var _dirty = false;
        var _mem_promise = Promise.resolve();

        if (!_last_sampled || _diff > rate) {

            _last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _mem_promise = mem_usage();
            _dirty = true;
        }

        _mem_promise.then(result => {

            if (result && _dirty) {
                
                if (_total_memory != result.total) {
                    _total_memory = result.total;
                    logger.info('memory sensor: total ram detected ' + format_bytes(_total_memory));
                }

                if (_swap_total != result.swap_total) {
                    _swap_total = result.swap_total;
                    logger.info('memory sensor: total swap detected ' + format_bytes(_swap_total));
                }

                record_sample(_free_history, result.free, _max_points);
                record_sample(_cache_history, result.cached, _max_points);
                record_sample(_active_history, result.active, _max_points);
                record_sample(_usage_history, result.usage, _max_points);
                record_sample(_used_swap_history, result.swap_used, _max_points);
                record_sample(_swap_history, result.swap, _max_points);
            }

            var _max = 0;

            const _output = format.replace(/{(\d+)}/g, function (match, number) { 
        
                switch (number) {
                    case '0':
                        return _total_memory;
                    case '1':
                        return _swap_total;

                    case '2':
                        _max = 100;
                        return _usage_history[_usage_history.length - 1];
                    case '3':
                        _max = 100;
                        return _usage_history.join();

                    case '4':
                        _max = 100;
                        return _swap_history[_swap_history.length - 1];
                    case '5':
                        _max = 100;
                        return _swap_history.join();

                    case '6':
                        _max = _total_memory;
                        return _free_history[_free_history.length - 1];
                    case '7':
                        _max = _total_memory;
                        return _free_history.join();

                    case '8':
                        _max = _total_memory;
                        return _cache_history[_cache_history.length - 1];
                    case '9':
                        _max = _total_memory;
                        return _cache_history.join();
                                                    
                    case '10':
                        _max = _total_memory;
                        return _active_history[_active_history.length - 1];
                    case '11':
                        _max = _total_memory;
                        return _active_history.join();
                                                     
                    case '12':
                        _max = _swap_total;
                        return _used_swap_history[_used_swap_history.length - 1];
                    case '13':
                        _max = _swap_total;
                        return _used_swap_history.join();                        

                    case '14':
                        return format_bytes(_active_history[_active_history.length - 1]);
                    case '15':
                        return format_bytes(_used_swap_history[_used_swap_history.length - 1]);

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
    }

    logger.info('initialize: memory sensor max points are set to ' + _max_points);
    
    return 'memory';
}


module.exports = {
    init,
    sample
};
'use strict';
/*!
 * s1panel - sensor/space
 * GPL-3 Licensed
 * 
 * inspired by https://github.com/Ex161/AceMagic-S1-LED-TFT-Linux/blob/main/s1panel/sensors/storage_space.js
 */
const fs = require('fs');

const spawn = require('child_process').exec;

const logger = require('../logger');

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

function space_info(path) {

    return new Promise((fulfill, reject) => {

        fs.statfs(path, (err, stats) => {

            var _info = {
                used: 0,
                avail: 0,
                size: 0,
            };

            if (!err) {
                const _total_bytes = stats.blocks * stats.bsize;
                const _free_bytes = stats.bfree * stats.bsize;

                _info.used = _total_bytes - _free_bytes;
                _info.avail = _free_bytes;
                _info.size = _total_bytes;
            }
            
            fulfill(_info)
        });
    });
}

function sample(rate, format, config) {

    return new Promise(fulfill => {

        const _private = config._private;

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _private.last_sampled;
        var _dirty = false;
        var _promise = Promise.resolve();

        if (!_private.last_sampled || _diff > rate) {

            _private.last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);
            _promise = space_info(config.mount_point);
            _dirty = true;
        }

        _promise.then(result => {

            if (_dirty) {

                const _free_percentage = ((result.avail / result.size) * 100).toFixed(_private.precision);
                const _used_percentage = ((result.used / result.size) * 100).toFixed(_private.precision);

                record_sample(_private.history_free, _free_percentage, _private.max_points);
                record_sample(_private.history_used, _used_percentage, _private.max_points);

                _private.free_mb = (result.avail / 1024 / 1024).toFixed(_private.precision);
                _private.used_mb = (result.used / 1024 / 1024).toFixed(_private.precision);
                _private.size_mb = (result.size / 1024 / 1024).toFixed(_private.precision);
            }

            var _max = 100;

            const _output = format.replace(/{(\d+)}/g, function (match, number) {

                switch (number) {
                    case '0':
                        return config.mount_point;

                    case '1':   // history, free %
                        return _private.history_free.join();
                    case '2':   // history, used %
                        return _private.history_used.join();

                    case '3':   // last, free %
                        return _private.history_free[_private.history_free.length - 1];
                    case '4':   // last, used %
                        return _private.history_used[_private.history_used.length - 1];

                    case '5':   // free mb
                        _max = _private.size_mb;
                        return _private.free_mb;
                    case '6':   // used mb
                        _max = _private.size_mb;
                        return _private.used_mb;
                    case '7':   // total size MB
                        _max = _private.size_mb;
                        return _private.size_mb;

                    case '8':   // unit
                        return 'MiB';
                }
            });

            fulfill({ value: _output, min: 0, max: _max });
        });
    });
}

function init(config) {

    const _is_rootfs = config?.mount_point ? ('/' === config?.mount_point) : true;

    const _private = {
        max_points: config?.max_points || 300,
        name: config?.name || (_is_rootfs ? 'root' : config?.mount_point),  // use name, otherwise use mount point, if / use root
        mount_point: config?.mount_point || '/',    // default to root
        history_used: [],   // percent used
        history_free: [],   // percent free
        used_mb: 0,
        free_mb: 0,
        size_mb: 0,
        precision: 0
    };

    logger.info('initialize: space for mount point ' + _private.name);
    logger.info('initialize: space max points are set to ' + _private.max_points);

    config._private = _private;

    return 'space_' + _private.name;
}


module.exports = {
    init,
    sample
};

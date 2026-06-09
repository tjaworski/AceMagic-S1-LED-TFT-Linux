'use strict';
/*!
 * s1panel - sensor/systemd
 */
const { exec } = require('child_process');
const logger = require('../logger');

function get_service_status(serviceName, userFlagStr) {
    return new Promise((resolve) => {
        exec(`${userFlagStr} is-active ${serviceName}`, (err, stdout, stderr) => {
            resolve(stdout.trim() === 'active');
        });
    });
}

function sample(rate, format, config) {
    return new Promise((fulfill, reject) => {
        const _service = config._private.service;
        const _userStr = config._private.userFlagStr;
        get_service_status(_service, _userStr).then(isActive => {
            const statusStr = isActive ? 'active' : 'inactive';
            const _output = format.replace(/{(\d+)}/g, function (match, number) {
                switch (number) {
                    case '0': return _service;
                    case '1': return statusStr;
                    default: return 'null';
                }
            });
            fulfill({ value: _output, min: 0, max: 1 });
        }).catch(err => {
            fulfill({ value: 'error', min: 0, max: 1 });
        });
    });
}

function init(config) {
    if (!config) { config = {}; }
    const _private = {
        service: config.service || 'openclaw',
        user: config.user || null
    };
    
    if (_private.user) {
        try {
            const uid = require('child_process').execSync(`id -u ${_private.user}`).toString().trim();
            _private.userFlagStr = `sudo -u ${_private.user} env XDG_RUNTIME_DIR=/run/user/${uid} DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/${uid}/bus systemctl --user`;
        } catch(e) {
            _private.userFlagStr = 'systemctl';
        }
    } else {
        _private.userFlagStr = 'systemctl';
    }
    
    config._private = _private;
    const prefix = _private.user ? `user:${_private.user}:` : '';
    logger.info('initialize: systemd sensor set to ' + prefix + _private.service);
    return 'systemd_' + _private.service;
}

function stop() { return Promise.resolve(); }

function settings() {
    return {
        name: 'systemd',
        description: 'monitor systemd service status',
        icon: 'pi-cog',
        multiple: true,
        ident: [ 'service' ],
        fields: [
            { name: 'service', type: 'string', value: 'openclaw-gateway' },
            { name: 'user', type: 'string', value: '' }
        ]
    };
}

module.exports = { init, settings, sample, stop };

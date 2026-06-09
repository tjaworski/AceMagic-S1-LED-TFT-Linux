'use strict';
/*!
 * s1panel - sensor/log_activity
 * Monitors log file modification time for status.
 */
const fs = require('fs');
const logger = require('../logger');
const path = require('path');

function get_log_path() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `/tmp/openclaw/openclaw-${yyyy}-${mm}-${dd}.log`;
}

function check_status() {
    const logFile = get_log_path();
    try {
        const stats = fs.statSync(logFile);
        const diffSecs = (Date.now() - stats.mtimeMs) / 1000;
        if (diffSecs < 5) {
            return 'running';
        } else {
            return 'idle';
        }
    } catch (e) {
        return 'idle';
    }
}

function sample(rate, format, config) {
    return new Promise((fulfill) => {
        const statusStr = check_status();
        const _output = format.replace(/{(\d+)}/g, function (match, number) {
            switch (number) {
                case '0': return statusStr;
                default: return 'null';
            }
        });
        fulfill({ value: _output, min: 0, max: 1 });
    });
}

function init(config) {
    logger.info('initialize: sensor log_activity loaded');
    return 'log_activity';
}

function stop() { return Promise.resolve(); }

function settings() {
    return {
        name: 'log_activity',
        description: 'displays agent task status via log mtime',
        icon: 'pi-file',
        multiple: false,
        fields: []
    };
}

module.exports = { init, settings, sample, stop };

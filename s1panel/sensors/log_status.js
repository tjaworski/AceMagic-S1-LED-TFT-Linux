'use strict';
/*!
 * s1panel - sensor/log_status
 * Monitors the OpenClaw gateway log to independently detect agent activity.
 * No agent cooperation needed - purely observes log file mtime + last event.
 */
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const LOG_DIR = '/tmp/openclaw';
const ACTIVE_THRESHOLD_MS = 20000; // log written in last 20s = active

function get_today_log() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const name = `openclaw-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.log`;
    return path.join(LOG_DIR, name);
}

function parse_last_event(logPath) {
    try {
        const fd = fs.openSync(logPath, 'r');
        const stat = fs.fstatSync(fd);
        const size = stat.size;
        const readSize = Math.min(4096, size);
        const buf = Buffer.alloc(readSize);
        fs.readSync(fd, buf, 0, readSize, size - readSize);
        fs.closeSync(fd);

        const lines = buf.toString('utf8').split('\n').filter(l => l.trim());
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                const obj = JSON.parse(lines[i]);
                const tags = obj['1'] && obj['1'].tags ? obj['1'].tags : [];
                const event = obj['1'] && obj['1'].event ? obj['1'].event : '';
                if (tags.includes('rate_limit') || (obj['1'] && obj['1'].error && String(obj['1'].error).includes('rate limit'))) return 'rate_limit';
                if (tags.includes('agent_end') || event.includes('agent_end')) return 'idle';
                if (tags.includes('lifecycle') && event.includes('start')) return 'active';
            } catch (e) {}
        }
    } catch (e) {}
    return null;
}

function sample(rate, format, config) {
    return new Promise((fulfill) => {
        const logPath = get_today_log();
        let status = 'idle';
        let detail = '';

        try {
            const stat = fs.statSync(logPath);
            const ageMs = Date.now() - stat.mtimeMs;
            if (ageMs < ACTIVE_THRESHOLD_MS) {
                const lastEvent = parse_last_event(logPath);
                if (lastEvent === 'rate_limit') {
                    status = 'rate_limit';
                    detail = 'rate limited';
                } else {
                    status = 'active';
                    detail = 'running';
                }
            } else {
                status = 'idle';
                detail = '';
            }
        } catch (e) {
            status = 'idle';
        }

        const _output = format.replace(/{(\d+)}/g, (m, n) => {
            switch (n) {
                case '0': return status;
                case '1': return detail;
                default: return '';
            }
        });

        fulfill({ value: _output, min: 0, max: 1 });
    });
}

function init(config) {
    logger.info('initialize: log_status sensor watching ' + LOG_DIR);
    return 'log_status';
}

function stop() { return Promise.resolve(); }

function settings() {
    return {
        name: 'log_status',
        description: 'monitors openclaw log file to detect agent activity',
        icon: 'pi-bolt',
        multiple: false,
        fields: []
    };
}

module.exports = { init, settings, sample, stop };

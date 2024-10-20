'use strict';
/*!
 * s1panel - led_thread
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads     = require('worker_threads');
const led         = require('./led_device');
const logger      = require('./logger');

threads.parentPort.on('message', message => {

    var _promise = Promise.resolve();

    switch (message.theme) {
        case 1:
            _promise = led.set_rainbow(message.device, message.intensity, message.speed);
            break;

        case 2:
            _promise = led.set_breathing(message.device, message.intensity, message.speed);
            break;

        case 3:
            _promise = led.set_color(message.device, message.intensity, message.speed);
            break;

        case 4:
            _promise = led.set_off(message.device);
            break;

        case 5:
            _promise = led.set_automatic(message.device, message.intensity, message.speed);
            break;

        case 6:
            // ignore
            logger.info('led_thread: ignore');
            _promise = Promise.resolve();
            break;
    }

    return _promise;
});

logger.info('led_thread: started...');

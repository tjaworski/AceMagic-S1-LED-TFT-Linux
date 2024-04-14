'use strict';
/*!
 * s1panel - lcd_thread
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads     = require('worker_threads');
const node_hid    = require('node-hid');
const lcd         = require('./lcd_device');
const logger      = require('./logger');

const usb_hid     = node_hid.HIDAsync;

const START_COOL_DOWN = 1000;

function get_hr_time() {

    return Math.floor(Number(process.hrtime.bigint()) / 1000000);
}

function next_lcd_update(handle, state, job, fulfill) {

    if (job && job.type === 'update') {
    
        return lcd.refresh(handle, job.rect.x, job.rect.y, job.rect.width, job.rect.height, job.image).then(() => {

            // intentionally blank

        }, err => {          

            logger.error('hid error: ' + err);

        }).finally(() => {
          
            next_lcd_update(handle, state, state.queue.shift(), fulfill);
        });
    }

    return fulfill({ type: 'update', complete: true });
}

function start_lcd_update(handle, state, job) {

    return new Promise(fulfill => {

        next_lcd_update(handle, state, job, fulfill);
    });
}

function start_lcd_redraw(handle, state, job) {

    return new Promise(fulfill => {
        
        lcd.redraw(handle, job.image).then(() => {

            // intentionally blank

        }, err => {

            logger.error('start_lcd_redraw: hid error: ' + err);

        }).finally(() => {
            
            fulfill({ type: 'redraw', complete: true });
        });
    });
}

function start_lcd_heartbeat(handle) {

    return new Promise(fulfill => {
    
        lcd.heartbeat(handle).then(() => {

            // intentionally blank

        }, err => {

            logger.error('start_lcd_heartbeat: hid error: ' + err);

        }).finally(() => {
            
            fulfill({ type: 'heartbeat', complete: false });
        });
    });
}

function start_lcd_orientation(handle, job) {

    return new Promise((fulfill, reject) => {
    
        lcd.set_orientation(handle, job.portrait).then(() => {

            // intentionally blank

        }, err => {

            logger.error('start_lcd_orientation: hid error: ' + err);

        }).finally(() => {
            
            fulfill({ type: 'orientation', complete: false });
        });
    });
}

function refresh_device(handle, state) {    
    
    const _now = get_hr_time();
    var _promise = Promise.resolve({ type: 'idle' });
    var _sleep_for = 10;

    if (state.queue.length) {
        
        const _last_heartbeat = _now - state.last_heartbeat;

        if (_last_heartbeat > state.heartbeat) {
            
            _promise = start_lcd_heartbeat(handle);
        }  
        else
        {
            const _job = state.queue.shift();

            switch (_job.type) {
            
                case 'redraw':
                    _promise = start_lcd_redraw(handle, state, _job);
                    _sleep_for = state.refresh;
                    break;

                case 'update':                
                    _promise = start_lcd_update(handle, state, _job);
                    break;
                
                case 'orientation':
                    _promise = start_lcd_orientation(handle, _job);
                    break;

                case 'heartbeat':
                    _promise = start_lcd_heartbeat(handle);
                    break;
            };  
        }      
    }
    else {

        const _last_activity = _now - state.last_activity;
        
        if (_last_activity > state.refresh) {

            _promise = start_lcd_heartbeat(handle);
        }
    }

    _promise.then(rc => {
        
        if ('idle' !== rc.type) {

            if ('heartbeat' === rc.type) {

                state.last_heartbeat = get_hr_time(); 
            }
            else {

                threads.parentPort.postMessage({ type: rc.type, complete: rc.complete });
            }

            state.last_activity = get_hr_time();
        }

    }, err => {

        logger.error('lcd reported an error ' + err);

    }).finally(() => {

        setTimeout(() => {

            refresh_device(handle, state);
    
        }, _sleep_for);

    });
}

function thread_handler(state, message) {

    switch (message.type) {
    
        case 'orientation':
        case 'heartbeat':
            state.queue.push(message);
            break;
            
        case 'redraw':
            state.queue.push({ type: 'redraw', image: { data: message.pixelData } });
            break;

        case 'update':                
            state.queue.push({ type: 'update', rect: message.rect, image: { data: message.pixelData }});
            break;

        case 'config':
            state.poll = message.poll || state.poll;
            state.refresh = message.refresh || state.refresh;
            state.heartbeat = message.heartbeat || state.heartbeat;
            break;

        default:
            logger.error('unknown lcd_thread type: ' + message.type);
            break;
    }
} 

function main(state) {

    threads.parentPort.on('message', message => {
        thread_handler(state, message);
    });

    node_hid.setDriverType('libusb');

    usb_hid.open(state.device).then(handle => {
        
        setTimeout(() => {

            refresh_device(handle, state);
        
        }, START_COOL_DOWN);
        
    }, err => {

        logger.error('failed to open usbhid ' + state.device);
        logger.error(err);
    });
}

logger.info('lcd_thread: started...');

main({
    device             : threads.workerData.device,
    poll               : threads.workerData.poll,
    refresh            : threads.workerData.refresh,
    heartbeat          : threads.workerData.heartbeat,
    last_heartbeat     : get_hr_time(),
    last_activity      : get_hr_time(),
    queue              : [],
});


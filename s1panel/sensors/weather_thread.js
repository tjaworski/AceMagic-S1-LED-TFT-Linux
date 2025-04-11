'use strict';
/*!
 * s1panel - sensor/weather_thread
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads  = require('worker_threads');
const logger   = require('../logger');

const DEFAULT_RATE_MS = (5 * (60 * 1000));  // capped at 5 minutes, please watch the api rate limits
const TIMEOUT_COUNT = 30;

var _running = false;
var _collect_count = 0;

var _fault = false;
var _timer = null;

function init_weather(config) {

    return new Promise((fulfill, reject) => {

        if (config.weather_init) {
            return fulfill();
        }

        const _url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + config.name + '&count=1&country=' + config.country;

        fetch(_url).then(response => {
            
            if (200 !== response.status) {
                logger.info('weather_thread: api response status: ' + response.status + ' for ' + threads.workerData.name);
                return reject();                  
            }

            response.json().then(geo => {

                //logger.info(JSON.stringify(geo));

                if (geo.results && geo.results.length > 0) {

                    config.geo = geo.results[0];
                
                    config.weather_init = true;
                }

                fulfill();
            });

        }).catch(err => {
        
            logger.info('weather_thread: not able to get location for ' + threads.workerData.name + ' error: ' + err);      
            reject();   
        });
         
    });         
}

function current_weather(config) {

    return new Promise(fulfill => {

        var _url = 'https://api.open-meteo.com/v1/forecast?latitude=' + config.geo.latitude + '&longitude=' + config.geo.longitude;

        if (config.forecast) {

            const _now = new Date();

            _now.setDate(_now.getDate() + (config.forecast - 1));
            
            const _date_str = _now.toISOString().split('T')[0];

            _url += '&start_date=' + _date_str + '&end_date=' + _date_str + '&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant';
        }
        else {

            _url += '&current_weather=true';
        }

        if (config.imperial) {

            _url += '&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch';
        }
        
        fetch(_url).then(response => {
        
            if (200 === response.status) {

                var _weather_data;

                response.json().then(data => {
            
                    //logger.info(JSON.stringify(data));

                    _weather_data = {
                        weather : config.forecast ? data.daily : data.current_weather,
                        units   : config.forecast ? data.daily_units : data.current_weather_units
                    };
    
                }, () => {

                    // parse error

                }).finally(() => {

                   fulfill(_weather_data); 
                });
            }
            else {

                logger.info('weather_thread: api response status: ' + response.status + ' for ' + threads.workerData.name);                
                fulfill();
            }

        }).catch(err => {

            logger.info('weather_thread: fetch error: ' + err + ' for ' + threads.workerData.name);                

            fulfill();
        });
    });
}

function collect(config, rate) {

    _collect_count++;

    if (_collect_count < TIMEOUT_COUNT) {

        return init_weather(config).then(() => {
        
            current_weather(config).then(results => {

                if (results) {
                    threads.parentPort.postMessage(results);                        
                }

                _timer = setTimeout(() => {

                    collect(config, rate);

                }, rate > DEFAULT_RATE_MS ? rate : DEFAULT_RATE_MS);
            
            });
        
        }, () => {
            
            _fault = true;
        });
    }

    logger.info('weather_thread: collector stopped for ' + threads.workerData.name);

    _running = false;

}

threads.parentPort.on('message', message => {

    _collect_count = 0; // reset

    if (message.stop) {

        logger.info('weather_thread: requested to stop ' + threads.workerData.name);
        
        // clear any outstanding timers...
        if (_timer) {
            clearTimeout(_timer);
        }

        // good bye
        return process.exit(0);
    }
    
    if (!_running) {

        _running = true;

        var _config = {
            weather_init : false,
            name         : message.name,
            country      : message.country,
            forecast     : message.forecast,
            imperial     : message.imperial
        };
    
        if (_fault) {
            logger.error('weather_thread: restart after read error');
            _fault = false;
        }

        logger.info('weather_thread: collector started for ' + threads.workerData.name);

        collect(_config, message.rate);
    }
});

logger.info('weather_thread: started... for ' + threads.workerData.name);

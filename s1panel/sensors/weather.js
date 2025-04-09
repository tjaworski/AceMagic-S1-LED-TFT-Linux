'use strict';
/*!
 * s1panel - sensor/weather
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */
const threads = require('worker_threads');

const logger  = require('../logger');

const wmo_weather_codes = { 
     0: 'Clear sky',            
     1: 'Mainly clear',         
     2: 'Partly cloudy',        
     3: 'Overcast',             
    45: 'Fog',                  
    48: 'Depositing rime fog', 
    51: 'Light drizzle',        
    53: 'Moderate drizzle',     
    55: 'Dense drizzle',        
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',          
    63: 'Moderate rain',        
    65: 'Heavy rain',           
    66: 'Light freezing rain',  
    67: 'Heavy freezing rain',  
    71: 'Slight snow fall',     
    73: 'Moderate snow fall',   
    75: 'Heavy snow fall',      
    77: 'Snow grains',          
    80: 'Slight rain showers',  
    81: 'Moderate rain showers',
    82: 'Violent rain showers', 
    85: 'Slight snow showers',  
    86: 'Heavy snow showers',   
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

const wind_directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function process_weather(priv, message) {
    
    var _units = message.units;
    var _weather = message.weather;

    if (priv.forecast) {

        priv.is_day = 1;

        if (_units.weathercode && _weather.weathercode) {

            if ('wmo code' === _units.weathercode) {
                priv.weathercode = _weather.weathercode[0];
            }
            else {
                priv.weathercode = 0;
            }  
        }

        if (_units.temperature_2m_min && _units.temperature_2m_min) {
            
            priv.temperature_min = {
                value: Math.floor(_weather.temperature_2m_min[0]),
                unit: _units.temperature_2m_min
            };                                
        }

        if (_units.temperature_2m_max && _units.temperature_2m_max) {
            
            priv.temperature_max = {
                value: Math.floor(_weather.temperature_2m_max[0]),
                unit: _units.temperature_2m_max
            };                                
        }

        if (_units.windspeed_10m_max && _weather.windspeed_10m_max) {

            priv.windspeed = {
                value: Math.floor(_weather.windspeed_10m_max[0]),
                unit: _units.windspeed_10m_max
            };
        }

        if (_units.winddirection_10m_dominant && _weather.winddirection_10m_dominant) {

            priv.winddirection = {
                value: _weather.winddirection_10m_dominant[0],
                unit: _units.winddirection_10m_dominant
            };
        }                                                    
        
        if (_units.precipitation_sum && _weather.precipitation_sum) {

            priv.precipitation = {
                value: _weather.precipitation_sum[0],
                unit: _units.precipitation_sum
            };
        }                            
    }
    else {

        if (_weather.is_day) {
            priv.is_day = _weather.is_day ? true : false;
        }

        if (_units.weathercode) {

            if ('wmo code' === _units.weathercode) {
                priv.weathercode = _weather.weathercode;
            }
            else {
                priv.weathercode = 0;
            }
        }

        if (_units.temperature && _weather.temperature) {

            priv.temperature = {
                value: Math.floor(_weather.temperature),
                unit: _units.temperature
            };
        }

        if (_units.windspeed && _weather.windspeed) {

            priv.windspeed = {
                value: Math.floor(_weather.windspeed),
                unit: _units.windspeed
            };
        }

        if (_units.winddirection && _weather.winddirection) {

            priv.winddirection = {
                value: _weather.winddirection,
                unit: _units.winddirection
            };                            
        }
    }

    priv.thread_checkin_count++;
}

function sample(rate, format, config) {

    return new Promise(fulfill => {

        const _private = config._private;

        const _diff = Math.floor(Number(process.hrtime.bigint()) / 1000000) - _private.last_sampled;
        var _dirty = false;

        if (!_private.last_sampled || _diff > rate) {
        
            _private.last_sampled = Math.floor(Number(process.hrtime.bigint()) / 1000000);

            _private.worker.postMessage({ 
                rate        : rate,
                name        : config.name,
                country     : config.country,
                forecast    : config.forecast,
                imperial    : config.imperial
            });

            _dirty = _private.thread_checkin_count ? true : false;
            _private.thread_checkin_count = 0;
        }
        
        var _max = 0;   // some values we will pass the is_day flag as max value
        var _min = 0;   // some values ww will pass the true if imperial
        
        const _output = format.replace(/{(\d+)}/g, function (match, number) {

            switch (number) {
                case '0':   // city
                    return _private?.location?.name || 'n/a';

                case '1':   // state
                    return _private?.location?.admin1 || 'n/a';

                case '2':   // county
                    return _private?.location?.admin2 || 'n/a';

                case '3':   // town
                    return _private?.location?.admin3 || 'n/a';

                case '4':   // wmo code
                    _min = _private.imperial ? true : false;
                    _max = _private?.is_day || 0;
                    return _private?.weathercode || 0;

                case '5':   // wmo code description
                    return wmo_weather_codes[_private.weathercode] || 'alien weather';

                case '6':   // daytime/nighttime
                    return _private?.is_day || 0;
                    
                case '7':   // temperature
                    _min = _private.imperial ? true : false;
                    _max = _private?.is_day || 0;
                    return _private?.temperature?.value;
                case '8':
                    return _private?.temperature?.unit;

                case '9':   // temperature_min
                    _min = _private.imperial ? true : false;
                    _max = _private?.is_day || 0;
                    return _private?.temperature_min?.value;
                case '10':
                    return _private?.temperature_min?.unit;

                case '11':   // temperature_max
                    _min = _private.imperial ? true : false;
                    _max = _private?.is_day || 0;
                    return _private?.temperature_max?.value;
                case '12':
                    return _private?.temperature_max?.unit;

                case '13':   // windspeed
                    _min = _private.imperial ? true : false;
                    _max = _private?.is_day || 0;
                    return _private?.windspeed?.value;
                case '14':
                    return _private?.windspeed?.unit;

                case '15':  // winddirection
                    return _private?.winddirection?.value;
                case '16':
                    return _private?.winddirection?.unit;

                case '17': // winddirection (text/abbr)
                    {
                        const _degrees = _private?.winddirection?.value || 0;
                        const _index = Math.round(_degrees / 45) % 8;
                        return wind_directions[_index];
                    }

                case '18':   // precipitation
                    _min = _private.imperial ? true : false;
                    _max = _private?.is_day || 0;
                    return _private?.precipitation?.value;
                case '19':
                    return _private?.precipitation?.unit;

                default:
                    return 'null';                        
            }
        });
            
        fulfill({ value: _output, min: _min, max: _max });
    });
}

/*
{
  "results": [
    {
      "id": 2147714,
      "name": "Sydney",
      "latitude": -33.86785,
      "longitude": 151.20732,
      "elevation": 58,
      "feature_code": "PPLA",
      "country_code": "AU",
      "admin1_id": 2155400,
      "timezone": "Australia/Sydney",
      "population": 4627345,
      "country_id": 2077456,
      "country": "Australia",
      "admin1": "New South Wales"
    }
  ],
  "generationtime_ms": 0.6580353
}
*/

/*
{
  "latitude": -33.75,
  "longitude": 151.125,
  "generationtime_ms": 0.0442266464233398,
  "utc_offset_seconds": 0,
  "timezone": "GMT",
  "timezone_abbreviation": "GMT",
  "elevation": 51,
  "current_weather_units": {
    "time": "iso8601",
    "interval": "seconds",
    "temperature": "°F",
    "windspeed": "mp/h",
    "winddirection": "°",
    "is_day": "",
    "weathercode": "wmo code"
  },
  "current_weather": {
    "time": "2025-03-27T16:45",
    "interval": 900,
    "temperature": 66.3,
    "windspeed": 2.2,
    "winddirection": 186,
    "is_day": 0,
    "weathercode": 3
  }
}
*/

function init(config) {

    const _private = {
        name        : config?.name || 'nyc',    // zip code, or location name ie: Sydney
        country     : config?.country || 'US',  // 2-digit country code, US, AU, UK, JP, etc...
        weathercode : -1,
        forecast    : config?.forecast || 0,    // 0 = current weather, 1 = today, 2 = tomorrow, 3 = day after, ...
        need_init   : true,
        thread_checkin_count: 0
    };

    if (config?.imperial) {

        _private.imperial = config?.imperial;    
    }
    else if (_private.country === 'US') {

        _private.imperial = true;   // set to imperial for US only if not specified
    }

    var _label = '';

    //
    // get the forcast, but lets not go crazy and only allow 7 days.
    // the api will allow up to 15 days, if you need it that far out
    // remove or adjust the if statement below
    //
    if (_private.forecast > 7) {
        _private.forecast = 7;
    }
   
    switch (_private.forecast) {
        case 0: // sunday (right now)
            _label = 'current';
            break;

        case 1: // sunday (the whole day)
            _label = 'today';
            break;

        case 2: // monday
            _label = 'tomorrow';
            break;
            
        case 3: // tuesday (2 days out)
            _label = 'day+' + (_private.forecast - 1) + 'nd';
            break;

        case 4: // wednesday (3 days out)
            _label = 'day+' + (_private.forecast - 1) + 'rd';
            break;  

        case 5: // thursday (4 days out)
            _label = 'day+' + (_private.forecast - 1) + 'th';
            break;
    
        case 6: // friday (5 days out)
            _label = 'day+' + (_private.forecast - 1) + 'th';
            break;

        case 7: // saturday (6 days out)
            _label = 'day+' + (_private.forecast - 1) + 'th';
            break;

        default:
            _label = 'day+' + (_private.forecast - 1) + 'th';
            break;
    }
    
    config._private = _private;
    
    _private.worker = new threads.Worker(__dirname + '/weather_thread.js', { 
        
        workerData: { name: _private.name }
    });

    _private.worker.on('message', message => {

        process_weather(_private, message);
    });
    
    logger.info('initialize: weather settings for: ' + _private.name + ', country: ' + _private.country + ', forecast: ' + _label + ' (' + _private.forecast + ')');

    return _label + '_weather_' + _private.name;
}

function stop(config) {
    
    return new Promise(fulfill => {

        if (config && config._private) {
            
            const _private = config._private;

            if (_private.worker) {

                // notify thread to exit
                _private.worker.postMessage({ stop: true });
                
                // wait for at least 10 second to kill it
                const _timer = setTimeout(() => {
                    _private.worker.terminate().then(() => {
                        logger.info('killed weather thread for ' + _private.name);                
                        fulfill();
                    });
                }, 10000);

                // if thread stopped gracefully, we're good!
                _private.worker.on('exit', () => {
                    clearTimeout(_timer);
                    logger.info('stopped weather thread for ' + _private.name);
                    fulfill();                
                });
            }
            else {
                fulfill();
            }
        }
        else {
            fulfill();
        }
    });
}

/* this will only be used for GUI configuration */

function settings() {
    return {
        name: 'weather',
        description: 'weather sensor',
        icon: 'pi-cloud',
        multiple: true,
        ident: [ 'name', 'forecast'],   // which fields will change the identity of the sensor
        fields: [
            { name: 'name', type: 'string', value: 'nyc' },
            { name: 'country', type: 'string', value: 'US' },
            { name: 'forecast', type: 'number', value: 0, min: 0, max: 7 },
            { name: 'imperial', type: 'boolean', value: true }
        ]
    };
}

module.exports = {
    init,
    settings,
    sample,
    stop
};

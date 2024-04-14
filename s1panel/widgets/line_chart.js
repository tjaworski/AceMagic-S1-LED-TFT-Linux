'use strict';
/*!
 * s1panel - widget/line_chart
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const logger = require('../logger');

const { loadImage }         = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

function debug_rect(context, rect) {

    context.lineWidth = 1;
    context.strokeStyle = "red";
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.stroke();
}

function draw_chart(context, x, y, w, h, chart, config) {

    return new Promise((fulfill, reject) => {

        chart.renderToBuffer(config).then(buffer => {
            
            loadImage(buffer).then(image => {

                context.drawImage(image, 0, 0, w, h, x, y, w, h);
        
                fulfill();

            }, reject);
        
        }, reject);
    });
}

function get_private(config) {

    if (!config._private) {
        config._private = {};
    }
    return config._private;
}

function draw(context, value, min, max, config) {

    return new Promise(fulfill => {

        const _private = get_private(config);
        const _rect = config.rect;

        const _data = value.split(',');

        var _has_changed = false;

        context.save();
        context.beginPath();
        context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
        context.clip();

        const _points = new Array(config.points);
        const _labels = new Array(config.points);

        var _max_points = Math.min(config.points, _data.length); 

        var _count = 0;
        for (var i = _data.length - _max_points; i < _data.length; i++) {    

            _points[_count] = _data[i]; // y axis
            _labels[_count] = _count;   // x axis

            if (!_has_changed) {

                if (!_private.last_value) {
                    _has_changed = true;
                } 
                else if (_data[i] != _private.last_value[i]) {
                    _has_changed = true;
                }
            }
            _count++;        
        }

        const _configuration = {

            type: 'line',
            data: {
                labels: _labels,
                datasets: [{
                    label           : '',
                    data            : _points,
                    fill            : config.area || false,
                    pointStyle      : 'circle',
                    backgroundColor : config.fill || '#00e600',
                    borderColor     : config.outline || '#4d4d4d', 
                    tension         : 0.1
                }]
            },
            options: {
                plugins: {
                    legend: {
                      display: false
                    }
                },
                responsive: true,
                layout: { 
                    padding: { 
                        bottom: 0,
                        top: 0,
                        right: 0,
                        left: 0
                    } 
                },
                scales: {
                    x: {
                        type        : 'linear',
                        min         : 0,
                        max         : _points.length,
                        display     : false
                    },
                    y: {
                        type        : 'linear',
                        min         : min,
                        max         : max,
                        display     : false,
                        beginAtZero : true,
                        border: {
                            display : false
                        }
                    }
                },
                legend: {
                    display: false
                },
                elements: {
                    point: {
                        radius: 0
                    }
                }
            }
        };

        if (!_private.chart || _private.chart._width != _rect.width || _private.chart._height != _rect.height) {

            if (_private.chart) {

                delete _private.chart;
            }
            _private.chart = new ChartJSNodeCanvas({ width: _rect.width, height: _rect.height });
        }

        draw_chart(context, _rect.x, _rect.y, _rect.width, _rect.height, _private.chart, _configuration).then(() => {

            if (_has_changed) {

                _private.last_value = value;
            }

            if (config.debug_frame) {
                
                debug_rect(context, _rect);
            }

            context.restore();

        }, () => {

            logger.error('line chart failed to draw');

        }).finally(() => {

            fulfill(_has_changed);
        });       
    }); 
}

function info() {
    return {
        name: 'line_chart',
        description: 'A line chart',
        fields: [ 
            { name: 'outline', value: 'color' }, 
            { name: 'fill', value: 'color' }, 
            { name: 'points', value: 'number' }, 
            { name: 'area', value: 'boolean' } ]
    };
}

module.exports = {
    info,
    draw
};
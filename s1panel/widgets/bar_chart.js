'use strict';
/*!
 * s1panel - widget/bar_chart
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const logger = require('../logger');

const { loadImage }         = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const DEFAULT_ZOOM = 0;

function debug_rect(context, rect) {

    context.lineWidth = 1;
    context.strokeStyle = "red";
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.stroke();
}

function draw_chart(context, x, y, w, h, zoom, chart, config) {

    return new Promise((fulfill, reject) => {

        chart.renderToBuffer(config).then(buffer => {
            
            loadImage(buffer).then(image => {

                const _zoom = zoom / 2;

                context.drawImage(image, _zoom, 0, w - _zoom, h, x, y, w, h);
        
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

    return new Promise((fulfill, reject) => {

        const _private = get_private(config);
        const _rect = config.rect;

        const _data = value.split(',');

        var _has_changed = false;

        context.save();
        context.beginPath();
        context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
        context.clip();

        const _zoom = (config.zoom || DEFAULT_ZOOM) * 2;
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

        const _x_axis = {
            type        : 'linear',
            min         : 0,
            max         : _points.length,
            display     : false
        };

        const _y_axis = {
            type        : 'linear',
            min         : min,
            max         : max,
            display     : false,
            beginAtZero : true,
            border: {
                display : false
            }
        };

        const _configuration = {

            type: 'bar',
            data: {
                labels: _labels,
                datasets: [{
                    label           : '',
                    data            : _points,
                    backgroundColor : config.fill || '#00e600',
                    borderColor     : config.outline || '#4d4d4d', 
                    borderWidth     : 1,
                    barThickness    : config.thickness || 1
                }]
            },
            options: {
                indexAxis: config.horizontal ? 'y' : 'x',
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
                    x: config.horizontal ? _y_axis : _x_axis,
                    y: config.horizontal ? _x_axis : _y_axis,
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

        if (!_private.chart || _private.chart._width != (_rect.width + _zoom) || _private.chart._height != _rect.height) {

            if (_private.chart) {
                delete _private.chart;
            }
            _private.chart = new ChartJSNodeCanvas({ width: _rect.width + _zoom, height: _rect.height });
        }

        draw_chart(context, _rect.x, _rect.y, _rect.width + _zoom, _rect.height, _zoom, _private.chart, _configuration).then(() => {

            if (_has_changed) {
                _private.last_value = value;
            }

            if (config.debug_frame) {
                debug_rect(context, _rect);
            }

            context.restore();

        }, () => {

            logger.error('bar chart failed to draw');

        }).finally(() => {

            fulfill(_has_changed);
        });       
    }); 
}

function info() {
    return {
        name: 'bar_chart',
        description: 'A bar chart',
        fields: [ 
            { name: 'outline', value: 'color' }, 
            { name: 'fill', value: 'color' }, 
            { name: 'points', value: 'number' },
            { name: 'thickness', value: 'number' },
            { name: 'zoom', value: 'number'},
            { name: 'horizontal', value: 'boolean' } ]
    };
}

module.exports = {
    info,
    draw
};
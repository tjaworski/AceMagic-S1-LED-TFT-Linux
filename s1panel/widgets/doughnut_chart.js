'use strict';
/*!
 * s1panel - widget/doughnut_chart
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

function draw_chart(context, x, y, chart, config) {

    return new Promise((fulfill, reject) => {

        chart.renderToBuffer(config).then(buffer => {
            
            loadImage(buffer).then(image => {

                context.drawImage(image, x, y);
        
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

        const _has_changed = (_private.last_value !== value) ? true : false;

        context.save();
        context.beginPath();
        context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
        context.clip();

        const _points = [ Number(value) - min, Number(max) - Number(value) ];
        const _labels = [ 'used', 'unused '];

        const _configuration = {
            type: 'doughnut',
            data: {
                labels: _labels,
                datasets: [{
                    label           : '',
                    data            : _points,
                    backgroundColor : [(config.used || '#48BB78'), (config.free || '#EDF2F7')],
                    borderColor     : config.free,
                    rotation        : config.rotation || 225,
                    cutout          : config.cutout || '80%',
                    circumference   : config.circumference || 270,
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
                        top: 0
                    } 
                },               
                legend: {
                    display: false
                }
            }
        };

        if (!_private.chart || _private.chart._width != _rect.width || _private.chart._height != _rect.height) {

            if (_private.chart) {
                delete _private.chart;
            }
            _private.chart = new ChartJSNodeCanvas({ width: _rect.width, height: _rect.height });
        }

        draw_chart(context, _rect.x, _rect.y, _private.chart, _configuration).then(() => {

            if (_has_changed) {
                _private.last_value = value;
            }

            if (config.debug_frame) {
                debug_rect(context, _rect);
            }

            context.restore();

        }, () => {

            logger.error('dougnut_chart draw failed');

        }).finally(() => {

            fulfill(_has_changed);
        });       
    }); 
}

function info() {
    return {
        name: 'doughnut_chart',
        description: 'A daughnut chart',
        fields: [ 
            { name: 'used', value: 'color'}, 
            { name: 'free', value: 'color' }, 
            { name: 'rotation', value: 'string' }, 
            { name: 'cutout', value: 'string' }, 
            { name: 'circumference', value: 'string' } ]
    };
}

module.exports = {
    info,
    draw
};

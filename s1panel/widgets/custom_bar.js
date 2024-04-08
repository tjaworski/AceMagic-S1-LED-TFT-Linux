'use strict';
/*!
 * s1panel - widget/custom_bar
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
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
        const _has_changed = (_private.last_value !== value) ? true : false;

        const _barWidth = _rect.width; 
        const _barHeight = _rect.height; 
        const _fillPercentage = value;
        const _fillWidth = (_barWidth * _fillPercentage) / 100;

        context.save();
        context.beginPath();
        context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
        context.clip();
        
        {
            const _gradient = context.createLinearGradient(_rect.x, _rect.y, _rect.x, _rect.y + _barHeight);
            _gradient.addColorStop(0, '#404040'); 
            _gradient.addColorStop(1, '#000000'); 
            context.fillStyle = _gradient;
        }

        context.fillRect(_rect.x, _rect.y, _barWidth, _barHeight);

        {
            const _gradient = context.createLinearGradient(_rect.x, _rect.y, _rect.x, _rect.y + _barHeight);
            _gradient.addColorStop(0, 'lightgreen'); 
            _gradient.addColorStop(1, 'darkgreen'); 
            context.fillStyle = _gradient;
        }

        context.fillRect(_rect.x, _rect.y, _fillWidth, _barHeight);

        if (config.debug_frame) {
            context.lineWidth = 1;
            context.strokeStyle = "red";
            context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
            context.stroke();
        }
        
        context.restore();

        if (_has_changed) {
            _private.last_value = value;
        }
        
        fulfill(_has_changed);
    }); 
}

function info() {
    return {
        name: 'custom_bar',
        description: 'An example of a custom widget',
        fields: []
    };
}

module.exports = {
    info,
    draw
};
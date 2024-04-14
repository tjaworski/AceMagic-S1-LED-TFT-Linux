'use strict';
/*!
 * s1panel - widget/text
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

    return new Promise(fulfill => {

        const _private = get_private(config);

        const _rect = config.rect;

        const _has_changed = _private.last_value !== value ? true : false;

        context.save();   
        context.beginPath();
        context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
        context.clip();

        context.font = config.font || '20px Arial';
        context.fillStyle = config.color || 'white';
        context.textAlign = 'left';
        context.textBaseline = 'top';

        var _ruler = context.measureText(value);
        var _offset = 0;

        switch (config.align) {
            case 'center':
                _offset = (_rect.width / 2) - (_ruler.width / 2);
                break;
            case 'right':
                _offset = _rect.width - _ruler.width;
                break;
        }

        context.fillText(value, _rect.x + _offset, _rect.y);

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
        name: 'text',
        description: 'A formatted string',
        fields: [ { name: 'font', value: 'font' }, { name: 'color', value: 'color' }, { name: 'align', value: 'list:left,center,right'} ]
    };
}
module.exports = {
    info,
    draw
};
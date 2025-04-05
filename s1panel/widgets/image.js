'use strict';
/*!
 * s1panel - widget/image
 * Copyright (c) 2024-2025 Tomasz Jaworski
 * GPL-3 Licensed
 */
const node_canvas = require('canvas');

function start_draw(context, rect) {
    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
}

function debug_rect(context, rect) {

    context.lineWidth = 1;
    context.strokeStyle = "red";
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.stroke();
}

function load_image(name, _private) {

    return new Promise((fulfill, reject) => {

        if (_private.image) {
            return fulfill(_private.image);
        }

        node_canvas.loadImage(name).then(image => {
            
            _private.image = image;

            return fulfill(image);
        
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

        start_draw(context, _rect);
        
        if (value) {

            load_image(value, _private).then(image => {
            
                context.drawImage(image, _rect.x, _rect.y);
                
            }, () => {

                // something went wrong

            }).finally(() => {

                if (config.debug_frame) {
                    debug_rect(context, _rect);
                }

                context.restore();

                fulfill(false);
            });
        }
        else {

            if (config.debug_frame) {                                
                debug_rect(context, _rect);
            }
            
            context.restore();

            fulfill(false);
        }
    }); 
}

function info() {
    return {
        name: 'image',
        description: 'a static png image',
        fields: []
    };
}

module.exports = {
    info,
    draw
};
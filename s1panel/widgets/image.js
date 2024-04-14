'use strict';
/*!
 * s1panel - widget/image
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const node_canvas = require('canvas');

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

        context.save();
        context.beginPath();
        context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
        context.clip();
        
        if (value) {

            load_image(value, _private).then(image => {
            
                context.drawImage(image, _rect.x, _rect.y);

                if (config.debug_frame) {
                    context.lineWidth = 1;
                    context.strokeStyle = "red";
                    context.rect(_rect.x, _rect.y, _rect.width, _rect.height);
                    context.stroke();
                }
                
                context.restore();
                
                fulfill(false);

            }, () => {

                context.restore();

                fulfill(false);
            });
        }
        else {

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
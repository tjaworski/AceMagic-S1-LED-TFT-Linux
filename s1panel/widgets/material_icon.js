'use strict';
/*!
 * s1panel - widget/image
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const node_canvas = require('canvas');

function replaceRootSVGProperties(svgData, properties) {

    const groups = /^<svg ([^>]*)>/.exec(svgData);

    const newProperties = [];

    for(let prop of groups[1].split(' ')) {

        let filteredOut = false;

        for (let key in properties) {

            if (prop.match(key)) {

                filteredOut = true;
                break;
            }
        }

        if (!filteredOut) {

            newProperties.push(prop);
        }
    }

    for (let key in properties) {
        
        const value = properties[key];
        newProperties.push(`${key}='${value}'`);
    }

    return svgData.replace(/^<svg [^>]*>/, `<svg ${newProperties.join(' ')}>`);
}

function load_icon(name, family, _private) {

    return new Promise((fulfill, reject) => {

        const slug = `${name}/${family}`;

        if (_private.icons[slug]) {

            return fulfill(_private.icons[slug]);
        }

        const url = `https://material-icons.github.io/material-icons/svg/${slug}.svg`;

        fetch(url).then(response => {

            if (response.status !== 200) {

                return reject();
            }

            return response.text().then((image) => {

                _private.icons[slug] = image;
    
                return fulfill(image);
            });
        
        }, (error) => {
            reject();
        });
    });
}

function get_private(config) {

    if (!config._private) {

        config._private = {
            icons: {}
        };
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

        const color = config.color || '#ffffff';
        
        load_icon(value, config.family, _private).then(image => {

            image = replaceRootSVGProperties(image, {
                width: _rect.width,
                height: _rect.height,
                fill: color,
            });

            node_canvas.loadImage(`data:image/svg+xml,${image}`).then((loadedImage) => {

                context.drawImage(loadedImage, _rect.x, _rect.y, _rect.width, _rect.height);

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
        }, () => {

            context.restore();

            fulfill(false);
        });
    }); 
}

function info() {
    return {
        name: 'material_icon',
        description: 'a material icon svg',
        fields: [
            { name: "family", value: "list:baseline,sharp,outline,round,two-tone" },
            { name: "color", value: "color" }
        ]
    };
}

module.exports = {
    info,
    draw
};
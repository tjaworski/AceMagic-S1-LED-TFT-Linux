'use strict';
/*!
 * s1panel - widget/image
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const node_canvas = require('canvas');
const logger = require('../logger');

function replaceRootSVGProperties(svgData, properties) {

    const groups = /^<svg ([^>]*)>/.exec(svgData);

    if (!groups) {
        return svgData;
    }

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

    return svgData
        .replace(/^<svg [^>]*>/, `<svg ${newProperties.join(' ')}>`)
        .replaceAll(/[\r\n]+/g, '')
        .replaceAll(/fill=[\'\"]currentColor[\'\"]/g, `fill='${properties.fill || "currentColor"}'`);
}

function load_icon(name, iconSet, _private) {

    return new Promise((fulfill, reject) => {

        const slug = `${iconSet}/${name}`;

        if (_private.icons[slug]) {

            return fulfill(_private.icons[slug]);
        }
        
        const url = `https://api.iconify.design/${slug}.svg`

        fetch(url).then(response => {

            if (response.status !== 200) {
                logger.error(`error ${response.status} for ${url}`);

                return reject();
            }

            return response.text().then((image) => {

                _private.icons[slug] = image;
    
                return fulfill(image);
            });
        
        }, (error) => {
            logger.error(`error ${error} for ${url}`);
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
        
        load_icon(value, config.iconSet || 'mdi', _private).then(image => {

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
        name: 'iconify',
        description: 'an icon from iconify',
        fields: [
            { name: "iconSet", value: "list:mdi,material-symbols,simple-icons" },
            { name: "color", value: "color" }
        ]
    };
}

module.exports = {
    info,
    draw
};
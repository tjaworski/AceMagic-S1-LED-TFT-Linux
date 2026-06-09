'use strict';
/*!
 * s1panel - widget/service_status
 */

function start_draw(context, rect) {
    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
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
        const _has_changed = _private.last_value !== value;

        start_draw(context, _rect);

        // Clear background
        context.clearRect(_rect.x, _rect.y, _rect.width, _rect.height);

        // Detect if we haven't received a real value yet (initial state)
        // Usually initial state comes through as the raw format string, like "{1}" or undefined
        const isUnknown = (!value || value === '{1}' || value === 'null');
        const isActive = (value === 'active' || value === 'true' || value === '1');

        const cx = _rect.x + _rect.width / 2;
        const cy = _rect.y + _rect.height / 2;
        const radius = Math.min(_rect.width, _rect.height) / 2 - 2;

        // Background circle
        context.beginPath();
        context.arc(cx, cy, radius, 0, 2 * Math.PI, false);
        
        if (isUnknown) {
            context.fillStyle = '#666666'; // Gray for unknown/loading
        } else {
            context.fillStyle = isActive ? '#00e600' : '#ff0000';
        }
        context.fill();

        // Icon inside (checkmark, cross, or dash)
        context.lineWidth = 2;
        context.strokeStyle = 'white';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();

        if (isUnknown) {
            // Dash (loading state)
            context.moveTo(cx - radius/2.5, cy);
            context.lineTo(cx + radius/2.5, cy);
        } else if (isActive) {
            // Checkmark
            context.moveTo(cx - radius/2.5, cy);
            context.lineTo(cx - radius/8, cy + radius/2.5);
            context.lineTo(cx + radius/2.5, cy - radius/2.5);
        } else {
            // Cross
            context.moveTo(cx - radius/2.5, cy - radius/2.5);
            context.lineTo(cx + radius/2.5, cy + radius/2.5);
            context.moveTo(cx + radius/2.5, cy - radius/2.5);
            context.lineTo(cx - radius/2.5, cy + radius/2.5);
        }
        context.stroke();

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
        name: 'service_status',
        description: 'Draws a green check or red cross based on value',
        fields: []
    };
}

module.exports = {
    info,
    draw
};

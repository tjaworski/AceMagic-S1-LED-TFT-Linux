'use strict';
/*!
 * s1panel - logger
 * Copyright (c) 2024 Tomasz Jaworski
 * GPL-3 Licensed
 */
const winston = require('winston');

const service = process.env.SERVICE || false;

function as_service() {

    console.log = function () {};
    
    return winston.createLogger({

        format: winston.format.combine(winston.format.printf(i => `[${i.level}] ${i.message}`)),
        transports: [new winston.transports.Console()],
    });
}

function as_cmdline() {

    return winston.createLogger({

        format: winston.format.combine(
            
            winston.format.colorize(), 
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.sss' }), 
            winston.format.printf(i => `${i.timestamp} [${i.level}] ${i.message}`)),

        transports: [new winston.transports.Console()],
    });
}

module.exports = service ? as_service() : as_cmdline();

// utils/logger.js
// Logger centralizado basado en Winston.
// Formato: [timestamp][NIVEL][módulo] mensaje
// Todos los módulos del proyecto importan desde acá con .child({ module }).

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, printf, colorize } = format;

const lineFormat = printf(({ level, message, timestamp: ts, module: mod, ...meta }) => {
  const modTag = mod ? `[${mod}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}][${level.toUpperCase()}]${modTag} ${message}${metaStr}`;
});

const transportList = [
  new transports.Console({
    format: combine(
      timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      lineFormat,
      colorize({ all: false })
    ),
  }),
];

if (config.env === 'production') {
  transportList.push(
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        lineFormat
      ),
    })
  );
}

const logger = createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  transports: transportList,
});

module.exports = logger;

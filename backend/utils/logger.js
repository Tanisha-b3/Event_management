// backend/utils/logger.js
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
});


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join('logs', 'combined.log') })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
  ]
});

// Example warning log usage
// logger.warn('This is a warning message', { meta: 'optional meta info' });

export default logger;

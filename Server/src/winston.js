// var appRoot = require('app-root-path');
const winston = require('winston');
const { format } = require('winston');
const { combine, timestamp, label, json, printf } = format;

// log levels=  error: 0,  warn: 1,  info: 2,  http: 3,  verbose: 4,  debug: 5,  silly: 6

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});


winston.loggers.add('apiLogger', {
  format: combine(
    label({ label: 'ApiLog' }),
    timestamp(),
    myFormat,
    format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: global.appConfig.appRootPath + '/logs/api-logs.log',
      json: false,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.Console(),
  ]
});
winston.loggers.add('systemLogger', {
  format: combine(
    label({ label: 'SystemLog' }),
    timestamp(),
    myFormat,
    format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: global.appConfig.appRootPath + '/logs/system-logs.log',
      json: false,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.Console(),
  ]
});


/* const apiLogger = createLogger({
  transports: [
    new transports.File({
      filename: './logs/api-logs.log',
      json: false,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.Console(),
  ]
});

const systemLogger = createLogger({
  transports: [
    new transports.File({
      filename: './logs/system-logs.log',
      json: false,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new transports.Console(),
  ]
}); */


// create a stream object with a 'write' function that will be used by `morgan`
winston.loggers.get('apiLogger').stream = {
  write: function (message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    global.apiLogger.info(message);
  },
};


module.exports = winston.loggers;

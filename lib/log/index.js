const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');

// Configure combined log
var combinedLog = new (transports.DailyRotateFile)({
  dirname: 'logs',
  filename: 'openopps-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Configure error log
var errorLog = new (transports.DailyRotateFile)({
  dirname: 'logs',
  filename: 'openopps-error-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
});

module.exports = (source) => { 
  return createLogger({
    level: 'info',
    format: format.json(),
    defaultMeta: { source: source },
    transports: [
      combinedLog,
      errorLog,
      new transports.Console({ format: format.simple() }),
    ],
    exitOnError: false,
  });
}



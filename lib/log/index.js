const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');

// Configure combined log, error log, and console log
function initializeTransports() {
  return [
    openopps.combinedLog = new (transports.DailyRotateFile)({
      dirname: 'logs',
      filename: 'openopps-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    openopps.errorLog = new (transports.DailyRotateFile)({
      dirname: 'logs',
      filename: 'openopps-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new transports.Console({ format: format.simple() }),
  ]
}

module.exports = (source) => {
  openopps.transports = openopps.transports || initializeTransports();
  openopps.logger = openopps.logger || createLogger({
    level: 'info',
    format: format.json(),
    transports: openopps.transports,
    exitOnError: false,
  });

  return openopps.logger.child({ source: source });
}



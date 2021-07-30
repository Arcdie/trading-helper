const winston = require('winston');

const getLabel = (logModule) => {
  const parts = logModule.filename.split('/');
  return `${parts[parts.length - 2]}/${parts.pop()}`;
};

const logger = (logModule) => {
  return new winston.createLogger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        level: 'debug',
      }),

      new winston.transports.File({
        name: 'error-log',
        filename: './logs/error.log',
        level: 'error',
        label: getLabel(logModule),
      }),

      new winston.transports.File({
        name: 'warn-log',
        filename: './logs/warn.log',
        level: 'warn',
        label: getLabel(logModule),
      }),
    ],
  });
};

module.exports = logger;

import winston, { format } from 'winston';
import { existsSync, unlinkSync } from 'fs';

/**
 * Slight adjustment from default NPM levels (https://github.com/winstonjs/winston#logging-levels)
 * Allow for "success" level
 */
const customLogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  success: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const { timestamp, combine, printf, cli } = format;

/**
 * https://github.com/winstonjs/logform#cli
 */
const cliFormat = cli({
  colors: { info: 'blue', success: 'green', warn: 'yellow' },
  levels: customLogLevels,
});

// Do not log messages to console if they have { noConsole: true }
const noLogPrivateToConsole = format((info) => {
  if (info.noConsole) return false;
  return info;
});

// Do not save log messages to file if they have { noFileSave: true }
const noLogPrivateToFile = format((info) => {
  if (info.noFileSave) return false;
  return info;
});

interface LoggerProps {
  errorLogFileName?: string;
  metaData?: Record<string, unknown>;
  retainExistingLogs?: boolean;
}

type InitialiseLogger = (options?: LoggerProps) => void;

const defaultErrorLogFileName = 'errors.log';
const stringLineBreakRegex = /(\r\n|\n|\r)/gm;

/**
 * Initialise Winston logger (https://github.com/winstonjs/winston#winston) with following opinionated config:
 *
 * - Custom log levels to include new success in lieu of http
 * - errors saved to local file
 * - option to remove (error) log from console output if desired.
 */
const initialiseLogger: InitialiseLogger = (options) => {
  // if there is a custom error log file, delete it, to ensure only new errors are saved.
  const errorLogFilePath = `${process.cwd()}/${options?.errorLogFileName}`;
  if (
    options?.errorLogFileName &&
    !options?.retainExistingLogs &&
    existsSync(errorLogFilePath)
  ) {
    unlinkSync(errorLogFilePath);
  }

  // initialise logger and save to global object
  global.logger = winston.createLogger({
    levels: customLogLevels,
    level: 'success',
    defaultMeta: options?.metaData,
    transports: [
      new winston.transports.Console({
        format: combine(noLogPrivateToConsole(), cliFormat),
      }),
      //
      // - Write all logs with level `error` to `errorLogFileName` prop or fallback
      //
      new winston.transports.File({
        filename: options?.errorLogFileName ?? defaultErrorLogFileName,
        level: 'error',
        format: combine(
          noLogPrivateToFile(),
          timestamp({
            format: 'DD-MM-YYYY HH:mm:ss',
          }),
          printf(
            (info) =>
              `${info.timestamp} ${info.level}: ${info.message.replace(
                stringLineBreakRegex,
                '',
              )}`,
          ),
        ),
      }),
    ],
  });
};

export default initialiseLogger;

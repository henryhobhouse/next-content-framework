import { createReadStream } from 'fs';
import { currentWorkingDirectory } from '../../constants';

/**
 * Assumes each line in error log is single error. Counts lines and outputs
 * to console number of errors and prompts user to check error log file.
 */
const checkForErrors = (errorLogFileName: string) => {
  let fileLineCount = 0;

  // create read stream and count every tenth chunk to determine number of lines, and
  // by extension errors
  createReadStream(`${currentWorkingDirectory}/${errorLogFileName}`)
    .on('data', (chunk) => {
      for (let i = 0; i < chunk.length; i += 1) {
        // accounts for first line
        if (i === 0 && chunk.length) fileLineCount += 1;
        // accounts for second and beyond lines
        if (chunk[i] === 10) fileLineCount += 1;
      }
    })
    .on('end', () => {
      if (fileLineCount > 0) {
        logger.log({
          level: 'error',
          noFileSave: true,
          message: `There were ${fileLineCount} errors optimising images. Please check ${errorLogFileName} as some images are likely not to show correctly in the app`,
        });
      }
    });
};

export default checkForErrors;

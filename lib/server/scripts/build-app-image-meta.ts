import cliProgress from 'cli-progress';
import colors from 'colors';

import { contentRootPath } from '../../next-static-server/mdx-parse';
import initialiseLogger from '../logger';

import checkForDeletedImages from './image-manipulation/check-for-deleted-images';
import checkForErrors from './image-manipulation/check-for-errors';
import createThumbnailsAndSaveAttributes from './image-manipulation/create-thumbnails-and-save-attributes';
import getImagesToProcess from './image-manipulation/get-images-to-process';

const errorLogFileName = 'image-optimisation-error.log';

const imagesSuccessfullyProcessed: string[] = [];

// configure the progress bar
// eslint-disable-next-line import/prefer-default-export
export const progressBar = new cliProgress.SingleBar({
  format: `|${colors.magenta(
    '{bar}',
  )}| {percentage}% || {value}/{total} Images available to be processed || ETA: {eta}s`,
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 300,
});

(async () => {
  try {
    await initialiseLogger({
      errorLogFileName,
      retainExistingLogs: true,
      metaData: { script: 'image-optimisation' },
    });

    logger.info('Creating metadata and thumbnails of newly added images...');

    // Gets images details from content directory that haven't being optimised yet.
    const {
      imagesPathsToProcess,
      totalImagesToProcess,
      allNonModifiedImages,
    } = await getImagesToProcess({
      directoryPath: contentRootPath,
    });

    // As optimised images are essentially cached we need to sync both additions and removals.
    await checkForDeletedImages(allNonModifiedImages);

    if (totalImagesToProcess === 0) {
      logger.info('No new images to process.');
      return;
    }

    logger.info(`${imagesPathsToProcess.length} total unprocessed images`);

    // Start progress bar
    progressBar.start(totalImagesToProcess, 0, {
      speed: 'N/A',
    });

    // Start optimising all images found
    await createThumbnailsAndSaveAttributes(
      imagesPathsToProcess,
      imagesSuccessfullyProcessed,
      progressBar,
    );

    // Stop progress bar updates
    progressBar.stop();

    if (imagesSuccessfullyProcessed.length > 0) {
      logger.log(
        'success',
        `${imagesSuccessfullyProcessed.length} thumbnails and image meta saved from permitted image types.`,
      );
    }

    // Looks at error log file and counts number of errors to so user can be informed to check it
    checkForErrors(errorLogFileName);
  } catch (error) {
    progressBar.stop();
    logger.error(`ERROR: Image processing failed. ${error.message}`);
  }
})();

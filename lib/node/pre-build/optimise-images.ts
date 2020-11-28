import cliProgress from 'cli-progress';
import colors from 'colors';
import { createReadStream } from 'fs';

import getImagesToOptimise from './image-optimisation/get-images-to-optimise';
import initialiseLogger from '../logger';
import { lazyLoadImageSize } from '../../page-mdx/mdx-parse';
import resizeAndOptimiseImages from './image-optimisation/resize-and-optimise-images';
import checkForDeletedImages from './image-optimisation/check-for-deleted-images';

const documentFilesBasePath = `${process.cwd()}/content/`;
const errorLogFileName = 'image-optimisation-error.log';

const imageSizes: number[] = []; // Add to this if we need more options
export const staticImageSizes = [...imageSizes, lazyLoadImageSize];
const imagesSuccessfullyOptimised: string[] = [];
// eslint-disable-next-line import/prefer-default-export
export const progressBar = new cliProgress.SingleBar({
  format: `|${colors.magenta(
    '{bar}',
  )}| {percentage}% || {value}/{total} Images to be optimised || ETA: {eta}s`,
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 300,
});

/**
 * Assumes each line in error log is single error. Counts lines and outputs
 * to console number of errors and prompts user to check error log file.
 */
const checkForErrors = () => {
  let fileLinecount = 0;

  // create read stream and count every tenth chunk to determine number of lines, and
  // by extension errors
  createReadStream(`${process.cwd()}/${errorLogFileName}`)
    .on('data', (chunk) => {
      for (let i = 0; i < chunk.length; i += 1)
        if (chunk[i] === 10) fileLinecount += 1;
    })
    .on('end', () => {
      if (fileLinecount > 0) {
        logger.log({
          level: 'error',
          noFileSave: true,
          message: `There were ${
            fileLinecount + 1
          } errors optimising images. Please check ${errorLogFileName} as some images are likely not to show correctly in the app`,
        });
      }
    });
};

(async () => {
  try {
    await initialiseLogger({
      errorLogFileName,
      metaData: { script: 'image-optimisation' },
    });

    logger.info('Optimising newly added images...');

    const {
      imagesPathsToOptimise,
      totalImagesToOptimise,
      allOptimisedImageNames,
    } = await getImagesToOptimise({
      directoryPath: documentFilesBasePath,
      numberOfImageSizes: staticImageSizes.length,
    });

    await checkForDeletedImages(allOptimisedImageNames, staticImageSizes);

    if (imagesPathsToOptimise.length === 0) {
      logger.info('No new images to optimise.');
      return;
    }

    logger.info(`${imagesPathsToOptimise.length} total images`);

    progressBar.start(totalImagesToOptimise, 0, {
      speed: 'N/A',
    });

    // TODO: add functionality to check if placeholder has being removed (from reference files) and delete all assocaited
    // images accordingly.
    await resizeAndOptimiseImages(
      imagesPathsToOptimise,
      imagesSuccessfullyOptimised,
      imageSizes,
      staticImageSizes,
      progressBar,
    );

    progressBar.stop();
    if (imagesSuccessfullyOptimised.length > 0) {
      logger.log(
        'success',
        `${imagesSuccessfullyOptimised.length} images successively optimised.`,
      );
    }

    checkForErrors();
  } catch (error) {
    progressBar.stop();
    logger.error(`ERROR: Image optimisation failed. ${error.message}`);
  }
})();

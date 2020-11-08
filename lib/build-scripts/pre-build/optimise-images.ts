import cliProgress from 'cli-progress';
import colors from 'colors';
import winston, { format } from 'winston';

import getImagesToOptimise from './image-optimisation/get-images-to-optimise';
import {
  articleImageSize,
  referenceImageSize,
  lazyLoadImageSize,
} from '../../mdx/mdx-parse';
import { removeOriginals } from './image-optimisation/utils';
import resizeAndOptimiseImages from './image-optimisation/resize-and-optimise-images';

const documentFilesBasePath = `${process.cwd()}/content/`;

const LEVEL = Symbol.for('level');
const cliFormat = format.cli({ colors: { info: 'blue', notice: 'green' } });

cliFormat.transform(
  {
    [LEVEL]: 'info',
    level: 'info',
    message: 'my message',
  },
  { all: true },
);

global.logger = winston.createLogger({
  level: 'info',
  format: cliFormat,
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
      consoleWarnLevels: ['info', 'notice', 'warning', 'crit'],
    }),
    //
    // - Write all logs with level `error` to `image-optimisation-error.log`
    //
    new winston.transports.File({
      filename: 'image-optimisation-error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
});

const imageSizes = [referenceImageSize, articleImageSize]; // Add to this if we need more options
const staticImageSizes = [...imageSizes, lazyLoadImageSize];
const imagesSuccessfullyOptimised: string[] = [];
// eslint-disable-next-line import/prefer-default-export
export const progressBar = new cliProgress.SingleBar({
  format: `|${colors.magenta(
    '{bar}',
  )}| {percentage}% || {value}/{total} Image variants || ETA: {eta}s`,
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 300,
});

(async () => {
  try {
    logger.info('Optimising newly added images...');

    const {
      imagesPathsToOptimise,
      totalImagesToOptimise,
    } = await getImagesToOptimise(documentFilesBasePath);

    logger.info(`${imagesPathsToOptimise.length} total images to optimise`);
    progressBar.start(totalImagesToOptimise, 0, {
      speed: 'N/A',
    });

    // TODO: refactor error handling to output to log file rathern than console. (remove spinner errors as well)
    // TOOD: feat push images sizes to config object to be used at build time to add size meta data to html
    // TODO: tweak image quality/compression levels to bring inline with Gatsby Images (currently over compressed slighlty)
    // TODO: add functionality to check if placeholder has being removed (from reference files) and delete all assocaited
    // images accordingly.

    await resizeAndOptimiseImages(
      imagesPathsToOptimise,
      imagesSuccessfullyOptimised,
      imageSizes,
      staticImageSizes,
      progressBar,
    );

    await removeOriginals(imagesSuccessfullyOptimised);

    progressBar.stop();
    logger.notice(
      `${imagesSuccessfullyOptimised.length} images successively optimised.`,
    );
  } catch (error) {
    progressBar.stop();
    logger.crit(`ERROR: Image optimisation failed. ${error.message}`);
  }
})();

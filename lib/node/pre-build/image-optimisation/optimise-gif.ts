import imageminGifsicle from 'imagemin-gifsicle';
import gifResize from '@gumlet/gif-resize';
import { promises } from 'fs';
import { SingleBar } from 'cli-progress';

import { writeOptimisedImage } from './write-to-system';
import { ImageConfig } from '../../types/image-optimisation';

/**
 * Resize and optimised GIF images
 */
const optimiseGif = async (
  imageConfig: ImageConfig,
  imageSizes: number[],
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
  await Promise.allSettled(
    imageSizes.map(async (width) => {
      try {
        const gifDataBuffer = await promises.readFile(imageConfig.filePath);

        // resize image
        const resizedOptimisedGif = await gifResize({
          width,
        })(gifDataBuffer);

        try {
          // optimize image
          const optimisedGif = await imageminGifsicle({
            interlaced: true,
            optimizationLevel: 3,
          })(resizedOptimisedGif);
          writeOptimisedImage(
            imageConfig,
            optimisedGif,
            imagesSuccessfullyOptimised,
            progressBar,
            width,
          );
        } catch (err) {
          // error optimising the resized gif. Used resized image instead and inform logger.
          logger.log({
            level: 'error',
            noConsole: true,
            message: `Cannot optimise GIF ${imageConfig.filePath.replace(
              process.cwd(),
              '',
            )}, will use resized image only. ${err.message}`,
          });
          writeOptimisedImage(
            imageConfig,
            resizedOptimisedGif,
            imagesSuccessfullyOptimised,
            progressBar,
            width,
          );
        }
      } catch (err) {
        // error with initial resizing of the image. Escalate the error and inform logger.
        logger.log({
          level: 'error',
          noConsole: true,
          message: `Error resizing gif ${imageConfig.filePath.replace(
            process.cwd(),
            '',
          )}. Please check it. ${err.message}`,
        });
        throw new Error(err);
      }
    }),
  );
};

export default optimiseGif;

import { SingleBar } from 'cli-progress';
import sharp from 'sharp';
import pLimit from 'p-limit';
import getHashAndUpdateCache from './get-hash-and-update-cache';
import { checkImageDirectories } from './utils';
import { ImageMeta } from '../../types/image-processing';
import writeFromPipeline from './write-to-system';
import imageProcessingConfig from './image-processing-config';

// limit the number of images processed at any one time to avoid excessive memory consumption
// https://eng.lifion.com/promise-allpocalypse-cfb6741298a7
// Memory usage without is ~2.75Gb. This reduces down to ~1.2Gb at small cost to speed. Need to ensure
// we don't cause problems with running out of memory in the pipeline docker container
const promiseLimit = pLimit(500);

/**
 * Create thumbnails and saves image attributes for all PNG images (We can extend to include JPEG
 * not currently used)
 */
const createThumbnailsAndSaveAttributes = async (
  imagesPathsToProcess: ImageMeta[],
  imagesSuccessfullyProcessed: string[],
  progressBar: SingleBar,
) => {
  checkImageDirectories();
  const { thumbnailImageWidth } = imageProcessingConfig;
  await Promise.all(
    imagesPathsToProcess.map((imageMeta) =>
      promiseLimit(async () => {
        try {
          // initialise sharp with image
          const pipeline = sharp(imageMeta.filePath);
          // get image size metadata and save to file system for use in build. Used to prevent layout shift.
          const imageMetaData = await pipeline.metadata();

          const imageHash = await getHashAndUpdateCache(
            imageMetaData,
            imageMeta,
          );

          if (
            imageProcessingConfig.allowedFormatForThumbnails.includes(
              imageMeta.fileType,
            )
          ) {
            // resizes and converts image to PNG for consistency
            await pipeline.resize({ width: thumbnailImageWidth }).png({
              compressionLevel: 9,
              quality: 5,
              force: true,
            });

            await writeFromPipeline(
              imageMeta,
              pipeline,
              imagesSuccessfullyProcessed,
              progressBar,
              thumbnailImageWidth,
              imageHash,
            );
          }
        } catch (error) {
          logger.log({
            level: 'error',
            noConsole: true,
            message: `As ${imageMeta.fileType} ${imageMeta.filePath} cannot be resized. Please check if corrupted: ${error.message}`,
          });
        }
      }),
    ),
  );
};

export default createThumbnailsAndSaveAttributes;

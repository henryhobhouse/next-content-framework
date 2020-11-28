import { SingleBar } from 'cli-progress';
import { writeFileSync } from 'fs';
import { Sharp } from 'sharp';
import { ImageMeta } from '../../types/image-optimisation';
import { getWriteFilePath, logSuccess } from '../../utils';

/**
 * Write optimised image data to a file in the system
 */
export const writeOptimisedImage = async (
  imageMeta: ImageMeta,
  optimisedImage: Buffer,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
  width?: number,
) => {
  const relativeWritePath = getWriteFilePath(imageMeta, width);

  try {
    // Done syncronously as async can cause memory heap errors at scale
    writeFileSync(
      `${process.cwd()}/${relativeWritePath}-${imageMeta.name.toLowerCase()}`,
      optimisedImage,
    );

    logSuccess(imageMeta.filePath, imagesSuccessfullyOptimised, progressBar);
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Unable to write optimised image with "writeOptimisedImage" for ${imageMeta.fileType} ${imageMeta.filePath} because of ${err.message}`,
      noConsole: true,
    });
  }
};

/**
 * Write to file system using sharps image pipeline (async)
 */
export const writeFromPipeline = async (
  imageMeta: ImageMeta,
  clonedPipeline: Sharp,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
  width: number,
) => {
  try {
    const relativeWritePath = getWriteFilePath(imageMeta, width);
    await clonedPipeline.toFile(
      `./${relativeWritePath}-${imageMeta.name.toLowerCase()}`,
    );
    logSuccess(imageMeta.filePath, imagesSuccessfullyOptimised, progressBar);
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Unable to write from pipeline with writeFromPipeline for ${imageMeta.fileType} ${imageMeta.filePath} because of ${err.message}`,
      noConsole: true,
    });
  }
};

import { SingleBar } from 'cli-progress';
import { writeFileSync } from 'fs';
import { Sharp } from 'sharp';

import { ImageConfig } from './get-images-to-optimise';
import { getWriteFilePath, logSuccess } from './utils';

/**
 * Write optimised image data to a file in the system
 */
export const writeOptimisedImage = async (
  imageConfig: ImageConfig,
  optimisedImage: Buffer,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
  width?: number,
) => {
  const relativeWritePath = getWriteFilePath(imageConfig, width);

  try {
    // Done syncronously as async can cause memory heap errors at scale
    writeFileSync(
      `${process.cwd()}/${relativeWritePath}-${imageConfig.name.toLowerCase()}`,
      optimisedImage,
    );

    logSuccess(imageConfig.filePath, imagesSuccessfullyOptimised, progressBar);
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Unable to write optimised image with "writeOptimisedImage" for ${imageConfig.fileType} ${imageConfig.filePath} because of ${err.message}`,
      noConsole: true,
    });
  }
};

/**
 * Write to file system using sharps image pipeline (async)
 */
export const writeFromPipeline = async (
  imageConfig: ImageConfig,
  clonedPipeline: Sharp,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
  width: number,
) => {
  try {
    const relativeWritePath = getWriteFilePath(imageConfig, width);
    await clonedPipeline.toFile(
      `./${relativeWritePath}-${imageConfig.name.toLowerCase()}`,
    );
    logSuccess(imageConfig.filePath, imagesSuccessfullyOptimised, progressBar);
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Unable to write from pipeline with writeFromPipeline for ${imageConfig.fileType} ${imageConfig.filePath} because of ${err.message}`,
      noConsole: true,
    });
  }
};

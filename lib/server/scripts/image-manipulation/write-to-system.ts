import { SingleBar } from 'cli-progress';
import { Sharp } from 'sharp';
import { ImageMeta } from '../../types/image-processing';
import { getWriteFilePath, logSuccess } from './utils';

/**
 * Write to file system using sharps image pipeline (async)
 */
const writeFromPipeline = async (
  imageMeta: ImageMeta,
  pipeline: Sharp,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
  width: number,
  imageHash: string,
) => {
  try {
    const writePath = getWriteFilePath(imageMeta, width, imageHash);

    await pipeline.toFile(writePath);

    progressBar.increment();

    // Logs success
    logSuccess(imageMeta.filePath, imagesSuccessfullyOptimised);
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Unable to write from pipeline with writeFromPipeline for ${imageMeta.fileType} ${imageMeta.filePath} because of ${err.message}`,
      noConsole: true,
    });
  }
};

export default writeFromPipeline;

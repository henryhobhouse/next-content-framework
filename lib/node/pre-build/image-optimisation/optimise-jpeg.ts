import { SingleBar } from 'cli-progress';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import { Sharp } from 'sharp';
import { ImageConfig } from '../../types/image-optimisation';
import { writeOptimisedImage, writeFromPipeline } from './write-to-system';

/**
 * Optimised already resized JPEG images
 */
const optimiseJpeg = async (
  imageConfig: ImageConfig,
  pipeline: Sharp,
  width: number,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
  try {
    const unoptimisedImage = await pipeline.toBuffer();

    const optimisedJpeg = await imagemin.buffer(unoptimisedImage, {
      plugins: [
        imageminMozjpeg({
          quality: 80,
        }),
      ],
    });

    writeOptimisedImage(
      imageConfig,
      optimisedJpeg,
      imagesSuccessfullyOptimised,
      progressBar,
      width,
    );
  } catch (err) {
    logger.log({
      level: 'error',
      noConsole: true,
      message: `Cannot optimise JPEG ${imageConfig.filePath.replace(
        process.cwd(),
        '',
      )}, will use resized image only. ${err.message}`,
    });
    writeFromPipeline(
      imageConfig,
      pipeline,
      imagesSuccessfullyOptimised,
      progressBar,
      width,
    );
  }
};

export default optimiseJpeg;

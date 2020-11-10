import { SingleBar } from 'cli-progress';
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
import { Sharp } from 'sharp';

import { ImageConfig } from './get-images-to-optimise';
import { writeOptimisedImage, writeFromPipeline } from './write-to-system';

/**
 * Optimised already resized GIF images
 */
const optimisePng = async (
  imageConfig: ImageConfig,
  pipeline: Sharp,
  width: number,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
  try {
    const unoptimisedImage = await pipeline.toBuffer();

    const optimisedPng = await imagemin.buffer(unoptimisedImage, {
      plugins: [
        imageminPngquant({
          quality: [0.5, 0.75],
          speed: 4,
          strip: true,
        }),
      ],
    });

    writeOptimisedImage(
      imageConfig,
      optimisedPng,
      imagesSuccessfullyOptimised,
      progressBar,
      width,
    );
  } catch (err) {
    logger.log({
      level: 'error',
      noConsole: true,
      message: `Cannot optimise PNG ${imageConfig.filePath.replace(
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

export default optimisePng;

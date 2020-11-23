import { SingleBar } from 'cli-progress';
import { promises } from 'fs';
import imageminSvgo from 'imagemin-svgo';
import { ImageConfig } from '../../types/image-optimisation';
import { writeOptimisedImage } from './write-to-system';

/**
 * Optimised SVG images
 */
const optimiseSvg = async (
  imageConfig: ImageConfig,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
  try {
    const svgDataBuffer = await promises.readFile(imageConfig.filePath);
    const optimisedSvg = await imageminSvgo({})(svgDataBuffer);
    writeOptimisedImage(
      imageConfig,
      optimisedSvg,
      imagesSuccessfullyOptimised,
      progressBar,
    );
  } catch (err) {
    logger.log({
      level: 'error',
      noConsole: true,
      message: `Cannot optimise SVG ${imageConfig.filePath.replace(
        process.cwd(),
        '',
      )}, will use resized image only. ${err.message}`,
    });
  }
};

export default optimiseSvg;

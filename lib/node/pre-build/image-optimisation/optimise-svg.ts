import { SingleBar } from 'cli-progress';
import { promises } from 'fs';
import imageminSvgo from 'imagemin-svgo';
import { ImageMeta } from '../../types/image-optimisation';
import { writeOptimisedImage } from './write-to-system';

/**
 * Optimised SVG images
 */
const optimiseSvg = async (
  imageMeta: ImageMeta,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
  try {
    const svgDataBuffer = await promises.readFile(imageMeta.filePath);
    const optimisedSvg = await imageminSvgo({})(svgDataBuffer);
    writeOptimisedImage(
      imageMeta,
      optimisedSvg,
      imagesSuccessfullyOptimised,
      progressBar,
    );
  } catch (err) {
    logger.log({
      level: 'error',
      noConsole: true,
      message: `Cannot optimise SVG ${imageMeta.filePath.replace(
        process.cwd(),
        '',
      )}, will use resized image only. ${err.message}`,
    });
  }
};

export default optimiseSvg;

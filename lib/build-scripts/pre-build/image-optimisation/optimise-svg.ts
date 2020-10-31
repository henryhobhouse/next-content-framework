import { SingleBar } from 'cli-progress';
import { promises } from 'fs';
import imageminSvgo from 'imagemin-svgo';
import { ImageConfig } from './get-images-to-optimise';
import { writeOptimisedImage } from './write-to-system';

/**
 * Optimised SVG images
 */
const optimiseSvg = async (
  imageConfig: ImageConfig,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
  const svgDataBuffer = await promises.readFile(imageConfig.filePath);
  const optimisedSvg = await imageminSvgo({})(svgDataBuffer);
  writeOptimisedImage(
    imageConfig,
    optimisedSvg,
    imagesSuccessfullyOptimised,
    progressBar,
  );
};

export default optimiseSvg;

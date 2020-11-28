import { SingleBar } from 'cli-progress';
import { promises } from 'fs';
import sharp from 'sharp';
import optimiseGif from './optimise-gif';
import optimiseJpeg from './optimise-jpeg';
import optimisePng from './optimise-png';
import optimiseSvg from './optimise-svg';
import extractImageSize from './extract-image-size';
import { checkImageDirectories } from '../../utils';
import { writeOptimisedImage, writeFromPipeline } from './write-to-system';
import { ImageMeta, imageFileType } from '../../types/image-optimisation';

/**
 * Resize, optimise and extract size metadata for PNG, JPEG, SVG and GIF images
 */
const resizeAndOptimiseImages = async (
  imagesPathsToOptimise: ImageMeta[],
  imagesSuccessfullyOptimised: string[],
  imageSizes: number[],
  staticImageSizes: number[],
  progressBar: SingleBar,
) => {
  checkImageDirectories();
  await Promise.allSettled(
    imagesPathsToOptimise.map(async (imageMeta) => {
      // initialise sharp with image
      const pipeline = sharp(imageMeta.filePath);

      // get image size metadata and save to file system for use in build
      pipeline
        .metadata()
        .then((metaData) => extractImageSize(metaData, imageMeta))
        .catch((error) =>
          logger.log({
            level: 'error',
            noConsole: true,
            message: `Could not get image metadata: ${error.message}`,
          }),
        );

      if (imageMeta.fileType === imageFileType.gif) {
        await optimiseGif(
          imageMeta,
          imageSizes,
          imagesSuccessfullyOptimised,
          progressBar,
        );
        return;
      }

      if (imageMeta.fileType === imageFileType.svg) {
        await optimiseSvg(imageMeta, imagesSuccessfullyOptimised, progressBar);
        return;
      }

      // handle all static images
      await Promise.allSettled(
        staticImageSizes.map(async (width) => {
          const clonedPipeline = pipeline.clone();
          clonedPipeline.resize({ width }).png({
            compressionLevel: 9,
            force: imageMeta.fileType === imageFileType.png,
          });

          if (imageMeta.fileType === imageFileType.png) {
            try {
              await optimisePng(
                imageMeta,
                clonedPipeline,
                width,
                imagesSuccessfullyOptimised,
                progressBar,
              );
            } catch {
              logger.log({
                level: 'error',
                noConsole: true,
                message: `As ${imageMeta.fileType} ${imageMeta.filePath} cannot be optimised and/or resized. We will use the orginal instead. PLEASE check if original works to avoid issues in the app`,
              });
              const originalFile = await promises.readFile(imageMeta.filePath);
              await writeOptimisedImage(
                imageMeta,
                originalFile,
                imagesSuccessfullyOptimised,
                progressBar,
                width,
              );
            }
            return;
          }

          if (imageMeta.fileType === imageFileType.jpeg) {
            try {
              await optimiseJpeg(
                imageMeta,
                clonedPipeline,
                width,
                imagesSuccessfullyOptimised,
                progressBar,
              );
            } catch {
              logger.log({
                level: 'error',
                noConsole: true,
                message: `As ${imageMeta.fileType} ${imageMeta.filePath} cannot be optimised and/or resized. We will use the orginal instead. PLEASE check if original works to avoid issues in the app`,
              });
              const originalFile = await promises.readFile(imageMeta.filePath);
              await writeOptimisedImage(
                imageMeta,
                originalFile,
                imagesSuccessfullyOptimised,
                progressBar,
                width,
              );
            }
            return;
          }

          await writeFromPipeline(
            imageMeta,
            clonedPipeline,
            imagesSuccessfullyOptimised,
            progressBar,
            width,
          );
        }),
      );
    }),
  );
};

export default resizeAndOptimiseImages;

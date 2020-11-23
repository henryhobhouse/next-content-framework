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
import { ImageConfig, imageFileType } from '../../types/image-optimisation';

/**
 * Resize, optimise and extract size metadata for PNG, JPEG, SVG and GIF images
 */
const resizeAndOptimiseImages = async (
  imagesPathsToOptimise: ImageConfig[],
  imagesSuccessfullyOptimised: string[],
  imageSizes: number[],
  staticImageSizes: number[],
  progressBar: SingleBar,
) => {
  checkImageDirectories();
  await Promise.allSettled(
    imagesPathsToOptimise.map(async (imageConfig) => {
      // initialise sharp with image
      const pipeline = sharp(imageConfig.filePath);

      // get image size metadata and save to file system for use in build
      pipeline
        .metadata()
        .then((metaData) => extractImageSize(metaData, imageConfig))
        .catch((error) =>
          logger.log({
            level: 'error',
            noConsole: true,
            message: `Could not get image metadata: ${error.message}`,
          }),
        );

      if (imageConfig.fileType === imageFileType.gif) {
        await optimiseGif(
          imageConfig,
          imageSizes,
          imagesSuccessfullyOptimised,
          progressBar,
        );
        return;
      }

      if (imageConfig.fileType === imageFileType.svg) {
        await optimiseSvg(
          imageConfig,
          imagesSuccessfullyOptimised,
          progressBar,
        );
        return;
      }

      // handle all static images
      await Promise.allSettled(
        staticImageSizes.map(async (width) => {
          const clonedPipeline = pipeline.clone();
          clonedPipeline.resize({ width }).png({
            compressionLevel: 9,
            force: imageConfig.fileType === imageFileType.png,
          });

          if (imageConfig.fileType === imageFileType.png) {
            try {
              await optimisePng(
                imageConfig,
                clonedPipeline,
                width,
                imagesSuccessfullyOptimised,
                progressBar,
              );
            } catch {
              logger.log({
                level: 'error',
                noConsole: true,
                message: `As ${imageConfig.fileType} ${imageConfig.filePath} cannot be optimised and/or resized. We will use the orginal instead. PLEASE check if original works to avoid issues in the app`,
              });
              const originalFile = await promises.readFile(
                imageConfig.filePath,
              );
              await writeOptimisedImage(
                imageConfig,
                originalFile,
                imagesSuccessfullyOptimised,
                progressBar,
                width,
              );
            }
            return;
          }

          if (imageConfig.fileType === imageFileType.jpeg) {
            try {
              await optimiseJpeg(
                imageConfig,
                clonedPipeline,
                width,
                imagesSuccessfullyOptimised,
                progressBar,
              );
            } catch {
              logger.log({
                level: 'error',
                noConsole: true,
                message: `As ${imageConfig.fileType} ${imageConfig.filePath} cannot be optimised and/or resized. We will use the orginal instead. PLEASE check if original works to avoid issues in the app`,
              });
              const originalFile = await promises.readFile(
                imageConfig.filePath,
              );
              await writeOptimisedImage(
                imageConfig,
                originalFile,
                imagesSuccessfullyOptimised,
                progressBar,
                width,
              );
            }
            return;
          }

          await writeFromPipeline(
            imageConfig,
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

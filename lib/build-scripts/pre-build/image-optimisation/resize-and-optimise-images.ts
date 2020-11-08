import { SingleBar } from 'cli-progress';
import { promises } from 'fs';
import sharp from 'sharp';
import { ImageConfig, imageFileType } from './get-images-to-optimise';
import optimiseGif from './optimise-gif';
import optimiseJpeg from './optimise-jpeg';
import optimisePng from './optimise-png';
import optimiseSvg from './optimise-svg';
import { checkImageDirectories } from './utils';
import { writeOptimisedImage, writeFromPipeline } from './write-to-system';

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
  await Promise.all(
    imagesPathsToOptimise.map(async (imageConfig) => {
      const pipeline = sharp(imageConfig.filePath);
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
      await Promise.all(
        staticImageSizes.map(async (width) => {
          const clonedPipeline = pipeline.clone();
          clonedPipeline
            .resize({ width })
            .png({
              compressionLevel: 9,
              force: imageConfig.fileType === imageFileType.png,
            })
            .webp({
              quality: 80,
              force: imageConfig.fileType === imageFileType.webp,
            });

          // if (size === lazyLoadedPlaceholderWidth) {
          //   const imagePathDirectories = imageConfig.filePath.split('/');
          //   const parentDirectoryName = imagePathDirectories[
          //     imagePathDirectories.length - 2
          //   ]
          //     .replace(orderPartRegex, '')
          //     .toLowerCase();
          //   const { width, height } = await pipeline.metadata();
          //   const blankImage = await sharp({
          //     create: {
          //       width,
          //       height,
          //       channels: 3,
          //       background: { r: 255, g: 255, b: 255, alpha: 0 },
          //     },
          //   })
          //     .jpeg({
          //       quality: 1,
          //     })
          //     .toBuffer();
          //   writeFileSync(
          //     `${process.cwd()}/${optimisedImageDirectory}/sizeRef/${parentDirectoryName}-${imageConfig.name.toLowerCase()}`,
          //     blankImage,
          //   );
          // }

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
              logger.error(
                `As ${imageConfig.fileType} ${imageConfig.filePath} cannot be optimised and/or resized. We will use the orginal instead. PLEASE check if original works to avoid issues in the app`,
              );
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
              logger.error(
                `As ${imageConfig.fileType} ${imageConfig.filePath} cannot be optimised and/or resized. We will use the orginal instead. PLEASE check if original works to avoid issues in the app`,
              );
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

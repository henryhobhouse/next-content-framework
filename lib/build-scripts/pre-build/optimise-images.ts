import { promises, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import gifResize from '@gumlet/gif-resize';
import cliProgress from 'cli-progress';
import colors from 'colors';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import mkdirp from 'mkdirp';
import ora from 'ora';
import sharp, { Sharp } from 'sharp';

const imageFileType = {
  svg: 'svg',
  jpeg: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
} as const;

type ImageFileType = keyof typeof imageFileType;

interface ImageConfig {
  filePath: string;
  name: string;
  fileType: keyof typeof imageFileType;
}

const documentFilesBasePath = `${process.cwd()}/content/`;
const imageFilesPostfixes = /(gif|png|svg|jpe?g)$/i;
const imageFileTypeRegex = /(?<=\.)(gif|png|svg|jpe?g)$/i;
const optimisedImageDirectory = 'images';
const staticImageDirectory = 'public';
const originalFileDirectory = 'originals';
const svgFileDirectory = 'svg';
const orderPartRegex = /^([0-9+]+)\./i;
const lazyLoadedPlaceholderWidth = 20; // pixels
// DO NOT CHANGE THIS WITHOUT UPDATING THE SAME VALUE IN MDX PARSE VARIABLES
const referenceImageSize = 1200;
// DO NOT CHANGE THIS WITHOUT UPDATE THE SAME VALUE IN THE OPTIMISED IMAGE COMPONENT
const articleImageSize = 600;
const imageSizes = [referenceImageSize, articleImageSize]; // Add to this if we need more options
const staticImageSizes = [...imageSizes, lazyLoadedPlaceholderWidth];
const spinner = ora();
const imagesPathsToOptimise: ImageConfig[] = [];
const imagesSuccessfullyOptimised: string[] = [];
let totalImagesToOptimise = 0;
const progressBar = new cliProgress.SingleBar({
  format: `|${colors.magenta(
    '{bar}',
  )}| {percentage}% || {value}/{total} Image variants || ETA: {eta}s`,
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 300,
});

/**
 * Recurrisively iterate through all content directories and add any accepted image files
 * to a list.
 */
const getImagesToOptimise = async (directoryPath: string) => {
  const dirents = await promises.readdir(directoryPath, {
    withFileTypes: true,
  });
  const imageDirents = dirents.filter((dirent) =>
    dirent.name.match(imageFilesPostfixes),
  );
  if (imageDirents.length)
    await Promise.all(
      imageDirents.map(async (imageDirent) => {
        const imageFileLocation = resolve(directoryPath, imageDirent.name);
        const rawFileTypeArray = imageDirent.name.match(imageFileTypeRegex);
        const rawFileType = Array.isArray(rawFileTypeArray)
          ? rawFileTypeArray[0]
          : '';
        const fileType =
          rawFileType === 'jpg' ? imageFileType.jpeg : rawFileType;
        if (fileType === imageFileType.svg) totalImagesToOptimise += 1;
        else if (fileType === imageFileType.gif) totalImagesToOptimise += 2;
        else if (fileType) totalImagesToOptimise += 3;

        if (fileType) {
          const imageConfig = {
            filePath: imageFileLocation,
            name: imageDirent.name,
            fileType: fileType as ImageFileType,
          };
          imagesPathsToOptimise.push(imageConfig);
        }
      }),
    );

  await Promise.all(
    dirents.map(async (dirent) => {
      const res = resolve(directoryPath, dirent.name);
      const isDirectory = dirent.isDirectory();
      if (isDirectory) await getImagesToOptimise(res);
    }),
  );
};

/**
 * Update progress bar and update list of successfully optimised images.
 */
const logSuccess = (imagePath: string) => {
  // add image, if not already done, to the list of successfully optimised images
  if (!imagesSuccessfullyOptimised.includes(imagePath))
    imagesSuccessfullyOptimised.push(imagePath);

  progressBar.increment();
};

/**
 * First reference image is optimising the origial so needs to be added to the
 * images directory along with svgs and small size variants for lazy loading.
 * The rest go into the public folder to be delivered statically.
 */
const getWriteFilePath = (imageConfig: ImageConfig, size?: number) => {
  const imagePathDirectories = imageConfig.filePath.split('/');
  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ]
    .replace(orderPartRegex, '')
    .toLowerCase();
  let writePath;
  if (size === referenceImageSize)
    writePath = `${optimisedImageDirectory}/${originalFileDirectory}/${parentDirectoryName}`;
  else if (size === lazyLoadedPlaceholderWidth)
    writePath = `${optimisedImageDirectory}/${size}/${parentDirectoryName}`;
  else if (imageConfig.fileType === 'svg')
    writePath = `${optimisedImageDirectory}/${svgFileDirectory}/${parentDirectoryName}`;
  else writePath = `${staticImageDirectory}/${size}/${parentDirectoryName}`;

  return writePath;
};

/**
 * Write optimised image data to a file in the system
 */
const writeOptimisedImage = (
  imageConfig: ImageConfig,
  optimisedImage: Buffer,
  size?: number,
) => {
  const relateiveWritePath = getWriteFilePath(imageConfig, size);
  try {
    // Done syncronously as async can cause memory heap errors at scale
    writeFileSync(
      `${process.cwd()}/${relateiveWritePath}-${imageConfig.name.toLowerCase()}`,
      optimisedImage,
    );

    logSuccess(imageConfig.filePath);
  } catch (err) {
    spinner.warn(
      `Fail at write to system with ${imageConfig.name} at ${size} with ${err.message}`,
    );
    throw new Error(err.message);
  }
};

/**
 * Resize and optimised GIF images
 */
const optimiseGif = async (imageConfig: ImageConfig) => {
  await Promise.all(
    imageSizes.map(async (size) => {
      try {
        const gifDataBuffer = await promises.readFile(imageConfig.filePath);

        // resize image
        const resizedOptimisedGif = await gifResize({
          width: size,
        })(gifDataBuffer);
        try {
          // optimize image
          const optimisedGif = await imageminGifsicle({
            interlaced: true,
            optimizationLevel: 3,
          })(resizedOptimisedGif);
          writeOptimisedImage(imageConfig, optimisedGif, size);
        } catch (err) {
          // error optimising the resized gif. Used resized image instead and inform console.
          spinner.warn(
            `Error optimising ${imageConfig.filePath.replace(
              process.cwd(),
              '',
            )}, will use resized image only. ${err.message}`,
          );
          writeOptimisedImage(imageConfig, resizedOptimisedGif, size);
        }
      } catch (err) {
        // error with initial resizing of the image. Escalate the error and inform console.
        spinner.info(
          `Error resizing gif ${imageConfig.filePath.replace(
            process.cwd(),
            '',
          )}. Please check it. ${err.message}`,
        );
        throw new Error(err);
      }
    }),
  );
};

/**
 * Write to file system using sharps image pipeline (async)
 */
const writeFromPipeline = async (
  imageConfig: ImageConfig,
  clonedPipeline: Sharp,
  size: number,
) => {
  try {
    const relateiveWritePath = getWriteFilePath(imageConfig, size);
    await clonedPipeline.toFile(
      `./${relateiveWritePath}-${imageConfig.name.toLowerCase()}`,
    );
    logSuccess(imageConfig.filePath);
  } catch (err) {
    spinner.warn(`Error processing image pipeline ${err.message}`);
    throw new Error(err.message);
  }
};

/**
 * Optimised already resized GIF images
 */
const optimisePng = async (
  imageConfig: ImageConfig,
  pipeline: Sharp,
  size: number,
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

    writeOptimisedImage(imageConfig, optimisedPng, size);
  } catch (err) {
    spinner.warn(
      `Error optimising ${imageConfig.filePath.replace(
        process.cwd(),
        '',
      )}, will use resized image only. ${err.message}`,
    );
    writeFromPipeline(imageConfig, pipeline, size);
  }
};

/**
 * Optimised already resized JPEG images
 */
const optimiseJpeg = async (
  imageConfig: ImageConfig,
  pipeline: Sharp,
  size: number,
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

    writeOptimisedImage(imageConfig, optimisedJpeg, size);
  } catch (err) {
    spinner.warn(
      `Error optimising ${imageConfig.filePath.replace(
        process.cwd(),
        '',
      )}, will use resized image only. ${err.message}`,
    );
    writeFromPipeline(imageConfig, pipeline, size);
  }
};

/**
 * Optimised SVG images
 */
const optimiseSvg = async (imageConfig: ImageConfig) => {
  const svgDataBuffer = await promises.readFile(imageConfig.filePath);
  const optimisedSvg = await imageminSvgo({})(svgDataBuffer);
  writeOptimisedImage(imageConfig, optimisedSvg);
};

const checkImageDirectories = () => {
  const dirsToCheck = [
    `${staticImageDirectory}/${articleImageSize}`,
    `${optimisedImageDirectory}/${originalFileDirectory}`,
    `${optimisedImageDirectory}/${svgFileDirectory}`,
    `${optimisedImageDirectory}/${lazyLoadedPlaceholderWidth}`,
  ];
  dirsToCheck.forEach((dir) => {
    const fullDirPath = `${process.cwd()}/${dir}`;
    if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
  });
};

/**
 * Resize, optimise and extract size metadata for PNG, JPEG, SVG and GIF images
 */
const optimiseImages = async () => {
  checkImageDirectories();
  await Promise.all(
    imagesPathsToOptimise.map(async (imageConfig) => {
      const pipeline = sharp(imageConfig.filePath);
      if (imageConfig.fileType === 'gif') {
        await optimiseGif(imageConfig);
        return;
      }
      if (imageConfig.fileType === 'svg') {
        await optimiseSvg(imageConfig);
        return;
      }
      // handle all static images
      await Promise.all(
        staticImageSizes.map(async (size) => {
          const clonedPipeline = pipeline.clone();
          clonedPipeline
            .resize({ width: size })
            .png({
              compressionLevel: 9,
              force: imageConfig.fileType === `png`,
            })
            .webp({
              quality: 80,
              force: imageConfig.fileType === `webp`,
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

          if (imageConfig.fileType === `png`) {
            try {
              await optimisePng(imageConfig, clonedPipeline, size);
            } catch {
              spinner.info(
                'As image cannot be optimised and/or resized. Use the orginal instead. PLEASE check if original works to avoid issues in the app',
              );
              const originalFile = await promises.readFile(
                imageConfig.filePath,
              );
              await writeOptimisedImage(imageConfig, originalFile, size);
            }
            return;
          }

          if (imageConfig.fileType === `jpeg`) {
            try {
              await optimiseJpeg(imageConfig, clonedPipeline, size);
            } catch {
              spinner.info(
                'As image cannot be optimised and/or resized. Use the orginal instead. PLEASE check if original works to avoid issues in the app',
              );
              const originalFile = await promises.readFile(
                imageConfig.filePath,
              );
              await writeOptimisedImage(imageConfig, originalFile, size);
            }
            return;
          }

          await writeFromPipeline(imageConfig, clonedPipeline, size);
        }),
      );
    }),
  );
};

/**
 * Remove originals (in lieu of reference images) and replace with empty
 * placeholders for content writers to know what is available
 */
const removeOriginals = async () => {
  Promise.all(
    imagesSuccessfullyOptimised.map(async (filePath) => {
      await promises.unlink(filePath);
      await promises.writeFile(`${filePath}.optimised`, '');
    }),
  );
};

(async () => {
  try {
    spinner.info('Optimising newly added images...');
    await getImagesToOptimise(documentFilesBasePath);
    spinner.info(`${imagesPathsToOptimise.length} total images to optimise`);
    progressBar.start(totalImagesToOptimise, 0, {
      speed: 'N/A',
    });
    // TODO: refactor error handling to output to log file rathern than console
    // TOOD: feat push images sizes to config object to be used at build time to add size meta data to html
    // TODO: tweak image quality/compression levels to bring inline with Gatsby Images (currently over compressed slighlty)
    await optimiseImages();
    await removeOriginals();
    progressBar.stop();
    spinner.succeed(
      `${imagesSuccessfullyOptimised.length} images successively optimised.`,
    );
  } catch (error) {
    progressBar.stop();
    spinner.fail(`ERROR: Image optimisation failed. ${error.message}`);
  }
})();

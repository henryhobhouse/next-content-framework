const { readdir, readFile, writeFile, unlink } = require('fs').promises;
const { writeFileSync, existsSync } = require('fs');
const { resolve } = require('path');

const gifResize = require('@gumlet/gif-resize');
const cliProgress = require('cli-progress');
const _colors = require('colors');
const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const mkdirp = require('mkdirp');
const ora = require('ora');
const sharp = require('sharp');

const documentFilesBasePath = `${process.cwd()}/content/`;
const imageFilesPostfixes = /(gif|png|svg|jpe?g)$/i;
const imageFileType = /(?<=\.)(gif|png|svg|jpe?g)$/i;
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

const imagesPathsToOptimise = [];
const imagesSuccessfullyOptimised = [];
let totalImagesToOptimise = 0;
const progressBar = new cliProgress.SingleBar({
  format:
    '|' +
    _colors.magenta('{bar}') +
    '| {percentage}% || {value}/{total} Image variants || ETA: {eta}s',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 300,
});

/**
 * Recurrisively iterate through all content directories and add any accepted image files
 * to a list.
 */
const getImagesToOptimise = async (dir) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const imageDirents = dirents.filter((dirent) =>
    dirent.name.match(imageFilesPostfixes),
  );
  if (imageDirents.length) {
    await Promise.all(
      imageDirents.map(async (imageDirent) => {
        const imageFileLocation = resolve(dir, imageDirent.name);
        const rawFileType = imageDirent.name.match(imageFileType)[0];
        const fileType = rawFileType === 'jpg' ? 'jpeg' : rawFileType;
        if (fileType === 'svg') {
          totalImagesToOptimise += 1;
        } else if (fileType === 'gif') {
          totalImagesToOptimise += 2;
        } else {
          totalImagesToOptimise += 3;
        }
        const imageConfig = {
          filePath: imageFileLocation,
          name: imageDirent.name,
          fileType,
        };
        imagesPathsToOptimise.push(imageConfig);
      }),
    );
  }
  await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      const isDirectory = dirent.isDirectory();
      return isDirectory ? getImagesToOptimise(res) : res;
    }),
  );
};

/**
 * Update progress bar and update list of successfully optimised images.
 */
const logSuccess = (imagePath) => {
  // add image, if not already done, to the list of successfully optimised images
  if (!imagesSuccessfullyOptimised.includes(imagePath)) {
    imagesSuccessfullyOptimised.push(imagePath);
  }
  progressBar.increment();
};

/**
 * First reference image is optimising the origial so needs to be added to the
 * images directory along with svgs and small size variants for lazy loading.
 * The rest go into the public folder to be delivered statically.
 */
getWriteFilePath = (size, imageConfig) => {
  const imagePathDirectories = imageConfig.filePath.split('/');
  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ]
    .replace(orderPartRegex, '')
    .toLowerCase();
  let writePath;
  if (size === referenceImageSize) {
    writePath = `${optimisedImageDirectory}/${originalFileDirectory}/${parentDirectoryName}`;
  } else if (size === lazyLoadedPlaceholderWidth) {
    writePath = `${optimisedImageDirectory}/${size}/${parentDirectoryName}`;
  } else if (imageConfig.fileType === 'svg') {
    writePath = `${optimisedImageDirectory}/${svgFileDirectory}/${parentDirectoryName}`;
  } else {
    writePath = `${staticImageDirectory}/${size}/${parentDirectoryName}`;
  }
  return writePath;
};

/**
 * Write to file system
 */
const writeOptimisedImage = (imageConfig, optimisedImage, size) => {
  const relateiveWritePath = getWriteFilePath(size, imageConfig);
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
const optimiseGif = async (imageConfig) => {
  await Promise.all(
    imageSizes.map(async (size) => {
      try {
        const gifDataBuffer = await readFile(imageConfig.filePath);

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
            err,
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
 * Write to file system using sharps image pipeline
 */
const writeFromPipeline = async (imageConfig, clonedPipeline, size) => {
  try {
    const relateiveWritePath = getWriteFilePath(size, imageConfig);
    await clonedPipeline.toFile(
      `./${relateiveWritePath}-${imageConfig.name.toLowerCase()}`,
    );
    logSuccess(imageConfig.filePath);
  } catch (err) {
    spinner.warn(`Error processing image pipeline ${err.message}`);
    throw new Error(err.message);
  }
};

const optimisePng = async (imageConfig, pipeline, size) => {
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
      err,
    );
    writeFromPipeline(imageConfig, pipeline, size);
  }
};

const optimiseJpeg = async (imageConfig, pipeline, size) => {
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
      err,
    );
    writeFromPipeline(imageConfig, pipeline, size);
  }
};

const optimiseSvg = async (imageConfig) => {
  const svgDataBuffer = await readFile(imageConfig.filePath);
  const optimiseSvg = await imageminSvgo({})(svgDataBuffer);
  writeOptimisedImage(imageConfig, optimiseSvg, null);
};

const checkImageDirectories = () => {
  dirsToCheck = [
    `${staticImageDirectory}/${articleImageSize}`,
    `${optimisedImageDirectory}/${originalFileDirectory}`,
    `${optimisedImageDirectory}/${svgFileDirectory}`,
    `${optimisedImageDirectory}/${lazyLoadedPlaceholderWidth}`,
    `${optimisedImageDirectory}/sizeRef`,
  ];
  dirsToCheck.forEach((dir) => {
    const fullDirPath = `${process.cwd()}/${dir}`;
    if (!existsSync(fullDirPath)) {
      mkdirp.sync(fullDirPath);
    }
  });
};

const optimiseImages = async () => {
  checkImageDirectories();
  await Promise.all(
    imagesPathsToOptimise.map(async (imageConfig) => {
      const pipeline = sharp(imageConfig.filePath);
      if (imageConfig.fileType === 'gif') {
        await optimiseGif(imageConfig);
        return;
      } else if (imageConfig.fileType === 'svg') {
        await optimiseSvg(imageConfig);
        return;
      } else {
        // handle all static images
        await Promise.all(
          staticImageSizes.map(async (size) => {
            let clonedPipeline = pipeline.clone();
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

            // TODO: add error handling and refactor to push size metadata into own file to be used by add relative links
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
                const originalFile = await readFile(imageConfig.filePath);
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
                const originalFile = await readFile(imageConfig.filePath);
                await writeOptimisedImage(imageConfig, originalFile, size);
              }
              return;
            }

            await writeFromPipeline(imageConfig, clonedPipeline, size);
          }),
        );
      }
    }),
  );
};

removeOriginals = async () => {
  Promise.all(
    imagesSuccessfullyOptimised.map(async (filePath) => {
      await unlink(filePath);
      await writeFile(`${filePath}.optimised`, '');
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

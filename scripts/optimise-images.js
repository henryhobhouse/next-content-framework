const { readdir, readFile, unlink } = require('fs').promises;
const { writeFileSync } = require('fs');
const { resolve } = require('path');

const gifResize = require('@gumlet/gif-resize');
const cliProgress = require('cli-progress');
const _colors = require('colors');
const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const ora = require('ora');
const sharp = require('sharp');

const documentFilesBasePath = `${process.cwd()}/content/`;
const imageFilesPostfixes = /(gif|png|svg|jpe?g)$/i;
const imageFileType = /(?<=\.)(gif|png|svg|jpe?g)$/i;
const optimisedImageDirectory = 'images';
const staticImageDirectory = 'public';
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
    '| {percentage}% || {value}/{total} Image variants optimised || ETA: {eta}s',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 300,
});

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

const logSuccess = (imagePath) => {
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
  ].replace(orderPartRegex, '');
  let writePath;
  if (size === referenceImageSize) {
    writePath = `${optimisedImageDirectory}/originals/${parentDirectoryName}`;
  } else if (size === lazyLoadedPlaceholderWidth) {
    writePath = `${optimisedImageDirectory}/${size}/${parentDirectoryName}`;
  } else if (imageConfig.fileType === 'svg') {
    writePath = `${optimisedImageDirectory}/svg/${parentDirectoryName}`;
  } else {
    writePath = `${staticImageDirectory}/${size}/${parentDirectoryName}`;
  }
  return writePath;
};

const writeOptimisedImage = (imageConfig, optimisedImage, size) => {
  const relateiveWritePath = getWriteFilePath(size, imageConfig);

  // Done syncronously as async can cause memory heap errors
  writeFileSync(
    `${process.cwd()}/${relateiveWritePath}-${imageConfig.name}`,
    optimisedImage,
  );

  logSuccess(imageConfig.filePath);
};

const optimiseGif = async (imageConfig) => {
  const gifDataBuffer = await readFile(imageConfig.filePath);

  await Promise.all(
    imageSizes.map(async (size) => {
      // resize image
      const resizedOptimisedGif = await gifResize({
        width: size,
      })(gifDataBuffer);

      // optimize image
      const optimisedGif = await imageminGifsicle({
        interlaced: true,
        optimizationLevel: 3,
      })(resizedOptimisedGif);

      writeOptimisedImage(imageConfig, optimisedGif, size);
    }),
  );
};

const processImagePipeline = async (imageConfig, clonedPipeline, size) => {
  const relateiveWritePath = getWriteFilePath(size, imageConfig);

  logSuccess(imageConfig.filePath);

  await clonedPipeline.toFile(`./${relateiveWritePath}-${imageConfig.name}`);
};

const optimisePng = async (imageConfig, pipeline, size) => {
  try {
    const optimisedPng = await pipeline.toBuffer().then((sharpBuffer) => {
      return imagemin.buffer(sharpBuffer, {
        plugins: [
          imageminPngquant({
            speed: 2,
            strip: false,
          }),
        ],
      });
    });

    writeOptimisedImage(imageConfig, optimisedPng, size);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Error optimising ${imageConfig.name}`, err);
  }
};

const optimiseJpeg = async (imageConfig, pipeline, size) => {
  const optimisedJpeg = await pipeline.toBuffer().then((sharpBuffer) => {
    return imagemin.buffer(sharpBuffer, {
      plugins: [
        imageminMozjpeg({
          quality: 80,
        }),
      ],
    });
  });

  writeOptimisedImage(imageConfig, optimisedJpeg, size);
};

const optimiseSvg = async (imageConfig) => {
  const svgDataBuffer = await readFile(imageConfig.filePath);
  const optimiseSvg = await imageminSvgo({})(svgDataBuffer);
  writeOptimisedImage(imageConfig, optimiseSvg, null);
};

const optimiseImages = async () => {
  await Promise.all(
    imagesPathsToOptimise.map(async (imageConfig) => {
      const pipeline = sharp(imageConfig.filePath);
      if (imageConfig.fileType === 'gif') {
        await optimiseGif(imageConfig);
      } else if (imageConfig.fileType === 'svg') {
        await optimiseSvg(imageConfig);
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

            if (imageConfig.fileType === `png`) {
              await optimisePng(imageConfig, clonedPipeline, size);
              return;
            }

            if (imageConfig.fileType === `jpeg`) {
              await optimiseJpeg(imageConfig, clonedPipeline, size);
              return;
            }

            await processImagePipeline(imageConfig, clonedPipeline, size);
          }),
        );
      }
    }),
  );
};

removeOriginals = async () => {
  await Promise.all(
    imagesSuccessfullyOptimised.map(async (filePath) => {
      await unlink(imageConfig.filePath);
      await writeFile(`${filePath}.optimised`, '');
    }),
  );
};

(async () => {
  try {
    spinner.info('Optimising newly added images...');
    await getImagesToOptimise(documentFilesBasePath);
    progressBar.start(totalImagesToOptimise, 0, {
      speed: 'N/A',
    });
    await optimiseImages();
    // await removeOriginals();
    progressBar.stop();
    spinner.succeed(
      `${imagesSuccessfullyOptimised.length} images successively optimised.`,
    );
  } catch (error) {
    progressBar.stop();
    spinner.fail(`oh dear. Image optimisation failed. ${error.message}`);
  }
})();

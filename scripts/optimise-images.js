const { readdir, readFile, writeFile, unlink } = require('fs').promises;
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
const optimisedImageDirectory = './images';
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
let numberOfImagesOptimised = 0;
const progressBar = new cliProgress.SingleBar({
  format:
    '|' +
    _colors.magenta('{bar}') +
    '| {percentage}% || {value}/{total} Images || ETA: {eta}s',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  etaBuffer: 30,
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

const writeOptimisedImage = async (imageConfig, optimisedImage, size) => {
  const imagePathDirectories = imageConfig.filePath.split('/');
  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ].replace(orderPartRegex, '');

  const sizePrefix = size ? `${size}-` : '';

  await writeFile(
    `${optimisedImageDirectory}/${sizePrefix}${parentDirectoryName}-${imageConfig.name}`,
    optimisedImage,
  );
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

      await writeOptimisedImage(imageConfig, optimisedGif, size);
    }),
  );
};

const processImagePipeline = async (imageConfig, clonedPipeline, size) => {
  const imagePathDirectories = imageConfig.filePath.split('/');
  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ].replace(orderPartRegex, '');

  await clonedPipeline.toFile(
    `${optimisedImageDirectory}/${size}-${parentDirectoryName}-${imageConfig.name}`,
  );
};

const optimisePng = async (imageConfig, pipeline, size) => {
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

  await writeOptimisedImage(imageConfig, optimisedPng, size);
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

  await writeOptimisedImage(imageConfig, optimisedJpeg, size);
};

const optimiseSvg = async (imageConfig) => {
  const svgDataBuffer = await readFile(imageConfig.filePath);
  const optimiseSvg = await imageminSvgo({})(svgDataBuffer);
  await writeOptimisedImage(imageConfig, optimiseSvg, null);
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

      numberOfImagesOptimised += 1;
      progressBar.increment();
    }),
  );
};

removeOriginals = async () => {
  await Promise.all(
    imagesPathsToOptimise.map(async (imageConfig) => {
      const fileDirectoryArray = imageConfig.filePath.split('/');
      const fileName = fileDirectoryArray.pop();
      const relativePath = fileDirectoryArray.join('/');
      await unlink(imageConfig.filePath);
      await writeFile(`${relativePath}/${fileName}.optimised`, '');
    }),
  );
};

(async () => {
  try {
    spinner.info('Optimising newly added images...');
    await getImagesToOptimise(documentFilesBasePath);
    progressBar.start(imagesPathsToOptimise.length, 0, {
      speed: 'N/A',
    });
    await optimiseImages();
    await removeOriginals();
    progressBar.stop();
    spinner.succeed(
      `${numberOfImagesOptimised} Images successively optimised.`,
    );
  } catch (error) {
    progressBar.stop();
    spinner.fail(`oh dear. Image optimisation failed. ${error.message}`);
  }
})();

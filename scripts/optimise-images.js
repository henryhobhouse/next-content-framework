const { readdir, readFile, writeFile } = require('fs').promises;
const { resolve } = require('path');

const gifResize = require('@gumlet/gif-resize');
const cliSpinners = require('cli-spinners');
const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminPngquant = require('imagemin-pngquant');
const ora = require('ora');
const sharp = require('sharp');

const documentFilesBasePath = `${process.cwd()}/content/`;
const imageFilesPostfixes = /(gif|png|svg|jpe?g)$/i;
const imageFileType = /(?<=\.)(gif|png|svg|jpe?g)$/i;
const optimisedImageDirectory = './images';
const orderPartRegex = /^([0-9+]+)\./i;
const lazyLoadedPlaceholderWidth = 20; // pixels
const imageSizes = [1200, 600]; // high quality and article size
const staticImageSizes = [...imageSizes, lazyLoadedPlaceholderWidth];

const spinner = ora({ spinner: cliSpinners.material });

const imagesPathsToOptimise = [];
let numberOfImagesOptimised = 0;

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

  await writeFile(
    `${optimisedImageDirectory}/${size}-${parentDirectoryName}-${imageConfig.name}`,
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

const optimisePng = async (imageConfig, pipeline, size) => {
  const optimisedPng = await pipeline.toBuffer().then((sharpBuffer) => {
    imagemin.buffer(sharpBuffer, {
      plugins: [
        imageminPngquant({
          quality: [0.8],
          speed: 2,
          strip: false,
        }),
      ],
    });
  });

  await writeOptimisedImage(imageConfig, optimisedPng, size);
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

const optimiseImages = async () => {
  await Promise.all(
    imagesPathsToOptimise.map(async (imageConfig) => {
      const pipeline = sharp(imageConfig.filePath);
      if (imageConfig.fileType === 'gif') {
        await optimiseGif(imageConfig);
      } else {
        // handle all static images
        await Promise.all(
          staticImageSizes.map(async (size) => {
            let clonedPipeline = pipeline.clone();
            clonedPipeline
              .resize({ width: size })
              .png({
                compressionLevel: 9,
                progressive: true,
                force: imageConfig.fileType === `png`,
              })
              .webp({
                quality: 80,
                force: imageConfig.fileType === `webp`,
              })
              .jpeg({
                quality: 80,
                progressive: true,
                force: imageConfig.fileType === `jpg`,
              });

            if (imageConfig.fileType === `png`) {
              await optimisePng(imageConfig, clonedPipeline, size);
              return;
            }

            await processImagePipeline(imageConfig, clonedPipeline, size);
          }),
        );
      }

      numberOfImagesOptimised += 1;
    }),
  );
};

(async () => {
  try {
    spinner.start('Optimising newly added images...');
    await getImagesToOptimise(documentFilesBasePath);
    await optimiseImages();
    spinner.succeed(
      `${numberOfImagesOptimised} Images successively optimised.`,
    );
  } catch (error) {
    spinner.fail(`oh dear. Image optimisation failed. ${error.message}`);
  }
})();

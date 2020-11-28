import { SingleBar } from 'cli-progress';
import { existsSync } from 'fs';
import mkdirp from 'mkdirp';
// eslint-disable-next-line import/no-cycle
import {
  referenceImageSize,
  lazyLoadImageSize,
  staticImageDirectory,
} from '../page-mdx/mdx-parse';
import { ImageMeta } from './types/image-optimisation';

const orderPartRegex = /^([0-9+]+)\./i;
export const originalFileDirectory = 'originals';
export const svgFileDirectory = 'svg';

/**
 * Update progress bar and update list of successfully optimised images.
 */
export const logSuccess = (
  imagePath: string,
  imagesSuccessfullyOptimised: string[],
  progressBar: SingleBar,
) => {
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
export const getWriteFilePath = (imageMeta: ImageMeta, width?: number) => {
  const imagePathDirectories = imageMeta.filePath.split('/');
  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ]
    .replace(orderPartRegex, '')
    .toLowerCase();
  let writePath;
  if (width === referenceImageSize)
    writePath = `${staticImageDirectory}/${originalFileDirectory}/${parentDirectoryName}`;
  else if (width === lazyLoadImageSize)
    writePath = `${staticImageDirectory}/${width}/${parentDirectoryName}`;
  else if (imageMeta.fileType === 'svg')
    writePath = `${staticImageDirectory}/${svgFileDirectory}/${parentDirectoryName}`;
  else writePath = `${staticImageDirectory}/${width}/${parentDirectoryName}`;

  return writePath;
};

export const checkImageDirectories = () => {
  const dirsToCheck = [
    `${staticImageDirectory}/${svgFileDirectory}`,
    `${staticImageDirectory}/${lazyLoadImageSize}`,
  ];
  dirsToCheck.forEach((dir) => {
    const fullDirPath = `${process.cwd()}/${dir}`;
    if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
  });
};

export const numberPrefixRegex = /^([0-9+]+)\./i;

export const getOptimisedImageFileName = (
  fileName: string,
  imagePath: string,
) => {
  const imagePathDirectories = imagePath.split('/');
  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ]
    .replace(numberPrefixRegex, '')
    .toLowerCase();
  return `${parentDirectoryName}-${fileName.toLowerCase()}`;
};

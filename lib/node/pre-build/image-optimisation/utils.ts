import { SingleBar } from 'cli-progress';
import { existsSync, promises } from 'fs';
import mkdirp from 'mkdirp';
import {
  referenceImageSize,
  lazyLoadImageSize,
  staticImageDirectory,
  rootImageDirectory,
} from '../../../page-mdx/mdx-parse';
import { ImageConfig } from './get-images-to-optimise';

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
export const getWriteFilePath = (imageConfig: ImageConfig, width?: number) => {
  const imagePathDirectories = imageConfig.filePath.split('/');
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
  else if (imageConfig.fileType === 'svg')
    writePath = `${staticImageDirectory}/${svgFileDirectory}/${parentDirectoryName}`;
  else writePath = `${staticImageDirectory}/${width}/${parentDirectoryName}`;

  return writePath;
};

export const checkImageDirectories = () => {
  const dirsToCheck = [
    `${staticImageDirectory}/${originalFileDirectory}`,
    `${rootImageDirectory}/${svgFileDirectory}`,
    `${staticImageDirectory}/${lazyLoadImageSize}`,
  ];
  dirsToCheck.forEach((dir) => {
    const fullDirPath = `${process.cwd()}/${dir}`;
    if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
  });
};

/**
 * Remove originals (in lieu of reference images) and replace with empty
 * placeholders for content writers to know what is available
 */
export const removeOriginals = async (
  imagesSuccessfullyOptimised: string[],
) => {
  Promise.all(
    imagesSuccessfullyOptimised.map(async (filePath) => {
      await promises.unlink(filePath);
      await promises.writeFile(`${filePath}.optimised`, '');
    }),
  );
};

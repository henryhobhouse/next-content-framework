import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import mkdirp from 'mkdirp';
import shortHash from 'shorthash2';
import crypto from 'crypto';
import {
  currentWorkingDirectory,
  localImageCachePath,
  localModifiedFilePath,
  nextPublicDirectory,
} from '../../constants';
import { ImageMeta } from '../../types/image-processing';
import imageProcessingConfig from './image-processing-config';

const { thumbnailImageWidth } = imageProcessingConfig;

const getImageNameFromPath = (filePath: string) => {
  const imagePathDirectories = filePath.split('/');
  const imageName = imagePathDirectories[imagePathDirectories.length - 1];

  return imageName;
};

/**
 * Update progress bar and update list of successfully optimised images.
 */
export const logSuccess = (
  imagePath: string,
  imagesSuccessfullyOptimised: string[],
) => {
  // add image, if not already done, to the list of successfully optimised images
  if (!imagesSuccessfullyOptimised.includes(imagePath))
    imagesSuccessfullyOptimised.push(imagePath);
};

/**
 * To avoid collisions with files with same name we take a simple hash of the path as a
 * prefix to ensure each name is unique.
 */
export const getProcessedImageFileName = (imagePath: string) => {
  const lowerCasePath = imagePath.toLowerCase();
  const pathHash = shortHash(lowerCasePath);
  const imageName = getImageNameFromPath(lowerCasePath);

  return `${pathHash}-${imageName}`;
};

/**
 * Get path and name prefix for the image. The name prefix composing of imageHash and parent name
 * to avoid collisions when images are flattened and invalidation of browser cache on image change.
 */
export const getWriteFilePath = (
  imageMeta: ImageMeta,
  width: number,
  imageHash: string,
) => {
  return `${currentWorkingDirectory}/${nextPublicDirectory}/${width}/${imageHash}${getProcessedImageFileName(
    imageMeta.filePath,
  )}`;
};

export const ensureLocalModifiedCacheFileExists = () => {
  if (!existsSync(localImageCachePath)) mkdirSync(localImageCachePath);
  if (!existsSync(localModifiedFilePath))
    writeFileSync(localModifiedFilePath, '{}');
};

export const checkImageDirectories = () => {
  const dirsToCheck = [`${nextPublicDirectory}/${thumbnailImageWidth}`];
  dirsToCheck.forEach((dir) => {
    const fullDirPath = `${currentWorkingDirectory}/${dir}`;
    if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
  });
};

export const numberPrefixRegex = /^([0-9+]+)\./i;

export const getFileShortHash = (path: string) => {
  const imageContent = readFileSync(path).toString();
  const imageHash = crypto
    .createHash('sha1')
    .update(imageContent)
    .digest('base64')
    .replace(/=|\+|\//gi, '')
    .substring(0, 7);

  return imageHash;
};

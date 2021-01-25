import { Metadata } from 'sharp';
import { existsSync, writeFileSync, readFileSync, statSync } from 'fs';
import { ImageMeta, StoredImageAttributes } from '../../types/image-processing';
import {
  currentWorkingDirectory,
  localModifiedFilePath,
} from '../../constants';
import { ensureLocalModifiedCacheFileExists, getFileShortHash } from './utils';

export const imageAttributesFilePath = `${currentWorkingDirectory}/lib/image-meta-data.json`;

const updateStoredImageCache = (
  imageMeta: ImageMeta,
  imageAttributes: StoredImageAttributes,
) => {
  // if image size file doesn't exist yet create it
  if (!existsSync(imageAttributesFilePath)) {
    writeFileSync(imageAttributesFilePath, '{}');
  }

  const imageMetaDataString = readFileSync(imageAttributesFilePath).toString();

  const imageMetaData = JSON.parse(imageMetaDataString);

  imageMetaData[imageMeta.processedImageName] = imageAttributes;

  const prettifiedMetaDataString = JSON.stringify(imageMetaData, null, 2);

  writeFileSync(imageAttributesFilePath, prettifiedMetaDataString);
};

/**
 * Store
 */
const updateLocalImageCache = (imageMeta: ImageMeta) => {
  // if image size file doesn't exist yet create it
  ensureLocalModifiedCacheFileExists();

  const imageLastModifiedLocally = statSync(imageMeta.filePath).mtime.getTime();

  const localImageCacheString = readFileSync(localModifiedFilePath).toString();

  const localImageCache = JSON.parse(localImageCacheString);

  localImageCache[imageMeta.processedImageName] = imageLastModifiedLocally;

  const prettifiedLocalImageCacheString = JSON.stringify(
    localImageCache,
    null,
    2,
  );

  writeFileSync(localModifiedFilePath, prettifiedLocalImageCacheString);
};

const getHashAndUpdateCache = (metaData: Metadata, imageMeta: ImageMeta) => {
  const imageHash = getFileShortHash(imageMeta.filePath);

  const imageAttributes: StoredImageAttributes = {
    width: metaData.width,
    height: metaData.height,
    imageHash,
  };

  updateStoredImageCache(imageMeta, imageAttributes);

  updateLocalImageCache(imageMeta);

  return imageHash;
};

export default getHashAndUpdateCache;

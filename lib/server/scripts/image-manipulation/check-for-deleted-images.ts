import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import processedImageMetaData from '../../../image-meta-data.json';
import { nextPublicDirectory } from '../../../next-static-server/mdx-parse';
import {
  currentWorkingDirectory,
  localModifiedFilePath,
} from '../../constants';
import { SavedImageAttributes } from '../../types/image-processing';
import { imageAttributesFilePath } from './get-hash-and-update-cache';
import imageProcessingConfig from './image-processing-config';

const { thumbnailImageWidth } = imageProcessingConfig;

const deleteImageThumbnail = async (
  imageName: string,
  staticImageSizes: number[],
) => {
  staticImageSizes.forEach(async (imageSize) => {
    const imageHash = (processedImageMetaData as SavedImageAttributes)[
      imageName as keyof typeof processedImageMetaData
    ]?.imageHash;
    const fullImagePath = `${currentWorkingDirectory}/${nextPublicDirectory}/${imageSize}/${imageHash}${imageName}`;
    if (existsSync(fullImagePath)) {
      unlinkSync(fullImagePath);
    }
  });
};

const deleteStoredImageAttributes = (imageName: string) => {
  const preProcessedImageMetaString = readFileSync(
    imageAttributesFilePath,
  ).toString();

  const preProcessedImageMeta = JSON.parse(preProcessedImageMetaString);

  delete preProcessedImageMeta[imageName];

  const prettifiedMetaDataString = JSON.stringify(
    preProcessedImageMeta,
    null,
    2,
  );

  writeFileSync(imageAttributesFilePath, prettifiedMetaDataString);
};

const deleteImageFromLocalCache = (imageName: string) => {
  const localModifiedCacheString = readFileSync(
    localModifiedFilePath,
  ).toString();

  const localModifiedCache = JSON.parse(localModifiedCacheString);

  delete localModifiedCache[imageName];

  const prettifiedLocalCacheString = JSON.stringify(
    localModifiedCache,
    null,
    2,
  );

  writeFileSync(localModifiedFilePath, prettifiedLocalCacheString);
};

/**
 * Checks if there is any image meta that doesn't correspond to an image file. If not then
 * remove from mete data and any statically optimised files.
 *
 * Note this is not asynchronous by intent as we cannot read write to the image-meta-data.json file
 * concurrently. There is likely some optimisation we can do here (delete file asynchronous but not update meta)
 * for instance
 */
const checkForDeletedImages = (allNonModifiedImages: string[]) => {
  const imagesToDelete: string[] = [];

  Object.keys(processedImageMetaData).forEach((processedImageName) => {
    const hasExistingImage = allNonModifiedImages.some(
      (nonModifiedImageName, index) => {
        if (nonModifiedImageName === processedImageName) {
          allNonModifiedImages.splice(index, 1);
          return true;
        }
        return false;
      },
    );

    if (!hasExistingImage) {
      imagesToDelete.push(processedImageName);
    }
  });

  if (imagesToDelete.length) {
    imagesToDelete.forEach((imageName) => {
      deleteImageThumbnail(imageName, [thumbnailImageWidth]);
      deleteStoredImageAttributes(imageName);
      deleteImageFromLocalCache(imageName);
    });

    logger.log(
      'info',
      `Deleted ${imagesToDelete.length} optimised image reference that is no longer needed`,
    );
  }
};

export default checkForDeletedImages;

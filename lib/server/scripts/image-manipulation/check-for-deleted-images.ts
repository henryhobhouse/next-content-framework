import { promises, existsSync, unlinkSync } from 'fs';
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

const deleteImageThumbnail = (
  imageName: string,
  staticImageSizes: number[],
) => {
  staticImageSizes.forEach((imageSize) => {
    const imageHash = (processedImageMetaData as SavedImageAttributes)[
      imageName as keyof typeof processedImageMetaData
    ]?.imageHash;
    const fullImagePath = `${currentWorkingDirectory}/${nextPublicDirectory}/${imageSize}/${imageHash}${imageName}`;
    if (existsSync(fullImagePath)) {
      unlinkSync(fullImagePath);
    }
  });
};

const deleteStoredImageAttributes = async (imageName: string) => {
  const preProcessedImageMetaString = await promises
    .readFile(imageAttributesFilePath)
    .toString();

  const preProcessedImageMeta = JSON.parse(preProcessedImageMetaString);

  delete preProcessedImageMeta[imageName];

  const prettifiedMetaDataString = JSON.stringify(
    preProcessedImageMeta,
    null,
    2,
  );

  await promises.writeFile(imageAttributesFilePath, prettifiedMetaDataString);
};

const deleteImageFromLocalCache = async (imageName: string) => {
  const localModifiedCacheString = await promises
    .readFile(localModifiedFilePath)
    .toString();

  const localModifiedCache = JSON.parse(localModifiedCacheString);

  delete localModifiedCache[imageName];

  const prettifiedLocalCacheString = JSON.stringify(
    localModifiedCache,
    null,
    2,
  );

  await promises.writeFile(localModifiedFilePath, prettifiedLocalCacheString);
};

/**
 * Checks if there is any image meta that doesn't correspond to an image file. If not then
 * remove from mete data and any statically optimised files.
 *
 * Note this is not asynchronous by intent as we cannot read write to the image-meta-data.json file
 * concurrently. There is likely some optimisation we can do here (delete file asynchronous but not update meta)
 * for instance
 */
const checkForDeletedImages = async (allNonModifiedImages: string[]) => {
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
    await Promise.all(
      imagesToDelete.map(async (imageName) => {
        deleteImageThumbnail(imageName, [thumbnailImageWidth]);
        await deleteStoredImageAttributes(imageName);
        await deleteImageFromLocalCache(imageName);
      }),
    );

    logger.log(
      'info',
      `Deleted ${imagesToDelete.length} optimised image reference that is no longer needed`,
    );
  }
};

export default checkForDeletedImages;

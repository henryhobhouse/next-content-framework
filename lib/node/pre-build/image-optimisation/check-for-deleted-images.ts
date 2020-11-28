import { promises, existsSync, writeFileSync } from 'fs';
import imageSizeMetaData from '../../../image-meta-data.json';
import { staticImageDirectory } from '../../../page-mdx/mdx-parse';
import { imageSizeFilePath } from './extract-image-size';

const deleteStaticImages = async (
  imageName: string,
  staticImageSizes: number[],
) => {
  await Promise.allSettled(
    staticImageSizes.map(async (imageSize) => {
      const fullImagePath = `${process.cwd()}/${staticImageDirectory}/${imageSize}/${imageName}`;
      if (existsSync(fullImagePath)) {
        await promises.unlink(fullImagePath);
      }
    }),
  );
};

const deleteImageMeta = (imageName: string) => {
  const newImageSizeMeta = { ...imageSizeMetaData };
  delete newImageSizeMeta[imageName as keyof typeof newImageSizeMeta];
  const pretifiedMetaDataString = JSON.stringify(newImageSizeMeta, null, 2);

  writeFileSync(imageSizeFilePath, pretifiedMetaDataString);
};

/**
 * Checks if there is any image meta that doesn't correspond to an image file. If not then
 * remove from mete data and any statically optimised files.
 */
const checkForDeletedImages = async (
  currentImages: string[],
  staticImageSizes: number[],
) => {
  const imagesToDelete: string[] = [];
  Object.keys(imageSizeMetaData).forEach((imageName) => {
    const hasExistingImage = currentImages.some((currentName) => {
      return currentName === imageName;
    });
    if (!hasExistingImage) {
      imagesToDelete.push(imageName);
    }
  });

  if (imagesToDelete.length) {
    await Promise.allSettled(
      imagesToDelete.map(async (imageName) => {
        await deleteStaticImages(imageName, staticImageSizes);
        deleteImageMeta(imageName);
      }),
    );
    logger.log(
      'info',
      `Deleted ${imagesToDelete.length} optimised image reference that is no longer needed`,
    );
  }
};

export default checkForDeletedImages;

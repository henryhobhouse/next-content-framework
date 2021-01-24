import { promises, existsSync, writeFileSync, readFileSync } from 'fs';
import imageSizeMetaData from '../../../image-meta-data.json';
import { nextPublicDirectory } from '../../../page-mdx/mdx-parse';
import { currentWorkingDirectory } from '../../constants';
import { SavedImageAttributes } from '../../types/image-processing';
import { imageAttributesFilePath } from './extract-image-attributes';
import imageProcessingConfig from './image-processing-config';

const { thumbnailImageWidth } = imageProcessingConfig;

const deleteStaticImages = async (
  imageName: string,
  staticImageSizes: number[],
) => {
  await Promise.all(
    staticImageSizes.map(async (imageSize) => {
      const imageHash = (imageSizeMetaData as SavedImageAttributes)[
        imageName as keyof typeof imageSizeMetaData
      ]?.imageHash;
      const fullImagePath = `${currentWorkingDirectory}/${nextPublicDirectory}/${imageSize}/${imageHash}.${imageName}`;
      if (existsSync(fullImagePath)) {
        await promises.unlink(fullImagePath);
      }
    }),
  );
};

const deleteImageMeta = async (imageName: string) => {
  const newImageSizeMeta = readFileSync(imageAttributesFilePath).toJSON();
  delete newImageSizeMeta[imageName as keyof typeof newImageSizeMeta];
  const prettifiedMetaDataString = JSON.stringify(newImageSizeMeta, null, 2);

  writeFileSync(imageAttributesFilePath, prettifiedMetaDataString);
};

/**
 * Checks if there is any image meta that doesn't correspond to an image file. If not then
 * remove from mete data and any statically optimised files.
 */
const checkForDeletedImages = async (allNonModifiedImages: string[]) => {
  const imagesToDelete: string[] = [];

  Object.keys(imageSizeMetaData).forEach((preProcessedImageName) => {
    const hasExistingImage = allNonModifiedImages.some(
      (nonModifiedImageName) => {
        return nonModifiedImageName === preProcessedImageName;
      },
    );

    if (!hasExistingImage) {
      imagesToDelete.push(preProcessedImageName);
    }
  });

  if (imagesToDelete.length) {
    await Promise.all(
      imagesToDelete.map(async (imageName) => {
        await deleteStaticImages(imageName, [thumbnailImageWidth]);
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

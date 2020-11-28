import { Metadata } from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { ImageMeta } from '../../types/image-optimisation';

export const imageSizeFilePath = `${process.cwd()}/lib/image-meta-data.json`;

const extractImageSize = (metaData: Metadata, imageMeta: ImageMeta) => {
  const imageAttributes = {
    width: metaData.width,
    height: metaData.height,
  };

  // if image size file doesn't exist yet create it
  if (!existsSync(imageSizeFilePath)) {
    writeFileSync(imageSizeFilePath, '{}');
  }

  const imageMetaDataString = readFileSync(
    imageSizeFilePath,
    'utf8',
  ).toString();

  const imageMetaData = JSON.parse(imageMetaDataString);

  imageMetaData[imageMeta.optimisedImageName] = imageAttributes;

  const pretifiedMetaDataString = JSON.stringify(imageMetaData, null, 2);

  writeFileSync(imageSizeFilePath, pretifiedMetaDataString);
};

export default extractImageSize;

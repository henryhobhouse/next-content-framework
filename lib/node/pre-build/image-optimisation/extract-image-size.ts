import { Metadata } from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getOptimisedImageFileName } from '../../utils';
import { ImageConfig } from '../../types/image-optimisation';

const imageSizeFilePath = `${process.cwd()}/lib/image-meta-data.json`;

const extractImageSize = (metaData: Metadata, imageConfig: ImageConfig) => {
  const imageAttributes = {
    width: metaData.width,
    height: metaData.height,
  };

  const imageFileName = getOptimisedImageFileName(
    imageConfig.name,
    imageConfig.filePath,
  );

  // if image size file doesn't exist yet create it
  if (!existsSync(imageSizeFilePath)) {
    writeFileSync(imageSizeFilePath, '{}');
  }

  const imageMetaDataString = readFileSync(
    imageSizeFilePath,
    'utf8',
  ).toString();

  const imageMetaData = JSON.parse(imageMetaDataString);

  imageMetaData[imageFileName] = imageAttributes;

  const pretifiedMetaDataString = JSON.stringify(imageMetaData, null, 2);

  writeFileSync(imageSizeFilePath, pretifiedMetaDataString);
};

export default extractImageSize;

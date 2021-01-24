import { Metadata } from 'sharp';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { ImageMeta, StoredImageAttributes } from '../../types/image-processing';
import { currentWorkingDirectory } from '../../constants';
import { getFileShortHash } from './utils';

export const imageAttributesFilePath = `${currentWorkingDirectory}/lib/image-meta-data.json`;

const extractImageAttributes = (metaData: Metadata, imageMeta: ImageMeta) => {
  const imageHash = getFileShortHash(imageMeta.filePath);

  const imageAttributes: StoredImageAttributes = {
    width: metaData.width,
    height: metaData.height,
    imageHash,
  };

  // if image size file doesn't exist yet create it
  if (!existsSync(imageAttributesFilePath)) {
    writeFileSync(imageAttributesFilePath, '{}');
  }

  const imageMetaDataString = readFileSync(
    imageAttributesFilePath,
    'utf8',
  ).toString();

  const imageMetaData = JSON.parse(imageMetaDataString);

  imageMetaData[imageMeta.processedImageName] = imageAttributes;

  const prettifiedMetaDataString = JSON.stringify(imageMetaData, null, 2);

  writeFileSync(imageAttributesFilePath, prettifiedMetaDataString);

  return imageHash;
};

export default extractImageAttributes;

import { Metadata } from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { ImageMeta, StoredImageAttributes } from '../../types/image-processing';
import { currentWorkingDirectory } from '../../constants';

export const imageAttributesFilePath = `${currentWorkingDirectory}/lib/image-meta-data.json`;

const extractImageAttributes = (metaData: Metadata, imageMeta: ImageMeta) => {
  const lastModified = statSync(imageMeta.filePath).mtime;
  const imageHash = Number(lastModified).toString(36);

  const imageAttributes: StoredImageAttributes = {
    width: metaData.width,
    height: metaData.height,
    imageHash,
    lastModified: lastModified.getTime(),
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

import { Metadata } from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { orderPartRegex } from '../../../mdx/mdx-parse';
import { ImageConfig } from './get-images-to-optimise';

const imageSizeFilePath = `${process.cwd()}/images/meta-data.json`;

const extractImageSize = (
  error: Error,
  metaData: Metadata,
  imageConfig: ImageConfig,
) => {
  if (error) {
    logger.error({
      level: 'error',
      noConsole: true,
      message: `Unable to get image meta data: ${error.message}`,
    });
  }

  const imageAttributes = {
    width: metaData.width,
    height: metaData.height,
    ratio:
      metaData.height && metaData.width
        ? metaData.height / metaData.width
        : null,
  };

  const imagePathDirectories = imageConfig.filePath
    .replace(orderPartRegex, '/')
    .split('/');

  const parentDirectoryName = imagePathDirectories[
    imagePathDirectories.length - 2
  ].toLowerCase();

  const imageFileName = `${parentDirectoryName}-${imageConfig.name}`;

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

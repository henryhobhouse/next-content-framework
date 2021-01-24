import { promises, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  ImageMeta,
  ImageFileType,
  SavedImageAttributes,
} from '../../types/image-processing';

import { getFileShortHash, getProcessedImageFileName } from './utils';

import preProcessedImageMetas from '../../../image-meta-data.json';
import { imageFormat } from './image-processing-config';
import { currentWorkingDirectory } from '../../constants';

const imageFileTypeRegex = /(?<=\.)(gif|png|svg|jpe?g)$/i;
const localCachePath = `${currentWorkingDirectory}/.local-processed-cache.json`;

interface GetImagesToProcessProps {
  directoryPath: string;
}

/**
 * Recursively iterate through all content directories and add any accepted image files
 * to a list.
 */
const getImagesToProcess = async ({
  directoryPath,
}: GetImagesToProcessProps) => {
  let totalImagesToProcess = 0;
  const imagesPathsToProcess: ImageMeta[] = [];
  const allNonModifiedImages: string[] = [];

  // if no local cache exists then create the file with empty json in
  if (!existsSync(localCachePath)) writeFileSync(localCachePath, '{}');

  const searchContentDirectory = async (path: string) => {
    const dirents = await promises.readdir(path, {
      withFileTypes: true,
    });

    const imageDirents = dirents.filter((dirent) =>
      dirent.name.match(imageFileTypeRegex),
    );

    if (imageDirents.length)
      await Promise.all(
        imageDirents.map(async (imageDirent) => {
          const imageFileLocation = resolve(path, imageDirent.name);
          const fileFormatRegExResult = imageDirent.name.match(
            imageFileTypeRegex,
          );
          const imageFormatType = Array.isArray(fileFormatRegExResult)
            ? fileFormatRegExResult[0]
            : '';

          // if the dirent isn't a valid image file then return. This will only happen if the regex checking
          // if valid image format diverges from regex to extract file format
          if (!imageFormatType) return;

          // get unique image name with hashed filepath prefix
          const processedImageName = getProcessedImageFileName(
            imageFileLocation,
          );

          const preProcessedImageHash = (preProcessedImageMetas as SavedImageAttributes)[
            processedImageName as keyof typeof preProcessedImageMetas
          ]?.imageHash;

          // only if image has previously been processed do we need to check if image has changed
          if (preProcessedImageHash) {
            const currentFileHash = getFileShortHash(imageFileLocation);

            const imageNotModifiedSinceLastProcessed =
              preProcessedImageHash === currentFileHash;

            // if image has been modified since last process then don't add to all images as will then be flagged
            // to be deleted before being re-processed. This cannot happen on the build pipeline
            if (imageNotModifiedSinceLastProcessed || process.env.CI) {
              allNonModifiedImages.push(processedImageName);
              return;
            }
          } else {
            allNonModifiedImages.push(processedImageName);
          }

          const fileType =
            imageFormatType === 'jpg' ? imageFormat.jpeg : imageFormatType;

          if (fileType && fileType === imageFormat.png)
            totalImagesToProcess += 1;

          if (fileType) {
            const imageMeta = {
              filePath: imageFileLocation,
              name: imageDirent.name,
              processedImageName,
              fileType: fileType as ImageFileType,
            };
            imagesPathsToProcess.push(imageMeta);
          }
        }),
      );

    await Promise.all(
      dirents.map(async (dirent) => {
        const filePath = resolve(path, dirent.name);
        const isDirectory = dirent.isDirectory();
        if (isDirectory) await searchContentDirectory(filePath);
      }),
    );
  };

  await searchContentDirectory(directoryPath);

  return {
    totalImagesToProcess,
    imagesPathsToProcess,
    allNonModifiedImages,
  };
};

export default getImagesToProcess;

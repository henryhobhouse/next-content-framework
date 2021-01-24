import { promises, statSync } from 'fs';
import { resolve } from 'path';
import {
  ImageMeta,
  ImageFileType,
  SavedImageAttributes,
} from '../../types/image-processing';

import { getProcessedImageFileName } from './utils';

import preProcessedImageMetas from '../../../image-meta-data.json';
import { imageFormat } from './image-processing-config';

const imageFilesPostfixesRegex = /(gif|png|svg|jpe?g)$/i;
const imageFileTypeRegex = /(?<=\.)(gif|png|svg|jpe?g)$/i;

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

  const searchContentDirectory = async (path: string) => {
    const dirents = await promises.readdir(path, {
      withFileTypes: true,
    });

    const imageDirents = dirents.filter((dirent) =>
      dirent.name.match(imageFilesPostfixesRegex),
    );

    if (imageDirents.length)
      await Promise.all(
        imageDirents.map(async (imageDirent) => {
          const imageFileLocation = resolve(path, imageDirent.name);
          const rawFileTypeArray = imageDirent.name.match(imageFileTypeRegex);
          const rawFileType = Array.isArray(rawFileTypeArray)
            ? rawFileTypeArray[0]
            : '';

          const processedImageName = getProcessedImageFileName(
            imageFileLocation,
          );

          const currentFileLastModified = statSync(
            imageFileLocation,
          ).mtime.getTime();

          const preProcessedImageLastModified = (preProcessedImageMetas as SavedImageAttributes)[
            processedImageName as keyof typeof preProcessedImageMetas
          ]?.lastModified;

          const imageNotModifiedSinceLastProcessed =
            preProcessedImageLastModified === currentFileLastModified;

          // if image has been modified since last process then don't add to all images as will then be flagged to be deleted before being re-processed
          if (imageNotModifiedSinceLastProcessed) {
            allNonModifiedImages.push(processedImageName);
          }

          // if image has already being processed, and not modified since then, then don't add to the list to be (re-/)processed
          if (
            rawFileType &&
            preProcessedImageLastModified &&
            imageNotModifiedSinceLastProcessed
          )
            return;

          const fileType =
            rawFileType === 'jpg' ? imageFormat.jpeg : rawFileType;
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

import { promises } from 'fs';
import { resolve } from 'path';
import {
  ImageMeta,
  ImageFileType,
  imageFileType,
} from '../../types/image-optimisation';

import { getOptimisedImageFileName } from '../../utils';

import preOptimisedImageMetas from '../../../image-meta-data.json';

const imageFilesPostfixesRegex = /(gif|png|svg|jpe?g)$/i;
const imageFileTypeRegex = /(?<=\.)(gif|png|svg|jpe?g)$/i;

interface GetImagesToOptimiseProps {
  directoryPath: string;
  numberOfImageSizes: number;
}

/**
 * Recurrisively iterate through all content directories and add any accepted image files
 * to a list.
 */
const getImagesToOptimise = async ({
  directoryPath,
  numberOfImageSizes,
}: GetImagesToOptimiseProps) => {
  let totalImagesToOptimise = 0;
  const imagesPathsToOptimise: ImageMeta[] = [];
  const allOptimisedImageNames: string[] = [];

  const searchContentDirectory = async (path: string) => {
    const dirents = await promises.readdir(path, {
      withFileTypes: true,
    });

    const imageDirents = dirents.filter((dirent) =>
      dirent.name.match(imageFilesPostfixesRegex),
    );

    if (imageDirents.length)
      await Promise.allSettled(
        imageDirents.map(async (imageDirent) => {
          const imageFileLocation = resolve(path, imageDirent.name);
          const rawFileTypeArray = imageDirent.name.match(imageFileTypeRegex);
          const rawFileType = Array.isArray(rawFileTypeArray)
            ? rawFileTypeArray[0]
            : '';

          const optimisedImageName = getOptimisedImageFileName(
            imageDirent.name,
            imageFileLocation,
          );

          allOptimisedImageNames.push(optimisedImageName);

          if (rawFileType) {
            // if image has already being optimised then don't add to the list to be optimised
            if (
              preOptimisedImageMetas[
                optimisedImageName as keyof typeof preOptimisedImageMetas
              ]
            )
              return;
          }

          const fileType =
            rawFileType === 'jpg' ? imageFileType.jpeg : rawFileType;
          if (fileType === imageFileType.svg) totalImagesToOptimise += 1;
          else if (fileType === imageFileType.gif) {
            // gif don't need thumbnails so can remove one of the image sizes
            totalImagesToOptimise += numberOfImageSizes - 1;
          } else if (fileType) totalImagesToOptimise += numberOfImageSizes;

          if (fileType) {
            const imageMeta = {
              filePath: imageFileLocation,
              name: imageDirent.name,
              optimisedImageName,
              fileType: fileType as ImageFileType,
            };
            imagesPathsToOptimise.push(imageMeta);
          }
        }),
      );

    await Promise.allSettled(
      dirents.map(async (dirent) => {
        const filePath = resolve(path, dirent.name);
        const isDirectory = dirent.isDirectory();
        if (isDirectory) await searchContentDirectory(filePath);
      }),
    );
  };

  await searchContentDirectory(directoryPath);

  return {
    totalImagesToOptimise,
    imagesPathsToOptimise,
    allOptimisedImageNames,
  };
};

export default getImagesToOptimise;

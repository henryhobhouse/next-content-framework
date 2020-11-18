import { promises } from 'fs';
import { resolve } from 'path';

export const imageFileType = {
  svg: 'svg',
  jpeg: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
} as const;

export type ImageFileType = keyof typeof imageFileType;

export interface ImageConfig {
  filePath: string;
  name: string;
  fileType: keyof typeof imageFileType;
}

const imageFilesPostfixesRegex = /(gif|png|svg|jpe?g)$/i;
const imageFileTypeRegex = /(?<=\.)(gif|png|svg|jpe?g)$/i;

/**
 * Recurrisively iterate through all content directories and add any accepted image files
 * to a list.
 */
const getImagesToOptimise = async (directoryPath: string) => {
  let totalImagesToOptimise = 0;
  const imagesPathsToOptimise: ImageConfig[] = [];

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
          const fileType =
            rawFileType === 'jpg' ? imageFileType.jpeg : rawFileType;
          if (fileType === imageFileType.svg) totalImagesToOptimise += 1;
          else if (fileType === imageFileType.gif) totalImagesToOptimise += 2;
          else if (fileType) totalImagesToOptimise += 2;

          if (fileType) {
            const imageConfig = {
              filePath: imageFileLocation,
              name: imageDirent.name,
              fileType: fileType as ImageFileType,
            };
            imagesPathsToOptimise.push(imageConfig);
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
    totalImagesToOptimise,
    imagesPathsToOptimise,
  };
};

export default getImagesToOptimise;

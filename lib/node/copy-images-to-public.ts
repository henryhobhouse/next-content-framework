import { promises, existsSync } from 'fs';
import {
  rootImageDirectory,
  staticImageDirectory,
} from '../page-mdx/mdx-parse';

export interface ImageData {
  path: string;
  parentDirectory: string;
  name: string;
}

const copyImagesToPublic = async (imageDatas: ImageData[]) => {
  await Promise.allSettled(
    imageDatas.map(async (imageData) => {
      const imagePathDirectories = imageData.path.split('/');
      const parentDirectoryName = imagePathDirectories[
        imagePathDirectories.length - 2
      ]
        .replace(/^([0-9+]+)\./i, '')
        .toLowerCase();

      const desitinationPath = `${process.cwd()}/${staticImageDirectory}/${rootImageDirectory}/${parentDirectoryName}-${
        imageData.name
      }`;

      if (!existsSync(desitinationPath)) {
        await promises.copyFile(imageData.path, desitinationPath);
      }
    }),
  );
};

export default copyImagesToPublic;

import { promises, existsSync } from 'fs';
import mkdirp from 'mkdirp';
import {
  rootImageDirectory,
  staticImageDirectory,
} from '../page-mdx/mdx-parse';
import { getOptimisedImageFileName } from './utils';

export interface ImageData {
  path: string;
  parentDirectory: string;
  name: string;
}

const checkImageDirExists = () => {
  const fullDirPath = `${process.cwd()}/${staticImageDirectory}/${rootImageDirectory}`;
  if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
};

const syncImagesWithPublic = async (imageDatas: ImageData[]) => {
  checkImageDirExists();
  await Promise.allSettled(
    imageDatas.map(async (imageData) => {
      const optimiseImageName = getOptimisedImageFileName(
        imageData.name,
        imageData.path,
      );

      const desitinationPath = `${process.cwd()}/${staticImageDirectory}/${rootImageDirectory}/${optimiseImageName}`;

      if (!existsSync(desitinationPath)) {
        await promises.copyFile(imageData.path, desitinationPath);
      }
    }),
  );
};

export default syncImagesWithPublic;

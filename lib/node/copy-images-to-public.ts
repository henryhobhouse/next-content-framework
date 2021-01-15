import { promises, existsSync } from 'fs';
import mkdirp from 'mkdirp';
import { rootImageDirectory, nextPublicDirectory } from '../page-mdx/mdx-parse';
import { getOptimisedImageFileName } from './utils';

export interface ImageData {
  path: string;
  parentDirectory: string;
  name: string;
}

const checkImageDirExists = () => {
  const fullDirPath = `${process.cwd()}/${nextPublicDirectory}/${rootImageDirectory}`;
  if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
};

const syncImagesWithPublic = async (imagesMetaData: ImageData[]) => {
  checkImageDirExists();
  await Promise.allSettled(
    imagesMetaData.map(async (imageData) => {
      const optimiseImageName = getOptimisedImageFileName(
        imageData.name,
        imageData.path,
      );

      const destinationPath = `${process.cwd()}/${nextPublicDirectory}/${rootImageDirectory}/${optimiseImageName}`;

      if (!existsSync(destinationPath)) {
        await promises.copyFile(imageData.path, destinationPath);
      }
    }),
  );
};

export default syncImagesWithPublic;

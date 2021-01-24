import { promises, existsSync } from 'fs';
import mkdirp from 'mkdirp';
import { rootImageDirectory, nextPublicDirectory } from '../page-mdx/mdx-parse';
import { getProcessedImageFileName } from './pre-build/image-manipulation/utils';
import imageMetaData from '../image-meta-data.json';
import { SavedImageAttributes } from './types/image-processing';
import { currentWorkingDirectory } from './constants';

export interface ImageData {
  path: string;
  parentDirectory: string;
  name: string;
}

const checkImageDirExists = () => {
  const fullDirPath = `${currentWorkingDirectory}/${nextPublicDirectory}/${rootImageDirectory}`;
  if (!existsSync(fullDirPath)) mkdirp.sync(fullDirPath);
};

const syncImagesWithPublic = async (imagesMetaData: ImageData[]) => {
  checkImageDirExists();
  // use all settled so it will still continue even if error with a single image
  await Promise.all(
    imagesMetaData.map(async (imageData) => {
      const processedImageName = getProcessedImageFileName(imageData.path);
      const imageHash = (imageMetaData as SavedImageAttributes)[
        processedImageName as keyof typeof imageMetaData
      ]?.imageHash;

      const destinationPath = `${currentWorkingDirectory}/${nextPublicDirectory}/${rootImageDirectory}/${imageHash}.${processedImageName}`;

      if (!existsSync(destinationPath)) {
        await promises.copyFile(imageData.path, destinationPath);
      }
    }),
  );
};

export default syncImagesWithPublic;

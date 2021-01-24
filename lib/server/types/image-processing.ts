import { imageFormat } from '../scripts/image-manipulation/image-processing-config';

export type ImageFileType = keyof typeof imageFormat;
export interface ImageMeta {
  filePath: string;
  processedImageName: string;
  name: string;
  fileType: keyof typeof imageFormat;
}

export interface StoredImageAttributes {
  width?: number;
  height?: number;
  imageHash: string;
}

export type SavedImageAttributes = { [key: string]: StoredImageAttributes };

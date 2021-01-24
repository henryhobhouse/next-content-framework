import { imageFormat } from '../pre-build/image-manipulation/image-processing-config';

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
  lastModified: number;
}

export type SavedImageAttributes = { [key: string]: StoredImageAttributes };

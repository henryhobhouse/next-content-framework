export const imageFileType = {
  svg: 'svg',
  jpeg: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
} as const;

export type ImageFileType = keyof typeof imageFileType;

export interface ImageMeta {
  filePath: string;
  optimisedImageName: string;
  name: string;
  fileType: keyof typeof imageFileType;
}

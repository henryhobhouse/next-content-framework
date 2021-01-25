export const imageFormat = Object.freeze({
  png: 'png',
  gif: 'gif',
  svg: 'svg',
  jpeg: 'jpeg',
});

const imageConfig = {
  thumbnailImageWidth: 20,
  allowedImageTypes: [imageFormat.png, imageFormat.gif],
  allowedFormatForThumbnails: [imageFormat.png],
};

export default imageConfig;

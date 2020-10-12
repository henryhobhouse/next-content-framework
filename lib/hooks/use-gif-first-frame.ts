import { useCallback, useEffect, useState } from 'react';

/**
 * Extract first image frame as standalone image from a gif.
 */
const useGifFirstFrame = (gifUrl: string) => {
  const [firstFrameImage, setFirstFrameImage] = useState<string>();

  const getGifFirstFrameUrl = useCallback((img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    if (typeof canvas.getContext !== 'function') {
      return null;
    }
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
    return canvas.toDataURL();
  }, []);

  const preloadGif = useCallback(
    (src: string, callback: (img: HTMLImageElement) => void) => {
      const img = new Image();
      if (typeof callback === 'function') {
        img.onload = () => callback(img);
        img.setAttribute('crossOrigin', 'anonymous');
      }
      img.src = src;
    },
    [],
  );

  useEffect(() => {
    preloadGif(gifUrl, (img: HTMLImageElement) => {
      const actualStill = getGifFirstFrameUrl(img);
      if (actualStill) {
        setFirstFrameImage(actualStill);
      }
    });
  }, [preloadGif, getGifFirstFrameUrl, setFirstFrameImage, gifUrl]);

  return {
    firstFrameImage,
  };
};

export default useGifFirstFrame;

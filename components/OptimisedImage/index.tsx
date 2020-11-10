import React, { FC } from 'react';

import GifPlayer from '../GifPlayer';

import StaticImage from './StaticImage';

interface Props {
  alt?: string;
  src: string;
  width?: number;
  height?: number;
}

const OptimisedImage: FC<Props> = ({ alt, src, width = 600, height }) => {
  const isGif = src.endsWith('.gif');

  return (
    <>
      {isGif ? (
        <GifPlayer gifUrl={src} alt={alt} width={width} height={height} />
      ) : (
        <StaticImage imgUrl={src} alt={alt} width={width} height={height} />
      )}
    </>
  );
};

export default OptimisedImage;

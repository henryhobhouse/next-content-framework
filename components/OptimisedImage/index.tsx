import React, { FC } from 'react';

import GifPlayer from '../GifPlayer';

import StaticImage from './StaticImage';

interface Props {
  alt?: string;
  src: string;
}

const OptimisedImage: FC<Props> = ({ alt, src }) => {
  const isGif = src.endsWith('.gif');

  return (
    <>
      {isGif ? (
        <GifPlayer gifUrl={src} alt={alt} />
      ) : (
        <StaticImage imgUrl={src} alt={alt} />
      )}
    </>
  );
};

export default OptimisedImage;

import React, { FC } from 'react';
import Img from 'react-optimized-image';
import styled from 'styled-components';

import GifPlayer from '../GifPlayer';

import StaticImage from './StaticImage';

interface Props {
  alt?: string;
  src: string;
}

export const FullImage = styled(Img)`
  position: absolute;
  top: 0;
  left: 0;
`;

export const ImageContainer = styled.span`
  position: relative;
  width: 600px;
`;

const OptimisedImage: FC<Props> = ({ alt, src }) => {
  const isGif = src.endsWith('.gif');

  return (
    <ImageContainer>
      {isGif ? (
        <GifPlayer gifUrl={src} alt={alt} />
      ) : (
        <StaticImage imgUrl={src} alt={alt} />
      )}
    </ImageContainer>
  );
};

export default OptimisedImage;

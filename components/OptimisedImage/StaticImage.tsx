/* eslint-disable @typescript-eslint/no-var-requires */
import React, { FC, useState } from 'react';
import styled, { css } from 'styled-components';

import { articleImageSize } from 'lib/mdx/mdx-parse';

const BlurredImage = styled.img<{ $imageLoaded: boolean }>`
  width: 600px;
  position: relative;
  transition: opacity 500ms ease;
  bottom: 0;
  left: 0;
  opacity: 1;
  z-index: 1;
  ${({ $imageLoaded }) =>
    $imageLoaded &&
    css`
      opacity: 0;
    `}
`;

const FullImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 600px;
  min-width: 600px;
`;

const ImageContainer = styled.div`
  position: relative;
  display: block;
  width: 600px;
  padding-bottom: 20px;
`;

interface StaticImageProps {
  imgUrl: string;
  alt?: string;
}

const StaticImage: FC<StaticImageProps> = ({ imgUrl, alt }) => {
  const [imageLoading, setImageLoading] = useState(true);

  // TODO: add BlurrImage back once image optimisation script is done.
  return (
    <ImageContainer>
      <BlurredImage
        src={require(`../../images/20/${imgUrl}`).default}
        $imageLoaded={!imageLoading}
      />

      <FullImage
        src={`/${articleImageSize}/${imgUrl}`}
        alt={alt}
        onLoad={() => setImageLoading(false)}
        loading="lazy"
      />
    </ImageContainer>
  );
};

export default StaticImage;

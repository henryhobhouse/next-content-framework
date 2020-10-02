/* eslint-disable @typescript-eslint/no-var-requires */
import React, { FC, useState } from 'react';
import styled, { css } from 'styled-components';

const BlurredImage = styled.img<{ $imageLoaded: boolean }>`
  position: relative;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  top: 0;
  left: 0;
  opacity: 1;
  width: 600px;
  z-index: 1;
  transition: opacity 500ms ease-in;
  ${({ $imageLoaded }) =>
    $imageLoaded &&
    css`
      opacity: 0;
    `}
`;

const FullImage = styled.img`
  display: flex;
  top: 0;
  left: 0;
  width: 600px;
  z-index: 0;
  min-width: 600px;
`;

const ImageContainer = styled.div`
  display: flex;
  width: 600px;
  margin: 0;
  min-width: 600px;
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
      {/* <BlurredImage
        src={require(`../../content/${imgUrl}`).default}
        alt={alt}
        $imageLoaded={!imageLoading}
      /> */}
      <FullImage
        src={require(`../../content/${imgUrl}`).default}
        alt={alt}
        onLoad={() => setImageLoading(false)}
      />
    </ImageContainer>
  );
};

export default StaticImage;

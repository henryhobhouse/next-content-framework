import React, { FC, useState } from 'react';
import Img from 'react-optimized-image';
import styled, { css } from 'styled-components';

const BlurredImage = styled(Img)<{ $imageLoaded: boolean }>`
  position: relative;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  top: 0;
  left: 0;
  opacity: 1;
  width: 600px;
  transition: opacity 500ms ease-in;
  ${({ $imageLoaded }) =>
    $imageLoaded &&
    css`
      opacity: 0;
    `}
`;

const FullImage = styled(Img)`
  display: flex;
  top: 0;
  left: 0;
  width: 600px;
`;

const ImageContainer = styled.div`
  display: flex;
  width: 600px;
  margin: 0;
`;

interface StaticImageProps {
  imgUrl: string;
  alt?: string;
}

const StaticImage: FC<StaticImageProps> = ({ imgUrl, alt }) => {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <ImageContainer>
      <BlurredImage
        src={require(`../../content/${imgUrl}`)}
        alt={alt}
        sizes={[20]}
        $imageLoaded={!imageLoading}
      />

      <FullImage
        src={require(`../../content/${imgUrl}`)}
        alt={alt}
        sizes={[600]}
        onLoad={() => setImageLoading(false)}
      />
    </ImageContainer>
  );
};

export default StaticImage;

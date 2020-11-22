/* eslint-disable @typescript-eslint/no-var-requires */
import Image from 'next/image';
import { FC, useState } from 'react';
import styled, { css } from 'styled-components';

const BlurredImage = styled.img<{ $imageLoaded: boolean }>`
  transition: opacity 500ms ease;

  opacity: 1;
  z-index: 1;
  ${({ $imageLoaded }) =>
    $imageLoaded &&
    css`
      opacity: 0;
    `}
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;

const FullImage = styled(Image)`
  bottom: 0;
  left: 0;
`;

const ImageContainer = styled.div`
  position: relative;
  display: block;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 20px;
`;

interface StaticImageProps {
  imgUrl: string;
  alt?: string;
  width: number;
  height?: number;
}

const StaticImage: FC<StaticImageProps> = ({ imgUrl, alt, width, height }) => {
  const [imageLoading, setImageLoading] = useState(true);

  if (!imgUrl) return null;

  const imageWidth = width && width < 599 ? width : 600;

  const imageHeight = height ? imageWidth / (width / height) : 300;

  return (
    <ImageContainer>
      <BlurredImage
        src={`/documentation/20/${imgUrl}`}
        $imageLoaded={!imageLoading}
        width={imageWidth}
        height={imageHeight}
        loading="eager"
      />

      <FullImage
        src={`/documentation/originals/${imgUrl}`}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        onLoad={() => setImageLoading(false)}
        loading="lazy"
      />
    </ImageContainer>
  );
};

export default StaticImage;

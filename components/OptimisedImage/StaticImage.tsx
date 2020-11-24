/* eslint-disable @typescript-eslint/no-var-requires */
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { lazyLoadImageSize, rootImageDirectory } from 'lib/page-mdx/mdx-parse';

const BlurredImage = styled.img<{ $imageLoaded: boolean; $maxWidth: number }>`
  transition: opacity 500ms ease;
  position: absolute;
  top: 0;
  opacity: 1;
  z-index: 1;
  ${({ $imageLoaded }) =>
    $imageLoaded &&
    css`
      opacity: 0;
    `}
  width: 100%;
  height: 100%;
  padding-bottom: 20px;
  box-sizing: border-box;
  max-width: ${({ $maxWidth }) => `${$maxWidth}px`};
  display: block;
`;

const FullImage = styled(Image)`
  bottom: 0;
  left: 0;
`;

const ImageContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  margin: 0px;
  padding-bottom: 20px;
  min-width: 100%;
  max-width: 100%;
`;

interface StaticImageProps {
  imgUrl: string;
  alt?: string;
  width: number;
  height?: number;
}

const StaticImage: FC<StaticImageProps> = ({ imgUrl, alt, width, height }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [loadEvents, setLoadEvents] = useState(0);

  useEffect(() => {
    // images are loaded twice with next's lazy loading implementation. The first
    // to put a transparent place holder on load. The second to download actual image
    // when it comes into the viewport. We only want to remove the thumbnail on the
    // second event.
    if (loadEvents >= 2) {
      setImageLoading(false);
    }
  }, [loadEvents]);

  if (!imgUrl) return null;

  const imageWidth = width && width < 599 ? width : 600;

  const imageHeight = height ? imageWidth / (width / height) : 300;

  return (
    <ImageContainer>
      <BlurredImage
        src={`/documentation/${lazyLoadImageSize}/${imgUrl}`}
        $imageLoaded={!imageLoading}
        aria-hidden={true}
        $maxWidth={imageWidth}
        role="presentation"
        loading="eager"
      />

      <FullImage
        src={`/documentation/${rootImageDirectory}/${imgUrl}`}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        onLoad={() => setLoadEvents((prevEvents) => prevEvents + 1)}
        loading="lazy"
      />
    </ImageContainer>
  );
};

export default StaticImage;

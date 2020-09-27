import React, { FC, useState } from 'react';
import Img from 'react-optimized-image';
import styled, { css } from 'styled-components';

import { ImageContainer } from '.';

const BlurredImage = styled.img<{ $imageLoaded: boolean }>`
  position: absolute;
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
  position: absolute;
  top: 0;
  left: 0;
  width: 600px;
`;

interface StaticImageProps {
  imgUrl: string;
  alt?: string;
}

const StaticImage: FC<StaticImageProps> = ({ imgUrl, alt }) => {
  const [imageLoading, setImageLoading] = useState(true);

  const styles = {
    lqip: {
      filter: 'blur(10px)',
    },
  };

  return (
    <ImageContainer>
      <BlurredImage
        src={require(`../../content/${imgUrl}?lqip?resize&size=600`)}
        alt={alt}
        style={styles.lqip}
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

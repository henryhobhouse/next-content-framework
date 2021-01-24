/* eslint-disable @typescript-eslint/no-var-requires */
import Image from 'next/image';
import React, { useState, FC, HTMLAttributes, useCallback } from 'react';

import useGifFirstFrame from '../../lib/hooks/use-gif-first-frame';

import { GifWrapper, PlayButton, FirstFrameImage } from './gif-player.sc';

import { rootImageDirectory } from 'lib/next-static-server/mdx-parse';

interface Props extends HTMLAttributes<HTMLImageElement> {
  gifUrl: string;
  alt?: string;
  width: number;
  height?: number;
}

const GifPlayerContainer: FC<Props> = ({ gifUrl, alt, width, height }) => {
  const [isPlaying, setPlaying] = useState(false);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  const gifRelativePath = `/documentation/${rootImageDirectory}/${gifUrl}`;

  const { firstFrameImage } = useGifFirstFrame(gifRelativePath);

  const togglePlay = useCallback(() => {
    setPlaying((prevPlaying) => !prevPlaying);
  }, [setPlaying]);

  if (!width || !height) return null;

  // TODO: set article width as single constant in the article component so this updates
  // automatically if ever changed.
  const imageWithinArticleWidth = width <= 600;

  // if image is less than article width then to use orginal width. Otherwise limit to
  // 600px
  const imageWidth = imageWithinArticleWidth ? width : 600;

  const imageHeight = imageWithinArticleWidth
    ? height
    : Math.round(imageWidth / (width / height));

  return (
    <GifWrapper onClick={togglePlay} $height={imageHeight} $width={imageWidth}>
      {firstFrameLoaded && <PlayButton $playing={isPlaying}>GIF</PlayButton>}
      {isPlaying ? (
        <Image
          src={gifRelativePath}
          alt={alt}
          width={imageWidth}
          height={imageHeight}
        />
      ) : (
        <FirstFrameImage
          src={firstFrameImage}
          alt={alt}
          width={imageWidth}
          height={imageHeight}
          onLoad={() => setFirstFrameLoaded(true)}
          loading="eager"
        />
      )}
    </GifWrapper>
  );
};

export default GifPlayerContainer;

/* eslint-disable @typescript-eslint/no-var-requires */
import Image from 'next/image';
import React, { useState, FC, HTMLAttributes, useCallback } from 'react';

import useGifFirstFrame from '../../lib/hooks/use-gif-first-frame';

import { GifWrapper, PlayButton } from './gif-player.sc';

import { rootImageDirectory } from 'lib/page-mdx/mdx-parse';

interface Props extends HTMLAttributes<HTMLImageElement> {
  gifUrl: string;
  alt?: string;
  width: number;
  height?: number;
}

const GifPlayerContainer: FC<Props> = ({ gifUrl, alt, width, height }) => {
  const [playing, setPlaying] = useState(false);

  const imageWidth = width && width < 599 ? width : 600;

  const imageHeight = height ? imageWidth / (width / height) : 300;

  const gifRelativePath = `/documentation/${rootImageDirectory}/${gifUrl}`;

  const { firstFrameImage } = useGifFirstFrame(gifRelativePath);

  const togglePlay = useCallback(() => {
    setPlaying((prevPlaying) => !prevPlaying);
  }, [setPlaying]);

  return (
    <GifWrapper onClick={togglePlay} $height={imageHeight} $width={imageWidth}>
      <PlayButton $playing={playing}>GIF</PlayButton>
      {playing ? (
        <Image
          src={gifRelativePath}
          alt={alt}
          width={imageWidth}
          height={imageHeight}
        />
      ) : (
        <img
          src={firstFrameImage}
          alt={alt}
          width={imageWidth}
          height={imageHeight}
          loading="lazy"
        />
      )}
    </GifWrapper>
  );
};

export default GifPlayerContainer;

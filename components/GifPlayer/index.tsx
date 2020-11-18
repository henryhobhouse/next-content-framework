/* eslint-disable @typescript-eslint/no-var-requires */
import Image from 'next/image';
import React, {
  useState,
  FC,
  HTMLAttributes,
  useCallback,
  useEffect,
} from 'react';

import useGifFirstFrame from '../../lib/hooks/use-gif-first-frame';

import { GifWrapper, PlayButton } from './gif-player.sc';

interface Props extends HTMLAttributes<HTMLImageElement> {
  gifUrl: string;
  alt?: string;
  width: number;
  height?: number;
}

const GifPlayerContainer: FC<Props> = ({ gifUrl, alt, width, height }) => {
  const [playing, setPlaying] = useState(false);
  const [imageHeight, setImageHeight] = useState<number>();
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>();

  useEffect(() => {
    // if greater than height of play button set it to wrapper
    if (imageRef?.height && imageRef?.height > 56) {
      setImageHeight(imageRef?.height);
    }
  }, [imageRef?.height]);

  const gifRelativePath = `/documentation/originals/${gifUrl}`;

  const { firstFrameImage } = useGifFirstFrame(gifRelativePath);

  const togglePlay = useCallback(() => {
    setPlaying((prevPlaying) => !prevPlaying);
  }, [setPlaying]);

  return (
    <GifWrapper
      onClick={togglePlay}
      $height={height ?? imageHeight}
      $width={width}
    >
      <PlayButton $playing={playing}>GIF</PlayButton>
      {playing ? (
        <Image src={gifRelativePath} alt={alt} width={width} height={300} />
      ) : (
        <img
          src={firstFrameImage}
          alt={alt}
          ref={setImageRef}
          width={width}
          height={height}
          loading="lazy"
        />
      )}
    </GifWrapper>
  );
};

export default GifPlayerContainer;

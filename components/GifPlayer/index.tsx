import React, { useState, FC, HTMLAttributes, useCallback } from 'react';
import Img from 'react-optimized-image';

import useGifFirstFrame from '../../lib/hooks/use-gif-first-frame';

import { GifWrapper, PlayButton } from './gif-player.sc';

interface Props extends HTMLAttributes<HTMLImageElement> {
  gifUrl: string;
  alt?: string;
}

const GifPlayerContainer: FC<Props> = ({ gifUrl, alt }) => {
  const [playing, setPlaying] = useState(false);

  const { firstFrameImage } = useGifFirstFrame(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(`../../content/${gifUrl}`),
  );

  const togglePlay = useCallback(() => {
    setPlaying((prevPlaying) => !prevPlaying);
  }, [setPlaying]);

  return (
    <GifWrapper onClick={togglePlay}>
      <PlayButton $playing={playing}>GIF</PlayButton>
      {playing ? (
        <Img src={require(`../../content/${gifUrl}`)} sizes={[600]} alt={alt} />
      ) : (
        <img src={firstFrameImage} alt={alt} />
      )}
    </GifWrapper>
  );
};

export default GifPlayerContainer;

import React, {
  useState,
  FC,
  HTMLAttributes,
  useCallback,
  useEffect,
} from 'react';
import Img from 'react-optimized-image';

import useGifFirstFrame from '../../lib/hooks/use-gif-first-frame';

import { GifWrapper, PlayButton } from './gif-player.sc';

interface Props extends HTMLAttributes<HTMLImageElement> {
  gifUrl: string;
  alt?: string;
}

const GifPlayerContainer: FC<Props> = ({ gifUrl, alt }) => {
  const [playing, setPlaying] = useState(false);
  const [imageHeight, setImageHeight] = useState<number>();
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>();

  useEffect(() => {
    // if greater than height of play button set it to wrapper
    if (imageRef?.height && imageRef?.height > 56) {
      setImageHeight(imageRef?.height);
    }
  }, [imageRef?.height]);

  const { firstFrameImage } = useGifFirstFrame(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(`../../content/${gifUrl}`),
  );

  const togglePlay = useCallback(() => {
    setPlaying((prevPlaying) => !prevPlaying);
  }, [setPlaying]);

  return (
    <GifWrapper onClick={togglePlay} $height={imageHeight}>
      <PlayButton $playing={playing}>GIF</PlayButton>
      {playing ? (
        <Img src={require(`../../content/${gifUrl}`)} sizes={[600]} alt={alt} />
      ) : (
        <img src={firstFrameImage} alt={alt} ref={setImageRef} />
      )}
    </GifWrapper>
  );
};

export default GifPlayerContainer;

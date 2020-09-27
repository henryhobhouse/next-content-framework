import React, { useState, FC, HTMLAttributes, useCallback } from 'react';
import Img from 'react-optimized-image';

import withStyles, { CNFunction } from '../../lib/hocs/with-styles';
import useGifFirstFrame from '../../lib/hooks/use-gif-first-frame';

import styles from './style.module.scss';

interface Props extends HTMLAttributes<HTMLImageElement> {
  gifUrl: string;
  cn: CNFunction;
  alt?: string;
}

const GifPlayerContainer: FC<Props> = ({ gifUrl, cn, alt, ...other }) => {
  const [playing, setPlaying] = useState(false);

  const { firstFrameImage } = useGifFirstFrame(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(`../../content/${gifUrl}`),
  );

  const togglePlay = useCallback(() => {
    setPlaying((prevPlaying) => !prevPlaying);
  }, [setPlaying]);

  return (
    <span className={cn('gif_player', { playing })} onClick={togglePlay}>
      <span className={cn('play_button')} />
      {playing ? (
        <Img
          sizes={[600]}
          src={require(`../../content/${gifUrl}`)}
          alt={alt}
          {...other}
        />
      ) : (
        <img src={firstFrameImage} alt={alt} />
      )}
    </span>
  );
};

export default withStyles(styles)(GifPlayerContainer);

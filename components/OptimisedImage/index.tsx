import React, { FC, useState } from 'react';
import styled from 'styled-components';

interface Props {
  alt?: string;
  src: string;
}

const BlurredImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 600px;
  transition: opacity 500ms ease-in;
`;

const FullImage = styled.img`
  width: 100%;
`;

const OptimisedImage: FC<Props> = ({ alt, src }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const styles = {
    lqip: {
      filter: 'blur(10px)',
    },
  };

  return (
    <div>
      {!imageLoaded && (
        <BlurredImage
          src={require(`../../content/platform/10.top-two/05.mid-one/${src}?lqip?resize&size=600`)}
          alt={alt}
          style={styles.lqip}
        />
      )}

      <FullImage
        src={require(`../../content/platform/10.top-two/05.mid-one/${src}?resize&size=600`)}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};

export default OptimisedImage;

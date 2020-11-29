import styled, { css } from 'styled-components';

export const GifWrapper = styled.div<{ $height?: number; $width: number }>`
  display: block;
  position: relative;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  margin-left: auto;
  margin-right: auto;
  width: ${({ $width }) => `${$width}px`};
  height: ${({ $height }) => `${$height}px`};

  img {
    ${({ $height }) =>
      $height &&
      css`
        height: ${$height}px;
      `}
  }
`;

export const FirstFrameImage = styled.img`
  max-width: 100%;
  display: block;
`;

export const PlayButton = styled.div<{ $playing: boolean }>`
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px dashed #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.7);
  color: #fff;
  cursor: pointer;
  font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
  font-size: 24px;
  left: 50%;
  opacity: 1;
  padding: 14px 14px;
  position: absolute;
  font-weight: 400;
  top: 50%;
  transform: translate(-50%, -50%) scale(1) rotate(0deg);
  transition: transform 0.4s, opacity 0.4s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.7);
  }

  ${({ $playing }) =>
    $playing &&
    css`
      transform: translate(-50%, -50%) scale(0) rotate(180deg);
      opacity: 0.5;
    `}
`;

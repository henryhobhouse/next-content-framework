import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  html {
    font-weight: 400;
    height: 100%;
    margin: 0;
  }
  body {
    margin: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    height: 100vh;
    font-size: 14px;
    color: #0b0e35;
    font-family: -apple-system, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
    line-height: 1.5;
    background: #f1f1f7;
  }

  #__next {
    height: 100%;
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }

  p {
    line-height: 1.5rem;
    font-weight: 300;
    margin-bottom: 1rem;
    color: #0a0d36;

    & strong {
      color: #0a0d36;
    }
  }

  hr {
    background: black;
    opacity: 0.1;
    margin: 2rem 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    outline: none;
    font-weight: 600;
    color: #0a0d36;
    letter-spacing: -1px;
  }

  h1 {
    font-size: 2.369rem;
    margin-bottom: 0.422rem;
  }

  h2 {
    font-size: 1.75rem;
    margin: 1.143rem 0;
    padding-top: 1.143rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 1.333em;
    margin: 1.5em 0 0.75em;
  }
`;

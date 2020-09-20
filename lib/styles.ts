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
`;

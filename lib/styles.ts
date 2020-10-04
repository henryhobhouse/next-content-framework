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
    margin-top: 0;

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

  code, pre {
    font-family: 'Inconsolata', monospace;
    background-color: rgba(41,40,69,1);
    color: #E9C062;
    padding: .2em .45em;
    border-radius: .3em;
    font-size: 0.9em;
    vertical-align: middle;
  }

  code {
      white-space: pre-wrap;
  }

  pre[class*="language-"] {
    font-family: 'Inconsolata', monospace;
    direction: ltr;
    text-align: left;
    white-space: pre;
    word-spacing: 0;
    word-break: normal;
    position: relative;
    line-height: 1.5;
    background-color: rgba(41,40,69,1);
    color: rgba(246,119,0,1);
    border-radius: 5px;
    padding: 16px 24px;
    overflow: auto;
  }

  code[class*="language-"]{
    background-color: transparent;
  }

  .token.comment{
    color: rgba(184,184,199,1);

  }

  .token.prolog{
    color: #777777;

  }

  .token.doctype{
    color: #777777;

  }

  .token.cdata{
    color: #777777;

  }

  .token.tag{
    color: rgba(255,255,255,1);

  }

  .language-markup .token.tag{
    color: #CF6A4C;

  }

  .token.entity{
    color: rgba(102,66,11,1);

  }

  .token.atrule{
    color: #7587A6;

  }

  .token.url{
    color: #8F9D6A;

  }

  .token.selector{
    color: #F9EE98;

  }

  .token.string{
    color: rgba(255,178,42,1);

  }

  .language-markup .token.string{
    color: #8F9D6A;

  }

  .token.property{
    color: rgba(252,74,186,1);

  }

  .token.important{
    color: #E9C062;
    font-weight: bold;

  }

  .token.punctuation{
    color: #ffffff;
  }

  .token.number{
    color: rgba(9,192,115,1);

  }

  .token.keyword{
    color: rgba(93,161,248,1);

  }

  .token.boolean{
    color: #CF6A4C;

  }

  .token.operator{
    color: rgba(250,59,45,1);

  }

  .token.char{
    color: #8F9D6A;

  }

  .token.regex{
    color: #E9C062;

  }

  .token.variable{
    color: rgba(73,204,148,1);

  }

  .token.constant{
    color: #F9EE98;

  }

  .token.symbol{
    color: #F9EE98;

  }

  .token.builtin{
    color: #F9EE98;

  }

  .token.attr-value{
    color: #8F9D6A;

  }

  .token.deleted{
    color: #CF6A4C;

  }

  .token.inserted{
    color: #8F9D6A;

  }

  .token.namespace{
    opacity: 0.7;

  }

  .token.bold{
    font-weight: bold;

  }

  .token.italic{
    font-style: italic;

  }

  .token.tag .punctuation{
    color: #ffffff;

  }

  .token.tag .tag .punctuation{
    color: #ffffff;
  }
`;

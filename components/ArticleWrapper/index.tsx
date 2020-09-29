import styled from 'styled-components';

const ArticleWrapper = styled.div`
  padding-bottom: 150px;
  padding-top: 2.5rem;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  line-height: 1.5rem;
  color: #0a0d36;
  box-sizing: border-box;
  max-width: 37.5rem;
  width: 100%;

  p {
    line-height: 1.5rem;
    font-weight: 300;
    margin-bottom: 1rem;
    color: #0a0d36;

    & strong {
      color: #0a0d36;
    }
  }

  span {
    margin-bottom: 1rem;
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

export default ArticleWrapper;

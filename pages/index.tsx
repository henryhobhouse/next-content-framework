import React from 'react';
import styled from 'styled-components';

const LinkWrapper = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    padding-bottom: 30px;
  }
`;

/**
 * Entry (home) page for the app
 */
const Home = () => <LinkWrapper>This is the home page!</LinkWrapper>;

export default Home;

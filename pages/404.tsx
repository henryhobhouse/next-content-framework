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
const Home = () => <LinkWrapper>Uh Oh this is the 404 page</LinkWrapper>;

export async function getStaticProps() {
  return { props: {} };
}

export default Home;

import React, { FC } from 'react';
import styled from 'styled-components';

import DocsHead from 'components/DocsHead';
import { AlgoliaConnectorHit } from 'lib/node/algolia/types';
import getHomepageData from 'lib/page-mdx/page-fetching/get-homepage-data';

const LinkWrapper = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    padding-bottom: 30px;
  }
`;

interface Props {
  algoliaConnectors: AlgoliaConnectorHit[];
}

/**
 * Entry (home) page for the app
 */
const Home: FC<Props> = ({ algoliaConnectors }) => (
  <>
    <DocsHead />
    {algoliaConnectors.map((connector) => (
      <div>{connector.title}</div>
    ))}
    <LinkWrapper>This is the home page!</LinkWrapper>
  </>
);

export default Home;

export const getStaticProps = async () => {
  const propsData = await getHomepageData();

  return {
    props: {
      algoliaConnectors: propsData?.algoliaConnectors,
    },
  };
};

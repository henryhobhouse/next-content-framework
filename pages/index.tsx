import React, { FC } from 'react';
import styled from 'styled-components';

import DocsHead from 'components/DocsHead';
import getHomepageData from 'lib/next-static-server/page-fetching/get-homepage-data';
import { AlgoliaConnectorHit } from 'lib/server/algolia/types';

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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {algoliaConnectors.map((connector) => (
        <div key={connector.id}>{connector.title}</div>
      ))}
    </div>
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

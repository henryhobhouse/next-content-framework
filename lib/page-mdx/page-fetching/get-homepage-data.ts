import algoliaSearch from 'algoliasearch';

import { AlgoliaConnectorHit } from 'lib/node/algolia/types';

const connectorsIndexName = process.env.ALGOLIA_CONNECTORS_INDEX_NAME;
const topArticlesIndexName = process.env.ALGOLIA_TOP_ARTICLES_INDEX_NAME;
const algoliaAppId = process.env.ALGOLIA_APP_ID;
const algoliaAppKey = process.env.ALGOLIA_API_KEY;

const getHomepageData = async () => {
  if (
    !algoliaAppKey ||
    !algoliaAppId ||
    !connectorsIndexName ||
    !topArticlesIndexName
  )
    return;
  const searchClient = algoliaSearch(algoliaAppId, algoliaAppKey);
  const connectorsIndex = searchClient.initIndex(connectorsIndexName);
  // const topArticlesIndex = searchClient.initIndex(topArticlesIndexName);

  const connectorsResults = await connectorsIndex.search<AlgoliaConnectorHit>(
    '',
  );
  // const topArticlesResults = await topArticlesIndex.search('');

  return {
    algoliaConnectors: connectorsResults.hits,
    // algoliaTopArticles: topArticlesResults.hits,
  };
};

export default getHomepageData;

import algoliasearch from 'algoliasearch';
import chunk from 'lodash/chunk';
import {
  UpdateIndexOptions,
  SearchHit,
  TransformedObject,
} from '../types/algolia';

import {
  getFilteredNodes,
  getIndexToUse,
  getSettingsToApply,
  moveIndex,
} from './algolia-index-utils';

const algoliaAppId = process.env.ALGOLIA_APP_ID;
const algoliaApiKey = process.env.ALGOLIA_API_KEY;
const isProduction = process.env.NODE_ENV === 'production';

const updateAlgoliaArticleIndex = async ({
  allNodesData,
  indexQueries,
  enablePartialUpdates = false,
  chunkSize = 1000,
}: UpdateIndexOptions) => {
  if (!isProduction || !allNodesData.length) return;

  if (!algoliaApiKey || !algoliaAppId) {
    throw new Error(
      '"ALGOLIA_APP_ID" or "ALGOLIA_API_KEY" not added to env variables',
    );
  }

  logger.info(`Updating ${indexQueries.length} Algolia Indexes`);

  const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);

  await Promise.all(
    indexQueries.map(async (indexQuery) => {
      const { indexName, transformer } = indexQuery;

      if (!indexName) {
        logger.error('algolia index name is missing');
        return;
      }

      const index = algoliaClient.initIndex(indexName);
      const tempIndex = algoliaClient.initIndex(`${indexName}_tmp`);

      const indexToUse = await getIndexToUse({
        index,
        tempIndex,
        enablePartialUpdates,
      });

      /* Use to keep track of what to remove afterwards */
      const toRemove: { [keyof: string]: SearchHit | boolean } = {};

      const nodesToIndex = getFilteredNodes(indexQuery, allNodesData);

      const nodeObjects = (await transformer(nodesToIndex)).map((object) => ({
        objectID: object.id,
        ...object,
      })) as (TransformedObject & { objectID: string })[];

      logger.info(
        `Index query for ${indexQuery.indexName} has resulted in ${nodeObjects.length} results`,
      );

      if (nodeObjects.length) {
        const chunks = chunk(nodeObjects, chunkSize);

        logger.info(`Splitting in ${chunks.length} jobs`);

        /* Add changed / new objects */
        const chunkJobs = chunks.map(async (chunked) => {
          await indexToUse.saveObjects(chunked);
        });

        await Promise.all(chunkJobs);
      } else {
        logger.info('No changes; skipping');
      }

      if (indexQuery.settings) {
        const settingsToApply = await getSettingsToApply({
          settings: indexQuery.settings,
          index,
        });

        const { taskID } = await indexToUse.setSettings(settingsToApply);

        await indexToUse.waitTask(taskID);
      }

      if (indexToUse === tempIndex) {
        logger.info('Moving copied index to main index...');
        await moveIndex(algoliaClient, indexToUse, index);
      }

      logger.log('success', `Algolia Index updated: Done!`);

      // eslint-disable-next-line consistent-return
      return {
        index,
        toRemove,
      };
    }),
  );
};

export default updateAlgoliaArticleIndex;

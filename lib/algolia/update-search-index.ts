import algoliasearch from 'algoliasearch';
import chunk from 'lodash/chunk';
import ora from 'ora';

import {
  fetchAlgoliaNodes,
  getFilteredNodes,
  getIndexToUse,
  getSettingsToApply,
  moveIndex,
} from './algolia-index-utils';
import { UpdateIndexOptions, SearchHit, TransformedObject } from './types';

export const spinner = ora();
const algoliaAppId = process.env.ALGOLIA_APP_ID;
const algoliaApiKey = process.env.ALGOLIA_API_KEY;
const isProduction = process.env.NODE_ENV === 'production';

const updateAlgoliaArticleIndex = async ({
  allNodesData,
  indexQueries,
  enablePartialUpdates = true,
  chunkSize = 1000,
}: UpdateIndexOptions) => {
  if (!isProduction) return;
  if (!algoliaApiKey || !algoliaAppId) {
    throw new Error(
      '"ALGOLIA_APP_ID" or "ALGOLIA_API_KEY" not added to env variables',
    );
  }
  spinner.info(`Updating ${indexQueries.length} Algolia Indexes`);
  const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);
  await Promise.all(
    indexQueries.map(async (indexQuery) => {
      const { indexName, transformer, matchFields = [] } = indexQuery;

      if (!indexName) {
        spinner.fail('algolia index name is missing');
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

      spinner.info(
        `Index query for ${indexQuery.indexName} has resulted in ${nodeObjects.length} results`,
      );

      let hasChanged = nodeObjects;
      if (enablePartialUpdates) {
        spinner.info(`Starting Partial updates...`);

        const algoliaNodes = await fetchAlgoliaNodes(indexToUse, matchFields);

        const nbMatchedRecords = Object.keys(algoliaNodes).length;
        spinner.info(`Found ${nbMatchedRecords} existing records`);

        if (nbMatchedRecords) {
          hasChanged = nodeObjects.filter((currentNode) => {
            if (
              matchFields.length &&
              matchFields.every(
                (field) => Boolean(currentNode[field]) === false,
              )
            ) {
              spinner.fail(
                'when enablePartialUpdates is true, the objects must have at least one of the match fields. Current object:\n' +
                  JSON.stringify(currentNode, null, 2) +
                  '\n' +
                  'expected one of these fields:\n' +
                  matchFields.join('\n'),
              );
            }

            const nodeId = currentNode.objectID;
            const algoliaNode = algoliaNodes[nodeId];

            /* The object exists so we don't need to remove it from Algolia */
            delete algoliaNodes[nodeId];
            delete toRemove[nodeId];

            if (!algoliaNode) return true;

            return matchFields.some(
              (field) => algoliaNode[field] !== currentNode[field],
            );
          });

          Object.keys(algoliaNodes).forEach((objectID) => {
            // if the object has one of the matchFields, it should be removed,
            // but objects without matchFields are considered "not controlled"
            // and stay in the index
            if (matchFields.some((field) => algoliaNodes[objectID][field])) {
              toRemove[objectID] = true;
            }
          });
        }

        spinner.info(
          `Partial updates – [insert/update: ${hasChanged.length}, total: ${nodeObjects.length}]`,
        );
      }

      if (hasChanged.length) {
        const chunks = chunk(hasChanged, chunkSize);

        spinner.info(`Splitting in ${chunks.length} jobs`);

        /* Add changed / new objects */
        const chunkJobs = chunks.map(async (chunked) => {
          await indexToUse.saveObjects(chunked);
        });

        await Promise.all(chunkJobs);
      } else {
        spinner.info('No changes; skipping');
      }

      if (indexQuery.settings) {
        const settingsToApply = await getSettingsToApply({
          settings: indexQuery.settings,
          index,
          spinner,
        });

        const { taskID } = await indexToUse.setSettings(settingsToApply);

        await indexToUse.waitTask(taskID);
      }

      if (indexToUse === tempIndex) {
        spinner.info('Moving copied index to main index...');
        await moveIndex(algoliaClient, indexToUse, index);
      }

      spinner.info('Done!');

      return {
        index,
        toRemove,
      };
    }),
  );
};

export default updateAlgoliaArticleIndex;

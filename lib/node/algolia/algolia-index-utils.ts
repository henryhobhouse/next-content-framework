import { Settings, SearchOptions } from '@algolia/client-search';
import { SearchIndex, SearchClient } from 'algoliasearch';

import { NodeData } from '../mdx-meta/recursive-parse-mdx';

import { SearchHit, IndexQuery } from './types';

/**
 * Does an Algolia index exist already
 *
 * @param index
 */
const indexExists = (index: SearchIndex) =>
  index
    .getSettings()
    .then(() => true)
    .catch((error) => {
      if (error.statusCode !== 404) {
        throw error;
      }

      return false;
    });

const createIndex = async (index: SearchIndex) => {
  const { taskID } = await index.setSettings({});
  await index.waitTask(taskID);
  return index;
};

interface GetIndexToUseProps {
  index: SearchIndex;
  tempIndex: SearchIndex;
  enablePartialUpdates: boolean;
}

export const getIndexToUse = async ({
  index,
  tempIndex,
  enablePartialUpdates,
}: GetIndexToUseProps) => {
  const mainIndexExists = await indexExists(index);

  if (enablePartialUpdates && !mainIndexExists) {
    return createIndex(index);
  }

  if (!enablePartialUpdates && mainIndexExists) {
    return tempIndex;
  }

  return index;
};

/**
 * moves the source index to the target index
 */
export const moveIndex = async (
  client: SearchClient,
  sourceIndex: SearchIndex,
  targetIndex: SearchIndex,
) => {
  const { taskID } = await client.moveIndex(
    sourceIndex.indexName,
    targetIndex.indexName,
  );
  return targetIndex.waitTask(taskID);
};

interface GetSettingsToApplyProps {
  settings: Settings;
  index: SearchIndex;
}

export const getSettingsToApply = async ({
  settings,
  index,
}: GetSettingsToApplyProps) => {
  const existingSettings = await index.getSettings().catch((e) => {
    logger.warn(`${e.toString()} ${index.indexName}`);
  });

  const requestedSettings = {
    ...(settings || existingSettings),
  };

  return requestedSettings;
};

/**
 * Fetches all records for the current index from Algolia
 *
 * @param {AlgoliaIndex} index eg. client.initIndex('your_index_name');
 * @param {Array<String>} attributesToRetrieve eg. ['modified', 'slug']
 */
export const fetchAlgoliaNodes = async <T extends SearchHit>(
  index: SearchIndex,
  attributesToRetrieve: SearchOptions['attributesToRetrieve'] = ['modified'],
) => {
  const matchedHits: { [keyof: string]: T } = {};
  await index
    .browseObjects({
      attributesToRetrieve,
      batch: (hits) => {
        if (Array.isArray(hits)) {
          hits.forEach((hit) => {
            matchedHits[hit.objectID] = hit;
          });
        }
      },
    })
    .catch((error) => {
      throw new Error(`Problem getting index objects: ${error.message}`);
    });
  return matchedHits;
};

export const getFilteredNodes = (
  indexQuery: IndexQuery,
  allNodesData: NodeData[],
) => {
  if (!indexQuery.filters) return allNodesData;

  const allFilteredNodes: NodeData[] = [];
  indexQuery.filters.forEach((filter) => {
    const filteredNodes = allNodesData.filter(
      (nodeData) => nodeData[filter.key] === filter.value,
    );
    allFilteredNodes.push(...filteredNodes);
  });
  return allFilteredNodes;
};

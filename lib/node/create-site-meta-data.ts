/* eslint-disable import/no-commonjs */
import algoliaIndexConfigs from './algolia/index-configs';
import updateAlgoliaArticleIndex from './algolia/update-search-index';
import createNavigationConfigs from './mdx-meta/create-navigation-configs';
import createMdxNodeDataModel, {
  NodeData,
} from './mdx-meta/create-mdx-node-data-model';
import initialiseLogger from './logger';
import syncImagesWithPublic, { ImageData } from './copy-images-to-public';
import createSitemap from './mdx-meta/create-sitemap';
import createBreadcrumbs from './mdx-meta/create-breadcrumbs';

const currentWorkingDirectory = process.cwd();
const contentDir = `${currentWorkingDirectory}/content`;
const contentRoots = ['platform', 'embedded', 'images'] as const;

export type ContentRoot = typeof contentRoots[number];

/**
 * Needs to be called as before all the page static API's to populate base data used app wide.
 *
 * Creates:
 *
 * * Sitemap
 * * Side Navigation configs
 * * All required breadcrumbs
 * * Moves images to public directory to be used client side
 * * Updates Algolia indexes
 */

const createSiteMetaData = async () => {
  const allNodesData: NodeData[] = [];
  await initialiseLogger({ metaData: { script: 'create-site-meta-data' } });

  const parsedMdxCallback = async (
    contentRootNodesData: NodeData[],
    contentRoot: string,
    imagesMetaData: ImageData[],
  ) => {
    // for functionality that requires all node data to aggregate into one array.
    allNodesData.push(...contentRootNodesData);

    await syncImagesWithPublic(imagesMetaData);

    await createNavigationConfigs(
      contentRootNodesData,
      contentRoot,
      currentWorkingDirectory,
    );
  };

  await Promise.allSettled(
    contentRoots.map(async (contentRoot) => {
      await createMdxNodeDataModel(
        `${contentDir}/${contentRoot}`,
        contentRoot,
        parsedMdxCallback,
      );
    }),
  );

  await createBreadcrumbs(allNodesData);

  await createSitemap(allNodesData);

  await updateAlgoliaArticleIndex({
    allNodesData,
    indexQueries: algoliaIndexConfigs,
  });
};

// needs to be exported in AMD as next config (which imports it) is in JS
module.exports = createSiteMetaData;

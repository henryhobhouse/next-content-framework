/* eslint-disable import/no-commonjs */
import algoliaIndexConfigs from './algolia/index-configs';
import updateAlgoliaArticleIndex from './algolia/update-search-index';
import createNavigationConfigs from './mdx-meta/create-navigation-configs';
import recursiveParseMdx, { NodeData } from './mdx-meta/recursive-parse-mdx';
import initialiseLogger from './logger';

const basePath = process.cwd();
const contentDir = `${basePath}/content`;
const contentRoots = ['platform', 'embedded'];

const createSiteMetaData = async () => {
  const allNodesData: NodeData[] = [];
  initialiseLogger({ metaData: { script: 'create-site-meta-data' } });

  const parsedMdxCallback = async (
    contentRootNodesData: NodeData[],
    contentRoot: string,
  ) => {
    allNodesData.push(...contentRootNodesData);
    await createNavigationConfigs(contentRootNodesData, contentRoot, basePath);
    await updateAlgoliaArticleIndex({
      allNodesData: contentRootNodesData,
      indexQueries: algoliaIndexConfigs,
    });
    // TODO: Create sitemap
  };

  await Promise.all(
    contentRoots.map(async (contentRoot) => {
      await recursiveParseMdx(
        `${contentDir}/${contentRoot}`,
        contentRoot,
        parsedMdxCallback,
      );
    }),
  );
};

// needs to be exported in AMD as next config (which imports it) is in JS
module.exports = createSiteMetaData;

import recursiveParseMdx, { NodeData } from './mdx/recursive-parse-mdx';
import updateAlgoliaArticleIndex from '../algolia/update-search-index';
import algoliaIndexConfigs from '../algolia/index-configs';
import createNavigationConfigs from './mdx/create-navigation-configs';

const basePath = process.cwd();
const contentDir = `${basePath}/content`;
const contentRoots = ['platform', 'embedded'];

const createSiteMetaData = async () => {
  const allNodesData: NodeData[] = [];

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

module.exports = createSiteMetaData;

import { promises } from 'fs';

import { getNavigationItems } from '../../mdx/mdx-parse';
import recursiveParseMdx, { NodeData } from './recursive-parse-mdx';

const basePath = process.cwd();
const contentDir = `${basePath}/content`;
const contentRoots = ['platform', 'embedded'];

const createNavigationConfigs = async (
  contentRootNodesData: NodeData[],
  contentRoot: string,
) => {
  const articlesForNav = contentRootNodesData
    .filter((nodeData) => nodeData.type !== 'connector')
    .map((nodeData) => ({
      title: nodeData.title,
      slug: nodeData.slug,
      level: nodeData.level,
      order: nodeData.order,
      parentSlug: nodeData.parentSlug,
    }));

  const contentNavStructure = getNavigationItems(articlesForNav);

  await promises.writeFile(
    `${basePath}/lib/build-scripts/${contentRoot}-nav-config.json`,
    JSON.stringify({ config: contentNavStructure }, null, 2),
  );
};

const createSiteMetaData = async () => {
  const allNodesData: NodeData[] = [];

  const parsedMdxCallback = async (
    contentRootNodesData: NodeData[],
    contentRoot: string,
  ) => {
    allNodesData.push(...contentRootNodesData);
    await createNavigationConfigs(contentRootNodesData, contentRoot);
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

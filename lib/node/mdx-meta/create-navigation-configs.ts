import { promises } from 'fs';
import parseFlatNavigationItems from './parse-flat-navigation-items';
import { NodeData } from './recursive-parse-mdx';

/**
 * Callback for recursive parse MDX to create navigation
 * content and write to file system
 */
const createNavigationConfigs = async (
  contentRootNodesData: NodeData[],
  contentRoot: string,
  basePath: string,
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

  const contentNavStructure = parseFlatNavigationItems(articlesForNav);

  await promises.writeFile(
    `${basePath}/lib/node/${contentRoot}-nav-config.json`,
    JSON.stringify({ config: contentNavStructure }, null, 2),
  );
};

export default createNavigationConfigs;

import { promises } from 'fs';
import { getNavigationItems } from '../../mdx/mdx-parse';
import { NodeData } from './recursive-parse-mdx';

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

  const contentNavStructure = getNavigationItems(articlesForNav);

  await promises.writeFile(
    `${basePath}/lib/build-scripts/${contentRoot}-nav-config.json`,
    JSON.stringify({ config: contentNavStructure }, null, 2),
  );
};

export default createNavigationConfigs;

import { promises } from 'fs';
import parseFlatNavigationItems from './parse-flat-navigation-items';
import { NodeData } from './create-mdx-node-data-model';

/**
 * Callback for recursive parse MDX to create navigation
 * content and write to file system
 */
const createNavigationConfigs = async (
  contentRootNodesData: NodeData[],
  contentRoot: string,
  basePath: string,
) => {
  if (contentRoot === 'images') return;
  const articlesForNav = contentRootNodesData
    .filter(
      (nodeData) =>
        nodeData.type !== 'connector' && nodeData.type !== 'connector-list',
    )
    .map((nodeData) => ({
      title: nodeData.title,
      slug: nodeData.slug,
      level: nodeData.level,
      order: nodeData.order,
      parentSlug: nodeData.parentSlug,
    }));

  const contentNavStructure = parseFlatNavigationItems(articlesForNav);

  // This can be removed when connectors are moved to root of content directory
  if (contentRoot === 'platform') {
    const connectorsListForNav = contentRootNodesData
      .filter((nodeData) => nodeData.type === 'connector-list')
      .map((nodeData) => ({
        title: nodeData.title,
        slug: nodeData.slug,
        level: nodeData.level,
        order: nodeData.order,
        parentSlug: nodeData.parentSlug,
      }));

    const connectorNavStructure = parseFlatNavigationItems(
      connectorsListForNav,
    );

    await promises.writeFile(
      `${basePath}/lib/server/connectors-nav-config.json`,
      JSON.stringify({ config: connectorNavStructure }, null, 2),
    );
  }

  await promises.writeFile(
    `${basePath}/lib/server/${contentRoot}-nav-config.json`,
    JSON.stringify({ config: contentNavStructure }, null, 2),
  );
};

export default createNavigationConfigs;

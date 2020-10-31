import { promises } from 'fs';

import { getNavigationItems } from '../../mdx/mdx-parse';
import recursiveParseMdx from './recursive-parse-mdx';

const basePath = process.cwd();
const contentDir = `${basePath}/content`;
const contentRoots = ['platform', 'embedded'];

const createSiteMetaData = async () => {
  await Promise.all(
    contentRoots.map(async (contentRoot) => {
      const articlesForNav = await recursiveParseMdx(
        `${contentDir}/${contentRoot}`,
        contentRoot,
      );

      const contentNavStructure = getNavigationItems(articlesForNav);

      await promises.writeFile(
        `${basePath}/lib/build-scripts/${contentRoot}-nav-config.json`,
        JSON.stringify({ config: contentNavStructure }, null, 2),
      );
    }),
  );
};

module.exports = createSiteMetaData;

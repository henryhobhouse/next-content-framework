import recursiveFindRouteData from './recursive-find-route-data';

import initialiseLogger from 'lib/node/logger';
import { contentRootPath } from 'lib/page-mdx/mdx-parse';
import {
  Resolve,
  MdxRenderedToString,
  TableOfContents,
} from 'lib/page-mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Gets connector section as part of the static pre-render (static compilation by webpack) stage of the build (https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)
 *
 * Recursively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation.
 */
const getConnectorSection = async (
  currentConnectorSection: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  pageContent?: MdxRenderedToString;
  frontMatterData?: Record<string, string>;
  currentPageTocData: TableOfContents;
}> => {
  // as articles is only 3 layers deep then only retrieve those. (connectors being level 4 and 5 and dealt
  // with in the connectors-list and connectors pages
  const maxDepthToTraverse = 5;

  await initialiseLogger({
    metaData: { script: 'create-connector-list-page' },
  });

  const productDocumentsPath = `${contentRootPath}`;
  const connectorSectionSlug = `//connectors/${currentConnectorSection}`;
  // Adds docs back into the path so that the 'recursiveFindRouteData' function can match against its search within
  // the content directory. This can be removed once the connectors are moved to the root of the content directory as the
  // slug will accurately reflect the document path.
  const connectorSectionFilePath = connectorSectionSlug.replace(
    'connectors',
    'connectors/docs',
  );

  const {
    currentPageTocData,
    frontMatterData,
    pageContent,
  } = await recursiveFindRouteData({
    rootDir: productDocumentsPath,
    currentPageSlug: connectorSectionFilePath,
    sectionContentDir: '',
    maxDepthToTraverse,
    promises,
    resolve,
  });

  return {
    pageContent,
    frontMatterData,
    currentPageTocData,
  };
};

export default getConnectorSection;

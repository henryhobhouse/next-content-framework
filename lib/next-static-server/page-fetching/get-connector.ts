import recursiveFindRouteData from './recursive-find-route-data';

import { contentRootPath } from 'lib/next-static-server/mdx-parse';
import {
  Resolve,
  MdxRenderedToString,
  TableOfContents,
} from 'lib/next-static-server/types';
import initialiseLogger from 'lib/server/logger';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Gets connectors as part of the static pre-render (static compilation by webpack) stage of the build (https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)
 *
 * Recursively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation.
 */
const getConnector = async (
  currentSectionConnectorPath: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  pageContent?: MdxRenderedToString;
  frontMatterData?: Record<string, string>;
  currentPageTocData: TableOfContents;
}> => {
  // connectors are nested 5 levels below root so keep traversing to this level to find the docs page
  // and relevant content
  const maxDepthToTraverse = 5;
  const documentPathRootSection = 'platform';

  await initialiseLogger({ metaData: { script: 'create-connector-page' } });

  const productDocumentsPath = `${contentRootPath}/${documentPathRootSection}`;
  // as connectors slugs are unique in that they don't match the file path we have to artificially revert between the two
  // when creating slugs and getting said slugs actual contents from associated markdown file.
  const connectorDirectoryPath = `/${documentPathRootSection}/connectors/docs/${currentSectionConnectorPath}`;

  const {
    currentPageTocData,
    frontMatterData,
    pageContent,
  } = await recursiveFindRouteData({
    rootDir: productDocumentsPath,
    currentPageSlug: connectorDirectoryPath,
    sectionContentDir: documentPathRootSection,
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

export default getConnector;

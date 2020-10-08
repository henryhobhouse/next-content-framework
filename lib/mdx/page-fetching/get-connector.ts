import parseDirectories from './parse-directories';

import { documentFilesBasePath, getNavigationItems } from 'lib/mdx/mdx-parse';
import {
  Resolve,
  NavigationArticle,
  MdxRenderedToString,
  TableOfContents,
} from 'lib/mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Recurrively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation.
 */
const getConnector = async (
  currentSectionConnectorPath: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  contentNavStructure: NavigationArticle[];
  pageContent?: MdxRenderedToString;
  frontMatterData?: Record<string, string>;
  currentPageTocData: TableOfContents;
}> => {
  // connectors are nested 5 levels below root so keep traversing to this level to find the docs page
  // and relevant content
  const maxDepthToTraverse = 5;
  const documentPathRootSection = 'platform';

  const productDocumentsPath = `${documentFilesBasePath}/${documentPathRootSection}`;
  const connectorSlug = `/${documentPathRootSection}/connectors/docs/${currentSectionConnectorPath}`;

  const {
    articlesForNav,
    currentPageTocData,
    frontMatterData,
    pageContent,
  } = await parseDirectories({
    rootDir: productDocumentsPath,
    currentPageSlug: connectorSlug,
    contentPagedir: documentPathRootSection,
    maxDepthToTraverse,
    promises,
    resolve,
  });

  const contentNavStructure = getNavigationItems(articlesForNav);

  return {
    contentNavStructure,
    pageContent,
    frontMatterData,
    currentPageTocData,
  };
};

export default getConnector;

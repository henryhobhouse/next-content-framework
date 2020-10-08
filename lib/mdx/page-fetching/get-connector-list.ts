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
const getConnectorLists = async (
  currentConnectorSection: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  contentNavStructure: NavigationArticle[];
  pageContent?: MdxRenderedToString;
  frontMatterData?: Record<string, string>;
  currentPageTocData: TableOfContents;
}> => {
  // as articles is only 3 layers deep then only retrieve those. (connectors being level 4 and 5 and dealt
  // with in the connectors-list and connectors pages
  const maxDepthToTraverse = 4;
  const documentPathRootSection = 'platform';

  const productDocumentsPath = `${documentFilesBasePath}/${documentPathRootSection}`;
  const connectorListSlug = `/${documentPathRootSection}/connectors/docs/${currentConnectorSection}`;

  const {
    articlesForNav,
    currentPageTocData,
    frontMatterData,
    pageContent,
  } = await parseDirectories({
    rootDir: productDocumentsPath,
    currentPageSlug: connectorListSlug,
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

export default getConnectorLists;

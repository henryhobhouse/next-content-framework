import recursiveFindRouteData from './recursive-find-route-data';

import initialiseLogger from 'lib/node/logger';
import { documentFilesBasePath } from 'lib/page-mdx/mdx-parse';
import {
  Resolve,
  MdxRenderedToString,
  TableOfContents,
} from 'lib/page-mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Recurrively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation.
 */
const getArticle = async (
  currentSlugSections: string[],
  contentPagedir: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  pageContent?: MdxRenderedToString;
  frontMatterData?: Record<string, string>;
  currentPageTocData: TableOfContents;
}> => {
  // as all articles docs mdx files are the first 4 layers of nested directories then only retrieve those.
  // (connectors being level 5 and 6 (relative to root) and dealt with in the connectors-list and connectors pages
  const maxDepthToTraverse = 4;

  await initialiseLogger({ metaData: { script: 'create-article-page' } });

  const productDocumentsPath = `${documentFilesBasePath}/${contentPagedir}`;
  const articleSlug = `/${contentPagedir}/${currentSlugSections.join('/')}`;

  const {
    currentPageTocData,
    frontMatterData,
    pageContent,
  } = await recursiveFindRouteData({
    rootDir: productDocumentsPath,
    currentPageSlug: articleSlug,
    contentPagedir,
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

export default getArticle;

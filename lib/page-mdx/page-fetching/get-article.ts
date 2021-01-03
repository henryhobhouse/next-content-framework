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
 * Get article contents as part of the static pre-render (static compilation by webpack) stage of the build (https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)
 *
 * Recursively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation.
 */
const getArticle = async (
  currentSlugSections: string[],
  sectionContentDir: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  pageContent?: MdxRenderedToString;
  frontMatterData?: Record<string, string>;
  currentPageTocData: TableOfContents;
}> => {
  // as all articles docs mdx files are the first 4 layers of nested directories then only retrieve those.
  // (connectors being level 5 and 6 (relative to root) and dealt with in the connectors-list and connectors pages.
  // This can be removed once the connectors are moved to the root of the content directory.
  const maxDepthToTraverse = 4;

  await initialiseLogger({ metaData: { script: 'create-article-page' } });

  const sectionContentPath = `${contentRootPath}/${sectionContentDir}`;
  const articleSlug = `/${sectionContentDir}/${currentSlugSections.join('/')}`;

  const {
    currentPageTocData,
    frontMatterData,
    pageContent,
  } = await recursiveFindRouteData({
    rootDir: sectionContentPath,
    currentPageSlug: articleSlug,
    sectionContentDir,
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

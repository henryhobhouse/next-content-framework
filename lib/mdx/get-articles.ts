import matter from 'gray-matter';
import renderToString from 'next-mdx-remote/render-to-string';
import rehypeAutoLinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkUnwrapImages from 'remark-unwrap-images';

import { addRelativeImageLinks } from './add-relative-links';
import getTableOfContents from './get-table-of-contents';
import mdxComponents from './mdx-components';
import {
  documentFilesBasePath,
  getNavigationItems,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from './mdx-parse';
import {
  Resolve,
  NavigationArticle,
  MdxRenderedToString,
  TableOfContents,
} from './types';

import { FsPromises } from 'pages/embedded/[...slug]';

/**
 * Recurrively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation.
 */
const getArticles = async (
  currentSlugSections: string[],
  contentPagedir: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  contentNavStructure: NavigationArticle[];
  currentPagesContent?: MdxRenderedToString;
  frontMatterData?: Record<string, unknown>;
  currentPageTocData?: TableOfContents;
}> => {
  // as articles is only 3 layers deep then only retrieve those. (connectors being level 4 and 5 and dealt
  // with in the connectors-list and connectors pages
  const maxDepthToTraverse = 3;
  const flatArticles: Omit<NavigationArticle, 'children'>[] = [];
  let currentPagesContent: MdxRenderedToString | undefined;
  let currentPageTocData: TableOfContents | undefined;
  let frontMatterData: Record<string, unknown> | undefined;
  const platformDocumentsPath = `${documentFilesBasePath}/${contentPagedir}`;

  const parseDirectories = async (directory: string, currentDepth: number) => {
    const dirents = await await promises.readdir(directory, {
      withFileTypes: true,
    });

    // assume only one docs file per directory
    const docsFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    if (docsFile) {
      const markdownPath = resolve(directory, docsFile.name);
      const relativePath = markdownPath.replace(documentFilesBasePath, '');

      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(relativePath);
      const orderComponents = orderRegex.exec(relativePath);

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const slug = `/${contentPagedir}${localPath}`;
        const level = (localPath && localPath.match(/\//g)?.length) || 1;
        const order = orderComponents ? parseInt(orderComponents[1]) : 0;
        const parentSlug = slug.replace(/\/[a-zA-Z0-9-]+$/, '');
        const markdownData = await promises.readFile(markdownPath, 'utf8');
        const { data, content } = matter(markdownData);

        const docTitle = data.menu_title || data.title;

        // if there is a document title than add it to the side navigation config
        if (docTitle) {
          flatArticles.push({
            title: docTitle,
            slug,
            level,
            order,
            parentSlug,
          });
        }

        if (slug === `/${contentPagedir}/${currentSlugSections.join('/')}`) {
          const relativePathToImages = relativePath.replace(
            /\/docs.(mdx|md)$/,
            '',
          );

          const transformedContent = await addRelativeImageLinks(
            content,
            relativePathToImages,
            promises,
          );

          frontMatterData = data;

          // for server side rendering
          currentPagesContent = await renderToString(transformedContent, {
            components: mdxComponents,
            mdxOptions: {
              remarkPlugins: [remarkUnwrapImages],
              rehypePlugins: [rehypeSlug, rehypeAutoLinkHeadings],
            },
          });

          currentPageTocData = getTableOfContents(transformedContent);
        }
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory() && currentDepth <= maxDepthToTraverse) {
          const directoryPath = resolve(directory, dirent.name);
          await parseDirectories(directoryPath, currentDepth + 1);
        }
      }),
    );
  };
  await parseDirectories(platformDocumentsPath, 1);
  const contentNavStructure = getNavigationItems(flatArticles);
  return {
    contentNavStructure,
    currentPagesContent,
    frontMatterData,
    currentPageTocData,
  };
};

export default getArticles;

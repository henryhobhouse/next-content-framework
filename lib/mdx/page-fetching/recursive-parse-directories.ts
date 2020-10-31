import matter from 'gray-matter';
import renderToString from 'next-mdx-remote/render-to-string';
import rehypeAutoLinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkUnwrapImages from 'remark-unwrap-images';

import {
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from '../mdx-parse';
import { MdxRenderedToString, Resolve, TableOfContents } from '../types';

import addRelativeImageLinks from 'lib/mdx/add-relative-links';
import getTableOfContents from 'lib/mdx/get-table-of-contents';
import mdxComponents from 'lib/mdx/mdx-components';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

interface RecursiveParseDirectoriesProps {
  rootDir: string;
  currentPageSlug: string;
  contentPagedir: string;
  maxDepthToTraverse: number;
  promises: FsPromises;
  resolve: Resolve;
}

/**
 * Recursive Parse Directories.
 *
 * Recurisively traverse content directories. Generates article page metadata array for
 * creating navigation structure configuration
 *
 * In each directory check if docs.md|mdx and if so derive slug from directory path and
 * check if current page. If current page then:
 *  * Get docs.md/mdx content
 *  * Find any image links and replace with link to correct optimised image
 *  * Builds table of contents configuration for that page
 *  * Returns pre-parsed markdown content and frontmatter data along with nav structure config
 *    and table of contents config.
 */
const recursiveParseDirectories = async ({
  rootDir,
  currentPageSlug,
  contentPagedir,
  maxDepthToTraverse,
  promises,
  resolve,
}: RecursiveParseDirectoriesProps) => {
  const navigationArticleDepth = 3;

  let pageContent: MdxRenderedToString | undefined;
  let frontMatterData: Record<string, string> | undefined;
  let currentPageTocData: TableOfContents = {};

  const recursiveParse = async (directory: string, currentDepth: number) => {
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

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const slug = `/${contentPagedir}${localPath}`;

        if (slug === currentPageSlug) {
          const markdownData = await promises.readFile(markdownPath, 'utf8');

          const { data, content } = matter(markdownData);

          const relativePathToParentDirectory = relativePath.replace(
            /\/docs.(mdx|md)$/,
            '',
          );

          const transformedContent = await addRelativeImageLinks(
            content,
            relativePathToParentDirectory,
            promises,
          );

          frontMatterData = data;

          // Parsing the Markdown. Creates object of pre-parsed MDX as JSX for server side rendering in
          // addition to orginal source (markdown) if content needs to be hydrated client side.
          pageContent = await renderToString(transformedContent, {
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
        const isCompleted =
          (currentDepth > navigationArticleDepth && !!pageContent) ||
          currentDepth >= maxDepthToTraverse;
        if (dirent.isDirectory() && !isCompleted) {
          const directoryPath = resolve(directory, dirent.name);
          await recursiveParse(directoryPath, currentDepth + 1);
        }
      }),
    );
  };

  await recursiveParse(rootDir, 1);

  return {
    frontMatterData,
    pageContent,
    currentPageTocData,
  };
};

export default recursiveParseDirectories;

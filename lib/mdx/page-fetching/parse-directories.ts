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
import {
  MdxRenderedToString,
  NavigationArticle,
  Resolve,
  TableOfContents,
} from '../types';

import addRelativeImageLinks from 'lib/mdx/add-relative-links';
import getTableOfContents from 'lib/mdx/get-table-of-contents';
import mdxComponents from 'lib/mdx/mdx-components';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

interface ParseDirectoriesProps {
  rootDir: string;
  currentPageSlug: string;
  contentPagedir: string;
  maxDepthToTraverse: number;
  promises: FsPromises;
  resolve: Resolve;
}

const parseDirectories = async ({
  rootDir,
  currentPageSlug,
  contentPagedir,
  maxDepthToTraverse,
  promises,
  resolve,
}: ParseDirectoriesProps) => {
  const navigationArticleDepth = 3;

  const articlesForNav: Omit<NavigationArticle, 'children'>[] = [];
  let pageContent: MdxRenderedToString | undefined;
  let frontMatterData: Record<string, string> | undefined;
  let currentPageTocData: TableOfContents = {};

  const parse = async (directory: string, currentDepth: number) => {
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
          articlesForNav.push({
            title: docTitle,
            slug,
            level,
            order,
            parentSlug,
          });
        }

        if (slug === currentPageSlug) {
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
          await parse(directoryPath, currentDepth + 1);
        }
      }),
    );
  };

  await parse(rootDir, 1);

  return {
    articlesForNav,
    frontMatterData,
    pageContent,
    currentPageTocData,
  };
};

export default parseDirectories;

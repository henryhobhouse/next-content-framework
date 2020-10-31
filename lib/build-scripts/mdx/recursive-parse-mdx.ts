import { resolve } from 'path';
import { promises } from 'fs';
import matter from 'gray-matter';

import {
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from '../../mdx/mdx-parse';
import { NavigationArticle } from '../../mdx/types';

const navigationArticleDepth = 3;

const recursiveParseMdx = async (
  rootDir: string,
  contentRoot: string,
): Promise<
  Pick<NavigationArticle, 'level' | 'order' | 'slug' | 'title' | 'parentSlug'>[]
> => {
  const articlesForNav: Omit<NavigationArticle, 'children'>[] = [];

  const parseMdx = async (directory: string, currentDepth: number) => {
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
        const slug = `/${contentRoot}${localPath}`;
        const level = (localPath && localPath.match(/\//g)?.length) || 1;
        const order = orderComponents ? parseInt(orderComponents[1], 10) : 0;
        const parentSlug = slug.replace(/\/[a-zA-Z0-9-]+$/, '');
        const markdownData = await promises.readFile(markdownPath, 'utf8');
        const { data } = matter(markdownData);

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
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        const isCompleted = currentDepth > navigationArticleDepth;
        if (dirent.isDirectory() && !isCompleted) {
          const directoryPath = resolve(directory, dirent.name);
          await parseMdx(directoryPath, currentDepth + 1);
        }
      }),
    );
  };

  await parseMdx(rootDir, 0);

  return articlesForNav;
};

export default recursiveParseMdx;

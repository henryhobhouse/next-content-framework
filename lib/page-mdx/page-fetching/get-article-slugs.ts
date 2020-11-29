import {
  connectorDocsRelativePath,
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
} from 'lib/page-mdx/mdx-parse';
import { Resolve, StaticArticlePathParams } from 'lib/page-mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Get Article Slugs as part of the static pre render (https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation)
 *
 * Recurrively traverse through all directories in the content directory to a depth of 3 (as all articles
 * are in directory depths 1-3. Upon finding a doc.md|mdx file to determing markdown slug by removing order
 * numbering from directory path and setting as the slug.
 *
 * The only exception is the markdown files in the connector docs (platorm/50.connectors/1000.docs) directory
 * as these are handled by the connector list page templates.
 *
 * Returns an array of all slugs.
 */
const getArticleSlugs = async (
  contentPagedir: string,
  promises: FsPromises,
  resolve: Resolve,
) => {
  const paths: StaticArticlePathParams[] = [];
  const platformDocumentsPath = `${documentFilesBasePath}/${contentPagedir}`;
  // as articles is only 3 layers deep then only retrieve those. (connectors being level 4 and 5 and dealt
  // with in the connectors-list and connectors pages
  const maxDepthToTraverse = 3;

  const parseDirectories = async (directory: string, currentDepth: number) => {
    // get all dirents in current directory
    const dirents = await promises.readdir(directory, {
      withFileTypes: true,
    });

    // assume only one post file per directory
    const articleFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    if (articleFile) {
      const markdownPath = resolve(directory, articleFile.name);
      const relativePath = markdownPath.replace(
        `${documentFilesBasePath}/`,
        '',
      );
      const isConnectorListPage = relativePath.includes(
        connectorDocsRelativePath,
      );

      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(relativePath);

      if (pathComponents && !isConnectorListPage) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const isConnectorListPage = localPath.startsWith(
          connectorDocsRelativePath,
        );
        if (!isConnectorListPage) {
          paths.push({
            params: {
              articleSlug: [...localPath.split('/').filter(Boolean)],
            },
          });
        }
      }
    }
    await Promise.allSettled(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory() && currentDepth <= maxDepthToTraverse) {
          const directoryPath = resolve(directory, dirent.name);
          await parseDirectories(directoryPath, currentDepth + 1);
        }
      }),
    );
  };
  await parseDirectories(platformDocumentsPath, 1);
  return paths;
};

export default getArticleSlugs;

import { readdirSync } from 'fs';

import {
  connectorDocsRelativePath,
  contentRootPath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
} from 'lib/next-static-server/mdx-parse';
import { StaticArticlePathParams } from 'lib/next-static-server/types';

/**
 * Get Article Slugs as part of the static pre render (static compilation by webpack) stage of the build (https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation)
 *
 * Recursively traverse through all directories in the content directory to a depth of 3 (as all articles
 * are in directory depths 1-3. Upon finding a doc.md|mdx file to determining markdown slug by removing order
 * numbering from directory path and setting as the slug.
 *
 * The only exception is the markdown files in the connector docs (platform/50.connectors/1000.docs) directory
 * as these are handled by the connector list page templates.
 *
 * Returns an array of all slugs.
 */
const getArticleSlugs = (sectionContentDir: string) => {
  const paths: StaticArticlePathParams[] = [];
  // determine root directory of article files
  const articleSectionPath = `${contentRootPath}/${sectionContentDir}`;
  // as articles is only 3 layers deep then only retrieve those. (connectors being level 4 and 5 and dealt
  // with in the connectors-list and connectors pages. This can be removed when connectors are moved to the root of
  // the content directory
  const maxDepthToTraverse = 3;

  const parseDirectories = (directory: string, currentDepth: number) => {
    // get all dirents in current directory
    const dirents = readdirSync(directory, {
      withFileTypes: true,
    });

    // assume only one post file per directory
    const articleFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    if (articleFile) {
      const docsFileAbsolutePath = `${directory}/${articleFile.name}`;
      const docsFileRelativePath = docsFileAbsolutePath.replace(
        `${contentRootPath}/`,
        '',
      );

      // this can be removed when connectors are moved to root of content directory
      const isConnectorSectionPage = docsFileRelativePath.includes(
        connectorDocsRelativePath,
      );

      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(docsFileRelativePath);

      if (pathComponents && !isConnectorSectionPage) {
        const relativePath = pathComponents[2];
        const nonOrderedRelativePath = relativePath.replace(
          orderPartRegex,
          '/',
        );

        // Checks if connector section page. Can be removed once connectors are moved to root of content
        const isConnectorSectionPage = nonOrderedRelativePath.startsWith(
          connectorDocsRelativePath,
        );

        // if not connector section page then to pass the relative path segments as string array to denote
        // slug path to Next
        if (!isConnectorSectionPage) {
          paths.push({
            params: {
              articleSlug: [
                ...nonOrderedRelativePath.split('/').filter(Boolean),
              ],
            },
          });
        }
      }
    }
    dirents.forEach(async (dirent) => {
      if (dirent.isDirectory() && currentDepth <= maxDepthToTraverse) {
        const directoryPath = `${directory}/${dirent.name}`;
        parseDirectories(directoryPath, currentDepth + 1);
      }
    });
  };

  // kick of recursive search of article directory from root
  parseDirectories(articleSectionPath, 1);

  return paths;
};

export default getArticleSlugs;

import { readdirSync } from 'fs';
import { resolve } from 'path';

import {
  contentRootPath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
} from 'lib/next-static-server/mdx-parse';
import { StaticConnectorPathParams } from 'lib/next-static-server/types';

const connectorDirPath = 'platform/50.connectors/1000.docs';

/**
 * Get Connector Slugs as part of the static pre render (https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation)
 *
 * Recursively traverse through all directories in the connector docs directory to a depth of 2.
 * Upon finding a doc.md|mdx file to determining markdown slug by removing order numbering from directory path and setting as the slug.
 *
 * Returns an array of all slugs.
 */
const getConnectorSlugs = () => {
  const paths: StaticConnectorPathParams[] = [];
  const platformDocumentsPath = `${contentRootPath}/${connectorDirPath}`;
  // as articles is only 3 layers deep then only retrieve those. (connectors being level 4 and 5 and dealt
  // with in the connectors-list and connectors pages
  const maxDepthToTraverse = 3;

  const parseDirectories = (directory: string, currentDepth: number) => {
    const dirents = readdirSync(directory, {
      withFileTypes: true,
    });

    // assume only one post file per directory
    const postFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    if (postFile) {
      const markdownPath = resolve(directory, postFile.name);
      const relativePath = markdownPath.replace(`${contentRootPath}/`, '');

      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(relativePath);

      if (pathComponents && currentDepth === 3) {
        const path = pathComponents[2];
        const connectorMarkdownFilePath = path.replace(orderPartRegex, '/');
        // removes docs from path. This can be removed when connectors are moved to the root
        // of the content directory
        const slugWithOutDocs = connectorMarkdownFilePath.replace('/docs', '');
        const pathSegments = slugWithOutDocs.split('/').filter(Boolean);
        paths.push({
          params: {
            connectorSection: pathSegments[pathSegments.length - 2],
            connector: pathSegments[pathSegments.length - 1],
          },
        });
      }
    }
    dirents.forEach((dirent) => {
      if (dirent.isDirectory() && currentDepth <= maxDepthToTraverse) {
        const directoryPath = resolve(directory, dirent.name);
        parseDirectories(directoryPath, currentDepth + 1);
      }
    });
  };
  parseDirectories(platformDocumentsPath, 1);
  return paths;
};

export default getConnectorSlugs;

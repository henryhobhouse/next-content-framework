import {
  connectorListRelativePath,
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
} from 'lib/page-mdx/mdx-parse';
import { Resolve, StaticConnectorListPathParams } from 'lib/page-mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Get Connector List Slugs as part of the static pre render (https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation)
 *
 * Traverse through all directories in the connector docs directory (platform/50.connectors/1000.docs).
 * Determines slugs from all directories there-in and ensures that each directory has a docs.md|mdx file/page.
 *
 * Returns an array of all slugs.
 */
const getConnectorListSlugs = async (
  promises: FsPromises,
  resolve: Resolve,
) => {
  const paths: StaticConnectorListPathParams[] = [];
  const connectorListsPath = `${documentFilesBasePath}${connectorListRelativePath}`;

  const dirents = await promises.readdir(connectorListsPath, {
    withFileTypes: true,
  });

  // assume all directories are docs sections.
  const docDirectories = dirents.filter((dirent) => dirent.isDirectory());

  if (docDirectories.length) {
    await Promise.allSettled(
      docDirectories.map(async (docDirectory) => {
        const childDirectoryPath = resolve(
          connectorListsPath,
          docDirectory.name,
        );

        const childDirents = await promises.readdir(connectorListsPath, {
          withFileTypes: true,
        });

        // Check directory has docs.md|mdx file
        const hasDocsFiles = childDirents.some(
          (childDirent) => !!childDirent.name.match(isPostFileRegex),
        );

        if (hasDocsFiles) {
          const relativePath = childDirectoryPath.replace(
            connectorListsPath,
            '',
          );
          // as exec is global we need to reset the index each iteration of the loop
          pathRegex.lastIndex = 0;
          const localPath = relativePath.replace(orderPartRegex, '');
          paths.push({
            params: {
              connectorList: localPath,
            },
          });
        }
      }),
    );
  }

  return paths;
};

export default getConnectorListSlugs;

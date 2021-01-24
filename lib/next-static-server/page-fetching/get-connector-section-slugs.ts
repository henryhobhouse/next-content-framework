import {
  connectorSectionRelativePath,
  contentRootPath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
} from 'lib/next-static-server/mdx-parse';
import {
  Resolve,
  StaticConnectorSectionPathParams,
} from 'lib/next-static-server/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Gets Connector List Slugs as part of the static pre-render (static compilation by webpack) stage of the build (https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation)
 *
 * Traverse through all directories in the connector docs directory (platform/50.connectors/1000.docs).
 * Determines slugs from all directories there-in and ensures that each directory has a docs.md|mdx file/page.
 *
 * Returns an array of all slugs.
 */
const getConnectorSectionSlugs = async (
  promises: FsPromises,
  resolve: Resolve,
) => {
  const paths: StaticConnectorSectionPathParams[] = [];
  const connectorSectionsPath = `${contentRootPath}/${connectorSectionRelativePath}`;

  const dirents = await promises.readdir(connectorSectionsPath, {
    withFileTypes: true,
  });

  // assume all directories are docs sections.
  const docDirectories = dirents.filter((dirent) => dirent.isDirectory());

  if (docDirectories.length) {
    await Promise.all(
      docDirectories.map(async (docDirectory) => {
        const childDirectoryPath = resolve(
          connectorSectionsPath,
          docDirectory.name,
        );

        const childDirents = await promises.readdir(connectorSectionsPath, {
          withFileTypes: true,
        });

        // Check directory has docs.md|mdx file
        const hasDocsFiles = childDirents.some(
          (childDirent) => !!childDirent.name.match(isPostFileRegex),
        );

        if (hasDocsFiles) {
          // as connectors sections has currently a artificially created name we only want the name of
          // the section here so that we can create the path ourselves. This can be reverted to match the other
          // page patterns once the connectors are moved to the root of the content directory.
          const orderedSectionName = childDirectoryPath.replace(
            connectorSectionsPath,
            '',
          );
          // as exec is global we need to reset the index each iteration of the loop
          pathRegex.lastIndex = 0;

          const unOrderedSectionName = orderedSectionName.replace(
            orderPartRegex,
            '',
          );

          paths.push({
            params: {
              connectorSection: unOrderedSectionName,
            },
          });
        }
      }),
    );
  }

  return paths;
};

export default getConnectorSectionSlugs;

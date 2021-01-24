import matter from 'gray-matter';

import {
  contentRootPath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from 'lib/next-static-server/mdx-parse';
import { Resolve, ConnectorMetaData } from 'lib/next-static-server/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

/**
 * Gets connector section connectors as part of the static pre-render (static compilation by webpack) stage of the build (https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)
 *
 * Finds all child directories of within the connectors sections directory and if has
 * a docs markdown file returns the parsed contents.
 */
const getConnectorSectionConnectors = async (
  currentConnectorSection: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  connectors: ConnectorMetaData[];
}> => {
  const connectors: ConnectorMetaData[] = [];
  const documentPathRootSection = 'platform';

  const connectorSectionPath = `${contentRootPath}/${documentPathRootSection}/50.connectors/1000.docs`;
  const connectorSectionSlug = `/connectors/${currentConnectorSection}`;

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
      const relativePath = markdownPath.replace(`${contentRootPath}/`, '');

      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(relativePath);

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const slug = localPath.replace('/docs', '');

        if (slug.startsWith(connectorSectionSlug) && currentDepth >= 2) {
          const markdownData = await promises.readFile(markdownPath, 'utf8');
          const { data } = matter(markdownData);
          connectors.push({
            frontmatter: data,
            slug,
          });
        }
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
          const directoryPath = resolve(directory, dirent.name);
          await parse(directoryPath, currentDepth + 1);
        }
      }),
    );
  };

  await parse(connectorSectionPath, 0);

  return {
    connectors,
  };
};

export default getConnectorSectionConnectors;

import matter from 'gray-matter';

import {
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from 'lib/mdx/mdx-parse';
import { Resolve, ConnectorMetaData } from 'lib/mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

const getConnectorListConnectors = async (
  currentConnectorSection: string,
  promises: FsPromises,
  resolve: Resolve,
): Promise<{
  connectors: ConnectorMetaData[];
}> => {
  const connectors: ConnectorMetaData[] = [];
  const documentPathRootSection = 'platform';

  const connectorListPath = `${documentFilesBasePath}/${documentPathRootSection}/50.connectors/1000.docs`;
  const connectorListSlug = `/${documentPathRootSection}/connectors/docs/${currentConnectorSection}`;

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

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const slug = `/platform${localPath}`;

        if (slug.startsWith(connectorListSlug) && currentDepth >= 2) {
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

  await parse(connectorListPath, 0);

  return {
    connectors,
  };
};

export default getConnectorListConnectors;

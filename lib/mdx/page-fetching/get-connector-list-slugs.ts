import {
  connectorListRelativePath,
  documentFilesBasePath,
  orderPartRegex,
  pathRegex,
} from 'lib/mdx/mdx-parse';
import { Resolve, StaticConnectorListPathParams } from 'lib/mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

const getConnectorListSlugs = async (
  promises: FsPromises,
  resolve: Resolve,
) => {
  const paths: StaticConnectorListPathParams[] = [];
  const connectorListsPath = `${documentFilesBasePath}${connectorListRelativePath}`;

  const dirents = await promises.readdir(connectorListsPath, {
    withFileTypes: true,
  });

  // assume only one post file per directory
  const docDirectories = dirents.filter((dirent) => dirent.isDirectory());

  if (docDirectories.length) {
    docDirectories.forEach((docDirectory) => {
      const childDirectoryPath = resolve(connectorListsPath, docDirectory.name);
      const relativePath = childDirectoryPath.replace(connectorListsPath, '');
      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;
      const localPath = relativePath.replace(orderPartRegex, '');
      paths.push({
        params: {
          connectorList: localPath,
        },
      });
    });
  }

  return paths;
};

export default getConnectorListSlugs;

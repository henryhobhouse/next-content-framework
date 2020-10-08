import {
  connectorDocsRelativePath,
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
} from 'lib/mdx/mdx-parse';
import { Resolve, StaticArticlePathParams } from 'lib/mdx/types';
import { FsPromises } from 'pages/embedded/[...articleSlug]';

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
    const dirents = await promises.readdir(directory, {
      withFileTypes: true,
    });

    // assume only one post file per directory
    const postFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    if (postFile) {
      const markdownPath = resolve(directory, postFile.name);
      const relativePath = markdownPath.replace(documentFilesBasePath, '');
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
    await Promise.all(
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

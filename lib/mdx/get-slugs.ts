import {
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  pathRegex,
  Resolve,
  StaticPathParams,
} from './mdx-parse';

import { FsPromises } from 'pages/embedded/[...slug]';

const getSlugs = async (
  contentPagedir: string,
  promises: FsPromises,
  resolve: Resolve,
) => {
  const paths: StaticPathParams[] = [];
  const platformDocumentsPath = `${documentFilesBasePath}/${contentPagedir}`;

  const parseDirectories = async (directory: string) => {
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

      // as exec is global we need to reset the index each iteration of the loop
      pathRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(relativePath);

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');

        paths.push({
          params: {
            slug: [...localPath.split('/').filter(Boolean)],
          },
        });
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
          const directoryPath = resolve(directory, dirent.name);
          await parseDirectories(directoryPath);
        }
      }),
    );
  };
  await parseDirectories(platformDocumentsPath);
  return paths;
};

export default getSlugs;

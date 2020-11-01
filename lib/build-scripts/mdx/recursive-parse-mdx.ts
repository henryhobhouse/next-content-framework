import { resolve } from 'path';
import { promises } from 'fs';
import matter from 'gray-matter';

import {
  connectorsListRegex,
  connectorsRegex,
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from '../../mdx/mdx-parse';

const navigationArticleDepth = 5;

export interface NodeData {
  title: string;
  description?: string;
  tags?: string[];
  content: string;
  section: string;
  slug: string;
  level: number;
  order: number;
  parentSlug: string;
  type: string;
  imageIcon: string;
  streamLineIcon: string;
}
type ParsedMdxCallback = (args: NodeData[], contentRoot: string) => void;

const recursiveParseMdx = async (
  rootDir: string,
  contentRoot: string,
  callback: ParsedMdxCallback,
): Promise<void> => {
  const allNodesData: NodeData[] = [];

  const parseMdx = async (directory: string, currentDepth: number) => {
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
      connectorsRegex.lastIndex = 0;
      connectorsListRegex.lastIndex = 0;

      const pathComponents = pathRegex.exec(relativePath);
      const orderComponents = orderRegex.exec(relativePath);

      if (pathComponents) {
        const section = pathComponents[1];
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const slug = `/${contentRoot}${localPath}`;
        const level = (localPath && localPath.match(/\//g)?.length) || 1;
        const order = orderComponents ? parseInt(orderComponents[1], 10) : 0;
        const parentSlug = slug.replace(/\/[a-zA-Z0-9-]+$/, '');
        const connectorsComponents = connectorsRegex.exec(slug);
        const isConnector = !!connectorsComponents;
        const connectorListComponents = connectorsListRegex.exec(slug);
        const isConnectorList = !!connectorListComponents;

        const markdownData = await promises.readFile(markdownPath, 'utf8');
        const { data, content } = matter(markdownData);

        if (isConnector && !data.connector)
          // eslint-disable-next-line no-console
          console.error(
            `WARNING: connector at ${path} does not have a connector name`,
          );

        let docType = 'article';
        if (!isConnectorList && (isConnector || data.connector)) {
          docType = 'connector';
        } else if (isConnectorList) {
          docType = 'connector-list';
        }

        // Check the path for the all connectors list
        if (slug === '/platform/connectors/docs/') {
          docType = 'connector-list';
        }

        const title = data.menu_title || data.title;

        allNodesData.push({
          title,
          description: data.description,
          tags: data.tags,
          content,
          section,
          slug,
          type: docType,
          level,
          order,
          parentSlug,
          imageIcon: data.imageIcon,
          streamLineIcon: data.streamLineIcon,
        });
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        const isCompleted = currentDepth > navigationArticleDepth;
        if (dirent.isDirectory() && !isCompleted) {
          const directoryPath = resolve(directory, dirent.name);
          await parseMdx(directoryPath, currentDepth + 1);
        }
      }),
    );
  };

  await parseMdx(rootDir, 0);

  await callback(allNodesData, contentRoot);
};

export default recursiveParseMdx;

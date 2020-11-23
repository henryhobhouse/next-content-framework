import { resolve } from 'path';
import { promises } from 'fs';
import matter from 'gray-matter';
import mdx from '@mdx-js/mdx';
import { prune } from 'underscore.string';
import visit from 'unist-util-visit';
import { ImageData } from '../copy-images-to-public';

import {
  connectorsListRegex,
  connectorsRegex,
  documentFilesBasePath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from '../../page-mdx/mdx-parse';
import createNodeId from '../create-node-id';

const navigationArticleDepth = 5;

export interface NodeData {
  id: string;
  title: string;
  description?: string;
  tags?: string;
  content: string;
  section: string;
  slug: string;
  excerpt: string;
  level: number;
  order: number;
  connectorSection?: string;
  parentSlug: string;
  type: string;
  imageIcon?: string;
  streamlineIcon?: string;
}

type ParsedMdxCallback = (
  args: NodeData[],
  contentRoot: string,
  imageDatas: ImageData[],
) => void;

const recursiveParseMdx = async (
  rootDir: string,
  contentRoot: string,
  callback: ParsedMdxCallback,
): Promise<void> => {
  const allNodesData: NodeData[] = [];
  const imageDatas: ImageData[] = [];

  const parseMdx = async (directory: string, currentDepth: number) => {
    const dirents = await await promises.readdir(directory, {
      withFileTypes: true,
    });

    // assume only one docs file per directory
    const docsFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    dirents.forEach((dirent) => {
      if (dirent.name.match(/(gif|png|svg|jpe?g)$/i)) {
        const imageData: ImageData = {
          path: resolve(directory, dirent.name),
          parentDirectory: directory,
          name: dirent.name,
        };
        imageDatas.push(imageData);
      }
    });

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

        let { connectorSection } = data;
        if (!connectorSection) {
          if (connectorsComponents) {
            // eslint-disable-next-line prefer-destructuring
            connectorSection = connectorsComponents[1];
          } else if (connectorListComponents) {
            // eslint-disable-next-line prefer-destructuring
            connectorSection = connectorListComponents[1];
          }
        }

        if (isConnector && !data.connector)
          logger.warn(
            `Connector at "${path}" does not have a connector name in the frontmatter`,
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

        const compiler = mdx.createMdxAstCompiler({ remarkPlugins: [] });
        const mdast = compiler.parse(content);

        const excerptNodes: string[] = [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        visit(mdast, (node) => {
          if (node.type === `text` || node.type === `inlineCode`) {
            excerptNodes.push(node.value as string);
          }
        });

        const excerpt = prune(excerptNodes.join(` `), 140, `…`);

        const title = data.menu_title || data.title;
        const id = createNodeId(path);

        allNodesData.push({
          id,
          title,
          description: data.description,
          tags: data.tags,
          content,
          section,
          excerpt,
          slug,
          type: docType,
          level,
          connectorSection,
          order,
          parentSlug,
          imageIcon: data.imageIcon,
          streamlineIcon: data.streamlineIcon,
        });
      }
    }
    await Promise.allSettled(
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

  await callback(allNodesData, contentRoot, imageDatas);
};

export default recursiveParseMdx;

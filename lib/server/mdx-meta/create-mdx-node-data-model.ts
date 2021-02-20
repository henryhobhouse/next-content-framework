import { promises } from 'fs';

import mdx from '@mdx-js/mdx';
import matter from 'gray-matter';
import { prune } from 'underscore.string';
import visit from 'unist-util-visit';

import {
  connectorsListRegex,
  connectorsRegex,
  contentRootPath,
  isPostFileRegex,
  orderPartRegex,
  orderRegex,
  pathRegex,
} from '../../next-static-server/mdx-parse';
import { ImageData } from '../copy-images-to-public';

import createNodeId from './create-node-id';

const navigationArticleDepth = 5;

type ArticleType = 'connector' | 'connector-list' | 'article';
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
  type: ArticleType;
  imageIcon?: string;
  streamlineIcon?: string;
  connector?: string;
}

type ParsedMdxCallback = (
  args: NodeData[],
  contentRoot: string,
  imagesMetaData: ImageData[],
) => void;

/**
 * Create MDX NodeData model.
 *
 * Recursively traverse content directories. Much of the logic is derived from how gatsby is
 * configured in gatsby-node.js file.
 *
 * In each directory check if docs.md|mdx and if so derive slug from directory path and
 * check if current page. If current page then:
 *  * Get docs.md/mdx content and frontmatter
 *  * Create NodeData model of the markdown file (node)
 *
 * Additionally in each directory, if any images to get image meta data and return along with
 * NodeData array.
 *
 * TODO: Consider if we can share logic with recursiveFindRouteData
 * (/lib/page-mdx/page-fetching/recursive-find-route-data.ts)
 */
const createMdxNodeDataModel = async (
  rootDir: string,
  contentRoot: string,
  callback: ParsedMdxCallback,
): Promise<void> => {
  const allNodesData: NodeData[] = [];
  const imagesMetadata: ImageData[] = [];

  const parseMdx = async (directory: string, currentDepth: number) => {
    // get all child dirents with current directory
    const dirents = await await promises.readdir(directory, {
      withFileTypes: true,
    });

    // assume only one docs file per directory
    const docsFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    // if any dirent is an image, add meta data to imagesMetadata array
    dirents.forEach((dirent) => {
      if (dirent.name.match(/(gif|png|svg|jpe?g)$/i)) {
        const imageData: ImageData = {
          path: `${directory}/${dirent.name}`,
          parentDirectory: directory,
          name: dirent.name,
        };
        imagesMetadata.push(imageData);
      }
    });

    if (docsFile) {
      const markdownPath = `${directory}/${docsFile.name}`;
      const relativePath = markdownPath.replace(`${contentRootPath}/`, '');

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
        const connectorSectionComponents = connectorsListRegex.exec(localPath);

        // TODO: needs updating when connectors moved to root (can use contentRoot instead)
        const isConnectorSection =
          !!connectorSectionComponents || localPath === '/connectors/docs';
        const isConnector =
          !!connectorSectionComponents ||
          (localPath.includes('/connectors/docs') && !isConnectorSection);

        // TODO: Can be removed once connectors moved to root
        const filteredLocalPath =
          isConnectorSection || isConnector
            ? localPath.replace('/docs', '')
            : localPath;

        // TODO: Needs to be updated once connectors moved to root
        const slug =
          isConnectorSection || isConnector
            ? filteredLocalPath
            : `/${contentRoot}${filteredLocalPath}`;

        const level =
          (filteredLocalPath && filteredLocalPath.match(/\//g)?.length) || 1;
        const order = orderComponents ? parseInt(orderComponents[1], 10) : 0;
        const parentSlug = slug.replace(/\/[a-zA-Z0-9-]+$/, '');
        const connectorsComponents = connectorsRegex.exec(slug);

        const markdownData = await promises.readFile(markdownPath, 'utf8');
        const { data, content } = matter(markdownData);

        let { connectorSection } = data;
        if (!connectorSection) {
          if (connectorsComponents) {
            // eslint-disable-next-line prefer-destructuring
            connectorSection = connectorsComponents[1];
          } else if (connectorSectionComponents) {
            // eslint-disable-next-line prefer-destructuring
            connectorSection = connectorSectionComponents[1];
          }
        }

        if (isConnector && !isConnectorSection && !data.connector)
          logger.warn(
            `Connector Docs File: "${path}" does not have a connector name in the frontmatter`,
          );

        let docType: ArticleType = 'article';
        if (!isConnectorSection && (isConnector || data.connector)) {
          docType = 'connector';
        } else if (isConnectorSection) {
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
          connector: data.connector,
        });
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        const isCompleted = currentDepth > navigationArticleDepth;
        if (dirent.isDirectory() && !isCompleted) {
          const directoryPath = `${directory}/${dirent.name}`;
          await parseMdx(directoryPath, currentDepth + 1);
        }
      }),
    );
  };

  await parseMdx(rootDir, 0);

  await callback(allNodesData, contentRoot, imagesMetadata);
};

export default createMdxNodeDataModel;

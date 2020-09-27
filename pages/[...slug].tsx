import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import matter from 'gray-matter';
import hydrate from 'next-mdx-remote/hydrate';
import renderToString from 'next-mdx-remote/render-to-string';
import React, { FC } from 'react';

import OptimisedImage from '../components/OptimisedImage';
import SectionNavigation from '../components/SectionNavigation';
import {
  documentFilesBasePath,
  getNavigationItems,
  isPostFileRegex,
  NavigationArticle,
  orderPartRefex,
  orderRegex,
  pathRegex,
} from '../lib/utils/mdx-parse';

interface MdxRenderedToString {
  compiledSource: string;
  renderedOutput: string;
  scope: Record<string, unknown>;
}

interface DocumentPostProps {
  contentNavStructure: NavigationArticle[];
  currentPagesContent?: MdxRenderedToString;
}

const DocumentPost: FC<DocumentPostProps> = ({
  currentPagesContent,
  contentNavStructure,
}) => {
  const content =
    currentPagesContent &&
    hydrate(currentPagesContent, { components: { img: OptimisedImage } });

  return (
    <>
      <SectionNavigation items={contentNavStructure} />
      <article>{content}</article>
    </>
  );
};

interface StaticPathParams {
  params: {
    slug: string[];
  };
}

const getSlugs = (directory: string) => {
  const paths: any[] = [];

  const parseDirectories = (directory: string) => {
    const dirents = readdirSync(directory, {
      withFileTypes: true,
    });
    // assume only one post file per directory
    const postFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );
    if (postFile) {
      const markdownPath = resolve(directory, postFile.name);
      const relativePath = markdownPath.replace(documentFilesBasePath, '');
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;
      const pathComponents = pathRegex.exec(relativePath);

      if (pathComponents) {
        const section = pathComponents[1];
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRefex, '/');

        paths.push({
          params: {
            slug: [section, ...localPath.split('/').filter(Boolean)],
          },
        });
      }
    }
    dirents.forEach((dirent) => {
      if (dirent.isDirectory()) {
        const directoryPath = resolve(directory, dirent.name);
        parseDirectories(directoryPath);
      }
    });
  };
  parseDirectories(directory);
  return paths;
};

const getNavigationArticles = async (
  currentSlugSections: string[],
): Promise<{
  contentNavStructure: NavigationArticle[];
  currentPagesContent?: MdxRenderedToString;
}> => {
  const flatArticles: Omit<NavigationArticle, 'children'>[] = [];
  let currentPagesContent: MdxRenderedToString | undefined;

  const parseDirectories = async (directory: string) => {
    const dirents = readdirSync(directory, {
      withFileTypes: true,
    });
    // assume only one post file per directory
    const postFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );
    if (postFile) {
      const markdownPath = resolve(directory, postFile.name);
      const relativePath = markdownPath.replace(documentFilesBasePath, '');
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;
      const pathComponents = pathRegex.exec(relativePath);
      const orderComponents = orderRegex.exec(relativePath);

      if (pathComponents) {
        const section = pathComponents[1];
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRefex, '/');
        const slug = `/${section}${localPath}/`;
        const level = (localPath && localPath.match(/\//g)?.length) || 1;

        const order = orderComponents ? parseInt(orderComponents[1]) : 0;
        const parentSlug = slug.replace(/\/[^/]+\/$/, '/');
        const markdownData = readFileSync(markdownPath, 'utf8');
        const { data, content } = matter(markdownData);
        flatArticles.push({
          title: data.menu_title || data.title,
          slug,
          level,
          order,
          parentSlug,
        });
        if (slug === `/${currentSlugSections.join('/')}/`) {
          currentPagesContent = await renderToString(content);
        }
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
  await parseDirectories(documentFilesBasePath);
  const contentNavStructure = getNavigationItems(flatArticles);
  return { contentNavStructure, currentPagesContent };
};

export async function getStaticPaths() {
  const paths = getSlugs(documentFilesBasePath);

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug } }: StaticPathParams) {
  const {
    contentNavStructure,
    currentPagesContent,
  } = await getNavigationArticles(slug);

  return {
    props: {
      contentNavStructure,
      currentPagesContent,
    },
  };
}

export default DocumentPost;

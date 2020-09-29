import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import matter from 'gray-matter';
import hydrate from 'next-mdx-remote/hydrate';
import renderToString from 'next-mdx-remote/render-to-string';
import React, { FC } from 'react';

import ArticleWrapper from '../components/ArticleWrapper';
import Code from '../components/Code';
import DynamicBlock from '../components/DynamicBlock';
import Highlight from '../components/Highlight';
import MdxAnchor from '../components/MdxAnchor';
import OptimisedImage from '../components/OptimisedImage';
import SectionNavigation from '../components/SectionNavigation';
import {
  addRelativeImageLinks,
  documentFilesBasePath,
  DocumentPostProps,
  getNavigationItems,
  isPostFileRegex,
  MdxRenderedToString,
  NavigationArticle,
  orderPartRefex,
  orderRegex,
  pathRegex,
  preToCodeBlock,
  StaticPathParams,
} from '../lib/utils/mdx-parse';

// components is its own object outside of render so that the references to
// components are stable
const components = {
  pre: (preProps: any) => {
    const props = preToCodeBlock(preProps);
    // if there's a codeString and some props, we passed the test
    if (props) {
      return <Code {...props} />;
    }
    // it's possible to have a pre without a code in it
    return <pre {...preProps} />;
  },
};

const DocumentPost: FC<DocumentPostProps> = ({
  currentPagesContent,
  contentNavStructure,
}) => {
  // for client side rendering
  const content =
    currentPagesContent &&
    hydrate(currentPagesContent, {
      components: {
        img: OptimisedImage,
        a: MdxAnchor,
        DynamicBlock,
        Highlight,
        FontAwesomeIcon,
        ...components,
      },
    });

  return (
    <>
      <SectionNavigation items={contentNavStructure} />
      <ArticleWrapper>{content}</ArticleWrapper>
    </>
  );
};

const getSlugs = (directory: string) => {
  const paths: StaticPathParams[] = [];

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

/**
 * Recurrively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation. As you cannot
 * use 'fs' outside of the same module as getStaticProps function call this, unfortunately, cannot be easily refactored
 * to smaller chucks. It definitely has room for improvement but will do in the future.
 */
const getNavigationArticles = async (
  currentSlugSections: string[],
): Promise<{
  contentNavStructure: NavigationArticle[];
  currentPagesContent?: MdxRenderedToString;
}> => {
  const flatArticles: Omit<NavigationArticle, 'children'>[] = [];
  let currentPagesContent: MdxRenderedToString | undefined;
  let relativePath = '';

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
      relativePath = markdownPath.replace(documentFilesBasePath, '');
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;
      const pathComponents = pathRegex.exec(relativePath);
      const orderComponents = orderRegex.exec(relativePath);

      if (pathComponents) {
        const section = pathComponents[1];
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRefex, '/');
        const slug = `/${section}${localPath}`;
        const level = (localPath && localPath.match(/\//g)?.length) || 1;
        const order = orderComponents ? parseInt(orderComponents[1]) : 0;
        const parentSlug = slug.replace(/\/[a-zA-Z0-9-]+$/, '');
        const markdownData = readFileSync(markdownPath, 'utf8');
        const { data, content } = matter(markdownData);
        flatArticles.push({
          title: data.menu_title || data.title,
          slug,
          level,
          order,
          parentSlug,
        });
        if (slug === `/${currentSlugSections.join('/')}`) {
          const relativePathToImages = relativePath.replace(
            /\/docs.(mdx|md)/,
            '',
          );
          const transformedContent = addRelativeImageLinks(
            content,
            relativePathToImages,
          );
          // for server side rendering
          currentPagesContent = await renderToString(transformedContent, {
            components: {
              img: OptimisedImage,
              a: MdxAnchor,
              DynamicBlock,
              Highlight,
              FontAwesomeIcon,
              ...components,
            },
          });
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

/**
 * Create all the slugs (paths) for this page
 */
export async function getStaticPaths() {
  const paths = getSlugs(documentFilesBasePath);

  return {
    paths,
    fallback: false,
  };
}

/**
 * Source all content on build (via either SSR or SSG). Powerful as agnostic to source. We
 * Could source from multiple data sources easily which will makes transitioning in the future
 * much much easier.
 */
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

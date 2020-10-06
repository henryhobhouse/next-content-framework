import { promises } from 'fs';
import { resolve } from 'path';

import hydrate from 'next-mdx-remote/hydrate';
import React, { FC } from 'react';

import ArticleWrapper from 'components/ArticleWrapper';
import SectionNavigation from 'components/SectionNavigation';
import getArticleSlugs from 'lib/mdx/get-article-slugs';
import getArticles from 'lib/mdx/get-articles';
import mdxComponents from 'lib/mdx/mdx-components';
import { DocumentPostProps, StaticPathParams } from 'lib/mdx/types';

const contentPagedir = 'embedded';
export type FsPromises = typeof promises;

const EmbeddedPosts: FC<DocumentPostProps> = ({
  content,
  navigationStructure,
}) => {
  // for client side rendering
  const hydratedContent =
    content &&
    hydrate(content, {
      components: mdxComponents,
    });

  return (
    <>
      <SectionNavigation items={navigationStructure} />
      <ArticleWrapper>{hydratedContent}</ArticleWrapper>
    </>
  );
};

/**
 * Create all the slugs (paths) for this page
 */
export async function getStaticPaths() {
  const paths = await getArticleSlugs(contentPagedir, promises, resolve);

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
export async function getStaticProps({
  params: { slug },
}: StaticPathParams): Promise<{ props: DocumentPostProps }> {
  const {
    contentNavStructure,
    currentPagesContent,
    frontMatterData,
  } = await getArticles(slug, contentPagedir, promises, resolve);

  return {
    props: {
      navigationStructure: contentNavStructure,
      content: currentPagesContent,
      frontmatter: frontMatterData,
    },
  };
}

export default EmbeddedPosts;

import { promises } from 'fs';
import { resolve } from 'path';

import hydrate from 'next-mdx-remote/hydrate';
import React, { FC } from 'react';
import styled from 'styled-components';

import ArticleWrapper from 'components/ArticleWrapper';
import DesktopTableOfContents from 'components/DesktopTableOfContents';
import SectionNavigation from 'components/SectionNavigation';
import mdxComponents from 'lib/mdx/mdx-components';
import getArticle from 'lib/mdx/page-fetching/get-article';
import getArticleSlugs from 'lib/mdx/page-fetching/get-article-slugs';
import {
  DocumentPostProps,
  NavigationArticle,
  StaticArticlePathParams,
} from 'lib/mdx/types';
import navigationStructure from 'lib/node/platform-nav-config.json';

const contentPagedir = 'platform';

export const TableOfContentWrapper = styled.div`
  width: 200px;
`;

export const TableOfContentStickyWrapper = styled.div`
  position: sticky;
  top: 100px;
`;

const PlatformPosts: FC<DocumentPostProps> = ({
  content,
  frontmatter,
  tableOfContents,
}) => {
  // for client side rendering
  const hydratedContent =
    content &&
    hydrate(content, {
      components: mdxComponents,
    });

  return (
    <>
      <SectionNavigation
        items={(navigationStructure as { config: NavigationArticle[] }).config}
      />

      <ArticleWrapper id="article-content">
        <h1>{frontmatter?.title}</h1>
        <br />
        {hydratedContent}
      </ArticleWrapper>

      <TableOfContentWrapper>
        <TableOfContentStickyWrapper>
          <DesktopTableOfContents tableOfContents={tableOfContents} />
        </TableOfContentStickyWrapper>
      </TableOfContentWrapper>
    </>
  );
};

/**
 * Create all the slugs (paths) for this page
 */
export const getStaticPaths = async () => {
  const paths = await getArticleSlugs(contentPagedir, promises, resolve);

  return {
    paths,
    fallback: false,
  };
};

/**
 * Source all content on build (via either SSR or SSG). Powerful as agnostic to source. We
 * Could source from multiple data sources easily which will makes transitioning in the future
 * much much easier.
 */
export const getStaticProps = async ({
  params: { articleSlug },
}: StaticArticlePathParams) => {
  const { pageContent, frontMatterData, currentPageTocData } = await getArticle(
    articleSlug,
    contentPagedir,
    promises,
    resolve,
  );

  return {
    props: {
      content: pageContent,
      frontmatter: frontMatterData,
      tableOfContents: currentPageTocData,
    },
  };
};

export default PlatformPosts;

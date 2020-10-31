import { promises } from 'fs';
import { resolve } from 'path';

import hydrate from 'next-mdx-remote/hydrate';
import React, { FC, useState } from 'react';

import ArticleWrapper from 'components/ArticleWrapper';
import DesktopTableOfContents from 'components/DesktopTableOfContents';
import SectionNavigation from 'components/SectionNavigation';
import mdxComponents from 'lib/mdx/mdx-components';
import getConnector from 'lib/mdx/page-fetching/get-connector';
import getConnectorSlugs from 'lib/mdx/page-fetching/get-connector-slugs';
import {
  MdxRenderedToString,
  NavigationArticle,
  StaticConnectorPathParams,
  TableOfContents,
} from 'lib/mdx/types';
import { TableOfContentStickyWrapper } from 'pages/embedded/[...articleSlug]';
import { TableOfContentWrapper } from 'pages/platform/[...articleSlug]';

interface ConnectorListProps {
  navigationStructure: NavigationArticle[];
  content?: MdxRenderedToString;
  frontmatter?: Record<string, string>;
  tableOfContents: TableOfContents;
}

const Connector: FC<ConnectorListProps> = ({
  content,
  frontmatter,
  navigationStructure,
  tableOfContents,
}) => {
  // prevents immedaite re-render causing SC errors for miss-match classnames
  const [toc] = useState(tableOfContents);

  // for client side rendering
  const hydratedContent =
    content &&
    hydrate(content, {
      components: mdxComponents,
    });

  return (
    <>
      <SectionNavigation items={navigationStructure} />

      <ArticleWrapper id="article-content">
        <h1>{frontmatter?.title}</h1>
        <br />
        {hydratedContent}
      </ArticleWrapper>
      <TableOfContentWrapper>
        <TableOfContentStickyWrapper>
          <DesktopTableOfContents tableOfContents={toc} />
        </TableOfContentStickyWrapper>
      </TableOfContentWrapper>
    </>
  );
};

/**
 * Create all the slugs (paths) for this page
 */
export const getStaticPaths = async () => {
  const paths = await getConnectorSlugs(promises, resolve);

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
  params: { connector, connectorList },
}: StaticConnectorPathParams) => {
  const {
    contentNavStructure,
    pageContent,
    frontMatterData,
    currentPageTocData,
  } = await getConnector(`${connectorList}/${connector}`, promises, resolve);
  return {
    props: {
      navigationStructure: contentNavStructure,
      content: pageContent,
      frontmatter: frontMatterData,
      tableOfContents: currentPageTocData,
    },
  };
};

export default Connector;

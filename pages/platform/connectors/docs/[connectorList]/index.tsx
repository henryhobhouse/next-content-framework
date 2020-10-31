import { promises } from 'fs';
import { resolve } from 'path';

import hydrate from 'next-mdx-remote/hydrate';
import React, { FC, useState } from 'react';

import ArticleWrapper from 'components/ArticleWrapper';
import Connector from 'components/connector';
import DesktopTableOfContents from 'components/DesktopTableOfContents';
import SectionNavigation from 'components/SectionNavigation';
import navigationStructure from 'lib/build-scripts/platform-nav-config.json';
import mdxComponents from 'lib/mdx/mdx-components';
import getConnectorList from 'lib/mdx/page-fetching/get-connector-list';
import getConnectorListConnectors from 'lib/mdx/page-fetching/get-connector-list-connectors';
import getConnectorListSlugs from 'lib/mdx/page-fetching/get-connector-list-slugs';
import {
  ConnectorListProps,
  NavigationArticle,
  StaticConnectorListPathParams,
} from 'lib/mdx/types';
import { TableOfContentStickyWrapper } from 'pages/embedded/[...articleSlug]';
import { TableOfContentWrapper } from 'pages/platform/[...articleSlug]';

const ConnectorList: FC<ConnectorListProps> = ({
  content,
  frontmatter,
  tableOfContents,
  connectorListSection,
  connectors,
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
      <SectionNavigation
        items={(navigationStructure as { config: NavigationArticle[] }).config}
      />
      <ArticleWrapper id="article-content">
        <h1>{frontmatter?.title}</h1>
        <br />
        {hydratedContent}
        <div>
          {connectors.map((connector, index) => (
            <Connector
              key={index}
              slug={connector.slug}
              connectorSection={connectorListSection}
              data={connector.frontmatter}
            />
          ))}
        </div>
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
  const paths = await getConnectorListSlugs(promises, resolve);

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
  params: { connectorList },
}: StaticConnectorListPathParams) => {
  const {
    pageContent,
    frontMatterData,
    currentPageTocData,
  } = await getConnectorList(connectorList, promises, resolve);

  const { connectors } = await getConnectorListConnectors(
    connectorList,
    promises,
    resolve,
  );

  return {
    props: {
      content: pageContent,
      frontmatter: frontMatterData,
      tableOfContents: currentPageTocData,
      connectorListSection: connectorList,
      connectors,
    },
  };
};

export default ConnectorList;

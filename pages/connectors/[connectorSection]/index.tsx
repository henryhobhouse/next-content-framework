import { promises } from 'fs';
import { resolve } from 'path';

import hydrate from 'next-mdx-remote/hydrate';
import React, { FC } from 'react';

import ArticleWrapper from 'components/ArticleWrapper';
import Connector from 'components/connector';
import DesktopTableOfContents from 'components/DesktopTableOfContents';
import PortalHead from 'components/DocsHead';
import SectionNavigation from 'components/SectionNavigation';
import mdxComponents from 'lib/next-static-server/mdx-components';
import getConnectorSection from 'lib/next-static-server/page-fetching/get-connector-section';
import getConnectorSectionConnectors from 'lib/next-static-server/page-fetching/get-connector-section-connectors';
import getConnectorSectionSlugs from 'lib/next-static-server/page-fetching/get-connector-section-slugs';
import {
  ConnectorSectionProps,
  NavigationArticle,
  StaticConnectorSectionPathParams,
} from 'lib/next-static-server/types';
import navigationStructure from 'lib/server/connectors-nav-config.json';
import { TableOfContentStickyWrapper } from 'pages/embedded/[...articleSlug]';
import { TableOfContentWrapper } from 'pages/platform/[...articleSlug]';

const ConnectorSection: FC<ConnectorSectionProps> = ({
  content,
  frontmatter,
  tableOfContents,
  connectorSectionName,
  connectors,
}) => {
  // for client side rendering
  const hydratedContent =
    content &&
    hydrate(content, {
      components: mdxComponents,
    });

  return (
    <>
      <PortalHead
        title={frontmatter?.title}
        description={frontmatter?.description}
        image={frontmatter?.image}
      />

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
              connectorSection={connectorSectionName}
              data={connector.frontmatter}
            />
          ))}
        </div>
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
  const paths = await getConnectorSectionSlugs(promises, resolve);

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
  params: { connectorSection },
}: StaticConnectorSectionPathParams) => {
  const {
    pageContent,
    frontMatterData,
    currentPageTocData,
  } = await getConnectorSection(connectorSection, promises, resolve);

  const { connectors } = await getConnectorSectionConnectors(
    connectorSection,
    promises,
    resolve,
  );

  return {
    props: {
      content: pageContent,
      frontmatter: frontMatterData,
      tableOfContents: currentPageTocData,
      connectorSectionName: connectorSection,
      connectors,
    },
  };
};

export default ConnectorSection;

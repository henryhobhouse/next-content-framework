import hydrate from 'next-mdx-remote/hydrate';
import React, { FC } from 'react';

import ArticleWrapper from 'components/ArticleWrapper';
import DesktopTableOfContents from 'components/DesktopTableOfContents';
import PortalHead from 'components/DocsHead';
import SectionNavigation from 'components/SectionNavigation';
import mdxComponents from 'lib/next-static-server/mdx-components';
import getConnector from 'lib/next-static-server/page-fetching/get-connector';
import getConnectorSlugs from 'lib/next-static-server/page-fetching/get-connector-slugs';
import {
  MdxRenderedToString,
  NavigationArticle,
  StaticConnectorPathParams,
  TableOfContents,
} from 'lib/next-static-server/types';
import navigationStructure from 'lib/server/connectors-nav-config.json';
import { TableOfContentStickyWrapper } from 'pages/embedded/[...articleSlug]';
import { TableOfContentWrapper } from 'pages/platform/[...articleSlug]';

interface ConnectorSectionProps {
  content?: MdxRenderedToString;
  frontmatter?: Record<string, string>;
  tableOfContents: TableOfContents;
}

const Connector: FC<ConnectorSectionProps> = ({
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
  const paths = await getConnectorSlugs();

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
  params: { connector, connectorSection },
}: StaticConnectorPathParams) => {
  const {
    pageContent,
    frontMatterData,
    currentPageTocData,
  } = await getConnector(`${connectorSection}/${connector}`);

  return {
    props: {
      content: pageContent,
      frontmatter: frontMatterData,
      tableOfContents: currentPageTocData,
    },
  };
};

export default Connector;

import NextHead from 'next/head';
import { useRouter } from 'next/router';
import React, { FC } from 'react';

import headConfig from './HeadConfig';

interface Props {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
}

// Add env varaible to determine here
const isDeployedBranch = false;

/**
 * HTML page header to include title, description and favicons
 */
const PortalHead: FC<Props> = ({
  title,
  description,
  keywords,
  url = headConfig.siteUrl,
  image = headConfig.image,
}) => {
  const aggregatedDescription = description
    ? `${description}. ${headConfig.description}`
    : headConfig.description;
  const aggregatedTitle = headConfig.title
    ? `${title} - ${headConfig.title}`
    : headConfig.title;
  const router = useRouter();

  return (
    <NextHead>
      {!isDeployedBranch && (
        <meta name="robots" content="noindex" key="robots" />
      )}
      <meta charSet="UTF-8" />
      <title> {aggregatedTitle} </title>
      <meta
        name="title"
        content={`Documentation: ${title ?? headConfig.title}`}
      />
      <meta
        name="description"
        content={aggregatedDescription}
        key="description"
      />
      <meta
        name="keywords"
        content={
          keywords ? `${keywords}, ${headConfig.keywords}` : headConfig.keywords
        }
        key="keywords"
      />
      <meta
        name="og:title"
        property="og:title"
        content={`Documentation: ${title ?? headConfig.title}`}
      />
      <meta
        name="og:description"
        property="og:description"
        content={aggregatedDescription}
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={headConfig.siteName} />
      <link
        rel="canonical"
        href={`${headConfig.siteUrl}${router.asPath}`}
        data-baseprotocol="https"
        data-basehost="tray.io"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/documentation/favicon.png"
      />
      <link
        rel="sitemap"
        type="application/xml"
        href="/documentation/sitemap.xml"
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
        key="viewport"
      />
    </NextHead>
  );
};

export default PortalHead;

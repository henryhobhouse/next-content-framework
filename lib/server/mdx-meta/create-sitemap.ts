import { promises } from 'fs';
import { nextPublicDirectory } from '../../next-static-server/mdx-parse';
import { currentWorkingDirectory } from '../constants';
import { NodeData } from './create-mdx-node-data-model';

const sitemapHeader =
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">';
const sitemapFooter = '</urlset>';
const appUrl = 'https://tray.io/documentation';
const sitemapFileName = 'sitemap.xml';
const sitemapPath = `${currentWorkingDirectory}/${nextPublicDirectory}/${sitemapFileName}`;

const createSitemap = async (contentRootNodesData: NodeData[]) => {
  if (process.env.NODE_ENV !== 'production') return;
  let xmlContent = `<url><loc>${appUrl}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`;

  contentRootNodesData.forEach((node) => {
    xmlContent += `<url>
      <loc>${appUrl}${node.slug}</loc>
      <changefreq>daily</changefreq><priority>0.7</priority>
    </url>`;
  });

  const sitemapContent = `${sitemapHeader}${xmlContent}${sitemapFooter}`;

  logger.info(`Creating sitemap for ${contentRootNodesData.length + 1} pages`);

  await promises.writeFile(sitemapPath, sitemapContent);
};

export default createSitemap;

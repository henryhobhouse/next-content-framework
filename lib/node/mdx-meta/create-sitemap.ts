import { promises } from 'fs';
import { nextPublicDirectory } from '../../page-mdx/mdx-parse';
import { NodeData } from './recursive-parse-mdx';

const sitemapHeader =
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">';
const sitemapFooter = '</urlset>';
const appUrl = 'https://tray.io/documentation';
const sitemapFileName = 'sitemap.xml';
const sitemapPath = `${process.cwd()}/${nextPublicDirectory}/${sitemapFileName}`;

const createSitemap = async (contentRootNodesData: NodeData[]) => {
  if (process.env.VERCEL_ENV !== 'production') return;
  let xmlContent = `<url><loc>${appUrl}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`;

  contentRootNodesData.forEach((node) => {
    xmlContent += `<url>
      <loc>${appUrl}${node.slug}</loc>
      <changefreq>daily</changefreq><priority>0.7</priority>
    </url>`;
  });

  const sitemapContent = `${sitemapHeader}${xmlContent}${sitemapFooter}`;

  await promises.writeFile(sitemapPath, sitemapContent);
};

export default createSitemap;

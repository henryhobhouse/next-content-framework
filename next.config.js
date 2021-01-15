const createSiteMetaData = require('./lib/node/create-site-meta-data');
const redirectsConfig = require('./redirects');

/**
 * Next configuration.
 *
 * Note. Using webpack 5 (https://nextjs.org/blog/next-9-5#webpack-5-support-beta)
 */
module.exports = {
  basePath: '/documentation',
  reactStrictMode: true,
  images: {
    path: '/documentation/_next/image',
  },
  async redirects() {
    // TODO refactor to _app getStaticProps when available
    // issue https://github.com/vercel/next.js/discussions/10949#discussioncomment-110524
    await createSiteMetaData();

    return redirectsConfig;
  },
};

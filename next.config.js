const createSiteMetaData = require('./lib/node/create-site-meta-data');
const redirectsConfig = require('./redirects');

// TODO: Add lodash webpack pluging once https://github.com/lodash/lodash-webpack-plugin/issues/167 is resolved.

/**
 * Next configuration.
 *
 * Note. Using webpack 5 (https://nextjs.org/blog/next-9-5#webpack-5-support-beta)
 */
module.exports = {
  basePath: '/documentation',
  reactStrictMode: true,
  async redirects() {
    // TODO refactor to _app getStaticProps when available
    // issue https://github.com/vercel/next.js/discussions/10949#discussioncomment-110524
    await createSiteMetaData();

    return redirectsConfig;
  },
};

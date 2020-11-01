const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const transpileModules = require('next-transpile-modules')(['lodash-es']);

const createSiteMetaData = require('./lib/build-scripts/create-site-meta-data');
const redirectsConfig = require('./redirects');

module.exports = withPlugins(
  [
    [
      withImages,
      {
        esModule: true,
        webpack(config) {
          config.module.rules.push({
            test: /\.(png|jpe?g|gif|svg)$/i,
            use: [
              {
                loader: 'url-loader',
              },
            ],
          });
          return config;
        },
      },
    ],
    transpileModules,
  ],
  {
    basePath: '/documentation',
    reactStrictMode: true,
    redirects() {
      return redirectsConfig;
    },
    webpack: async (config, { isServer }) => {
      if (isServer)
        // TODO refactor to _app getStaticProps when available
        // issue https://github.com/vercel/next.js/discussions/10949#discussioncomment-110524
        await createSiteMetaData();

      // Important: return the modified config
      return config;
    },
  },
);

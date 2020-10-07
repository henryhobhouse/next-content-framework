const sass = require('@zeit/next-sass');
const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const transpileModules = require('next-transpile-modules')(['lodash-es']);

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
    [
      sass,
      {
        cssModules: true,
      },
    ],
  ],
  {
    async redirects() {
      return redirectsConfig;
    },
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
);

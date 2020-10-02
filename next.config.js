const withMDX = require('@next/mdx')({
  extension: /\.(md|mdx)$/,
});
const sass = require('@zeit/next-sass');
const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const transpileModules = require('next-transpile-modules')(['lodash-es']);

module.exports = withPlugins(
  [
    [
      withImages,
      {
        webpack(config) {
          config.module.rules.push({
            test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
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
    [
      withMDX,
      {
        pageExtensions: ['tsx'],
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
    webpack(config) {
      config.module.rules.push({
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
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

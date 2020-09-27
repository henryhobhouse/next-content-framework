const sass = require('@zeit/next-sass');
const withPlugins = require('next-compose-plugins');
const optimizedImages = require('next-optimized-images');
const transpileModules = require('next-transpile-modules')(['lodash-es']);

module.exports = withPlugins([
  [transpileModules],
  [
    sass,
    {
      cssModules: true,
    },
  ],
  [optimizedImages, {}],
]);

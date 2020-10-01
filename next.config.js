const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
});
const sass = require('@zeit/next-sass');
const withPlugins = require('next-compose-plugins');
const optimizedImages = require('next-optimized-images');
const transpileModules = require('next-transpile-modules')(['lodash-es']);

module.exports = withPlugins([
  [
    optimizedImages,
    {
      handleImages: ['jpeg', 'png', 'svg', 'gif'],
      mozjpeg: {
        quality: 50,
      },
    },
  ],
  withMDX,
  transpileModules,
  [
    sass,
    {
      cssModules: true,
    },
  ],
]);

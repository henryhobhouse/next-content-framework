const config = {
  presets: ['next/babel'],
  plugins: [
    'react-optimized-image/plugin',
    ['styled-components', { ssr: true, displayName: true }],
  ],
};

module.exports = config;

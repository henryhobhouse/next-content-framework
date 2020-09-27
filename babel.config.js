const config = {
  presets: ['next/babel'],
  plugins: [
    ['styled-components', { ssr: true, displayName: true }],
    'react-optimized-image/plugin',
  ],
};

module.exports = config;

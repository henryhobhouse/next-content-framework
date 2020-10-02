const config = {
  presets: ['next/babel'],
  plugins: [['styled-components', { ssr: true, displayName: true }]],
};

module.exports = config;

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier/react',
    'esnext',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
  env: {
    browser: true,
    node: true,
  },
  plugins: ['react-hooks', '@typescript-eslint', 'eslint-plugin-react'],
  overrides: [
    {
      files: ['*.js'],
      extends: ['@x-and-ai/eslint-config-ts-node'],
      rules: {
        'array-bracket-spacing': 0,
        indent: ['error', 2],
        '@typescript-eslint/no-var-requires': 0,
        'import/no-commonjs': 0,
        'template-curly-spacing': 0,
        'operator-linebreak': 0,
        'valid-jsdoc': 0,
        'arrow-parens': 0,
        'no-extra-parens': 0,
        'space-before-function-paren': 0,
        semi: 0,
      },
    },
    {
      files: ['./lib/ts-node/**/*.ts'],
      extends: ['@x-and-ai/eslint-config-ts-node'],
      rules: {
        'import/no-commonjs': 0,
        '@typescript-eslint/no-var-requires': 0,
      },
    },
  ],
  rules: {
    'react/prop-types': 0,
    'no-use-before-define': 0,
    'react/display-name': 0,
    'import/no-nodejs-modules': 0,
    'import/prefer-default-export': 0,
    'react-hooks/rules-of-hooks': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
    'react/jsx-uses-vars': 1,
    'react/react-in-jsx-scope': 1,
    'react/jsx-uses-react': 1,
    'import/no-named-as-default': 0,
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'no-console': 'error',
  },
};

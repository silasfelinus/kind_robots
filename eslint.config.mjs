import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['**/*.ts', '**/*.tsx'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: false, // No semicolons
        singleQuote: true, // Use single quotes
        useTabs: false, // Use spaces for indentation
        tabWidth: 2, // Sets the number of spaces per indentation level
        printWidth: 80, // Wraps lines at 80 characters
        arrowParens: 'avoid', // Omits parens when they are not needed for arrow functions
        bracketSpacing: true, // Puts spaces between brackets in object literals
      },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn on unused variables, ignore if prefixed with underscore
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Disable requiring explicit return types on functions and class methods
    '@typescript-eslint/no-explicit-any': 'off', // Allows usage of 'any' type without warning
    'comma-dangle': 'never',
  },
  parserOptions: {
    ecmaVersion: 2020, // Specifies the version of ECMAScript syntax
    sourceType: 'module', // Allows use of imports
    ecmaFeatures: {
      jsx: true, // Allows for parsing of JSX
    },
  },
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  env: {
    browser: true, // Browser global variables
    es2021: true, // Adds all ECMAScript 2021 globals
  },
})

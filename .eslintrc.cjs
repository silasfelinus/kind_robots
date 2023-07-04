module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:prettier/recommended' // Add Prettier recommended configuration
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  // add your custom rules here
  rules: {
    'space-before-function-paren': 'off',
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'off',
    'prefer-const': 'off',
    'require-await': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/no-unused-components': 'off',
    'prettier/prettier': [
      'error',
      {
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'none'
      }
    ] // Add Prettier rules
  }
}

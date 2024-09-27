// eslint.config.js
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Allow self-closing void elements
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/html-self-closing': 'off',
    // other rules you want to customize
  },
  ignores: [
    'node_modules/',
    'dist/',
    'build/',
    '.nuxt/',
    '.output',
    '.env',
    'cypress/*',
    'spec*',
    'cypress/',
    'cypress/e2e/',
    // add other patterns you want to ignore
  ],
})

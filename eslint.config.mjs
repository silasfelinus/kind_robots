// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'

// GLOBAL IGNORES MUST BE THEIR OWN CONFIG OBJECT.
//
// In ESLint flat config, `ignores` only acts globally when it is the ONLY key
// in a config object. Listed alongside `rules`, it merely scopes that one
// object's rules and every other config still lints the files. This list used
// to live in the same object as `rules` below, so none of it took effect:
// `cypress/` was named three separate ways and ESLint linted it anyway,
// contributing 145 of the 554 problems in the t-099 ratchet baseline
// (`sample/` added 11 more). Verified with `ESLint#isPathIgnored`, which
// returned false for every path here before the split.
//
// Keep this object ignores-only. Adding any sibling key silently turns the
// whole list back into a no-op.
export default withNuxt(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.nuxt/',
      '.output',
      '.env',
      'cypress/',
      'spec*',
      'sample/',
    ],
  },
  {
    rules: {
      // Allow self-closing void elements
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      // other rules you want to customize
    },
  },
)

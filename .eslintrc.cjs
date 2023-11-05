module.exports = {
  root: true,
  extends: ['@nuxtjs/eslint-config-typescript', 'plugin:prettier/recommended'],
  rules: {
    // Disables eslint throwing an error on script setup vue files
    'import/first': 'off',
    'no-console': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
};

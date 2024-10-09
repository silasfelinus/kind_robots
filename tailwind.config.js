/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{html,ts,js,vue}',
    './components/**/*.{html,ts,js,vue}',
  ],
  safelist: [
    {
      pattern: /line-md:home-md-twotone/,
    },
    {
      pattern: /fluent:bot-add-20-regular/,
    },
    {
      pattern: /fluent:chat-bubbles-question-16-regular/,
    },
    {
      pattern: /game-icons:easel/,
    },
    {
      pattern: /material-symbols:art-track-outline-rounded/,
    },
    {
      pattern: /game-icons:gear-hammer/,
    },
    {
      pattern: /mingcute:settings-6-fill/,
    },
    {
      pattern: /emojione:butterfly/,
    },
    {
      pattern: /mdi-brush/,
    },
    {
      pattern: /mdi:chevron-left/,
    },
    {
      pattern: /mdi:chevron-right/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: ['@tailwindcss/typography', 'daisyui'],
  daisyui: {
    styled: true,
    themes: [
      true, // this will include the default light and dark themes
    ],
    rtl: false,
    logs: true,
  },
}

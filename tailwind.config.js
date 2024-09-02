/** @type {import('tailwindcss').Config} */
export default {
      safelist: [
    {
      pattern: /(icon|text-gray|cursor-pointer|transition-shadow|line-md|fluent|mdi|game-icons|emojione-monotone|material-symbols|mingcute|fxemoji)/,
    },
  ],
  jit: true,
  content: [
    './pages/**/*.{html,ts,js,vue}',
    './components/**/*.{html,ts,js,vue}',
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

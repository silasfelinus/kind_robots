/** @type {import('tailwindcss').Config} */
export default {
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

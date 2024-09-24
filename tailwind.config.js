import { sidebarLinks } from './assets/sidebar'

/** @type {import('tailwindcss').Config} */
export default {
  safelist: sidebarLinks.map((link) => link.icon), // Safelist all icons
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

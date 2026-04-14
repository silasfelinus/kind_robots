// /tailwind.config.ts
import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'

export default {
  content: [
    './pages/**/*.{html,ts,js,vue}',
    './components/**/*.{html,ts,js,vue}',
    './layouts/**/*.{html,ts,js,vue}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [typography, daisyui],
  daisyui: {
    styled: true,
    themes: [true],
    rtl: false,
    logs: true,
  },
}

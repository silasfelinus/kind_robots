/** @type {import('tailwindcss').Config} */
module.exports = {
  jit: true,
  content: ['./pages/**/*.{html,ts,js,vue}', './components/**/*.{html,ts,js,vue}'],
  theme: {
    extend: {},
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },
  plugins: ['@tailwindcss/typography', 'daisyui'],
  daisyui: {
    styled: true,
    themes: true,
    rtl: false,
    logs: true
  }
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  jit: true,
  content: ['./pages/**/*.{html,ts,js,vue}', './components/**/*.{html,ts,js,vue}'],
  theme: {
    extend: {},
    screens: {
      sm: '600px',
      md: '900px',
      lg: '1200px',
      xl: '1536px',
      '2xl': '1920px'
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

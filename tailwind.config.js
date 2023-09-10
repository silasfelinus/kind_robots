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
    themes: [
      true, // this will include the default light and dark themes
      {
        superk8: {
          primary: '#ff4757', // Update with your desired color
          secondary: '#1e90ff', // Update with your desired color
          accent: '#2ed573', // Update with your desired color
          neutral: '#3d4451',
          base: {
            100: '#ffffff' // Define base-100 here
            // You can define other base colors as well
          },
          info: '#0abde3', // Consider adding other color variations like info, success, warning, and error
          success: '#10ac84',
          warning: '#feca57',
          error: '#ee5253',
          // ... (add other color variations as needed)
          '--rounded-box': '1rem',
          '--rounded-btn': '0.5rem',
          '--rounded-badge': '1.9rem',
          '--animation-btn': '0.25s',
          '--animation-input': '0.2s',
          '--btn-text-case': 'uppercase',
          '--btn-focus-scale': '0.95',
          '--border-btn': '1px',
          '--tab-border': '1px',
          '--tab-radius': '0.5rem'
        }
      }
    ],
    rtl: false,
    logs: true
  }
}

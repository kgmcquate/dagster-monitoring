/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dagster dark theme colors
        dagster: {
          // Backgrounds
          'bg-default': 'rgb(3, 6, 21)',
          'bg-light': 'rgb(25, 31, 41)',
          'bg-lighter': 'rgb(33, 39, 48)',
          'bg-disabled': 'rgb(48, 56, 61)',
          
          // Text
          'text-default': 'rgb(255, 255, 255)',
          'text-light': 'rgb(206, 212, 218)',
          'text-lighter': 'rgb(155, 165, 173)',
          'text-disabled': 'rgb(118, 130, 140)',
          
          // Borders
          'border-default': 'rgb(48, 56, 61)',
          'border-hover': 'rgb(94, 106, 99)',
          
          // Accents
          'blue': 'rgb(79, 67, 221)',
          'blue-hover': 'rgb(114, 105, 228)',
          'blue-light': 'rgb(149, 142, 235)',
          'green': 'rgb(75, 180, 210)',
          'green-hover': 'rgb(111, 195, 219)',
          'yellow': 'rgb(234, 177, 89)',
          'yellow-hover': 'rgb(245, 216, 172)',
          'red': 'rgb(210, 66, 53)',
          'red-hover': 'rgb(219, 104, 93)',
          
          // Gray scale
          'gray-990': 'rgb(3, 6, 21)',
          'gray-950': 'rgb(25, 31, 41)',
          'gray-900': 'rgb(33, 39, 48)',
          'gray-850': 'rgb(48, 56, 61)',
          'gray-800': 'rgb(62, 72, 78)',
          'gray-700': 'rgb(94, 106, 99)',
          'gray-600': 'rgb(118, 130, 140)',
          'gray-500': 'rgb(155, 165, 173)',
          'gray-400': 'rgb(182, 191, 199)',
          'gray-300': 'rgb(206, 212, 218)',
          'gray-200': 'rgb(230, 235, 240)',
          'gray-150': 'rgb(245, 247, 249)',
          'gray-100': 'rgb(248, 249, 250)',
          'gray-50': 'rgb(252, 253, 254)',
        }
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        'mono': ['Roboto Mono', 'SF Mono', 'Monaco', 'Menlo', 'Cascadia Mono', 'Segoe UI Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'dagster': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'dagster-lg': '0 4px 6px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#E91E63',
        secondary: '#9C27B0',
        accent: '#FF4081',
        background: '#FFFFFF',
        text: {
          primary: '#212121',
          secondary: '#757575',
          light: '#BDBDBD'
        }
      }
    },
  },
  plugins: [],
};
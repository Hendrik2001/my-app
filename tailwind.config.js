/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        evergreen: '#003B3C',
        'slate-muted': '#8CA7B6',
      }
    },
  },
  plugins: [],
}
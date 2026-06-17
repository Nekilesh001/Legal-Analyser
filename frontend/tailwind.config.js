/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adminBase: '#0D518C',
        userBase: '#41C0F2'
      }
    },
  },
  plugins: [],
}

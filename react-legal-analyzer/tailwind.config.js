/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'devanagari': ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
        'tamil': ['Noto Sans Tamil', 'Inter', 'sans-serif'],
        'telugu': ['Noto Sans Telugu', 'Inter', 'sans-serif'],
        'bengali': ['Noto Sans Bengali', 'Inter', 'sans-serif'],
        'gujarati': ['Noto Sans Gujarati', 'Inter', 'sans-serif'],
        'kannada': ['Noto Sans Kannada', 'Inter', 'sans-serif'],
        'malayalam': ['Noto Sans Malayalam', 'Inter', 'sans-serif'],
        'punjabi': ['Noto Sans Gurmukhi', 'Inter', 'sans-serif'],
        'odia': ['Noto Sans Oriya', 'Inter', 'sans-serif'],
      },
      colors: {
        'legal': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'risk': {
          'low': '#10b981',
          'medium': '#f59e0b',
          'high': '#ef4444',
          'critical': '#8b5cf6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'r3-gold': '#f6b034',
        'r3-slate': '#1e293b',
        'r3-bg': '#f8fafc',
        'r3-text': '#111827',
        'r3-muted': '#64748b'
      },
      fontFamily: {
        'jakarta': ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
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
        'jakarta': ['var(--font-jakarta)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        secondary: '#8b5cf6',
        bg: {
          DEFAULT: '#0a0a0a',
          light: '#1a1a1a',
          lighter: '#2a2a2a',
        },
        text: {
          DEFAULT: '#ffffff',
          muted: '#a0a0a0',
        },
        border: '#333',
        success: '#10b981',
      },
      borderRadius: {
        'zen': '12px',
      },
      boxShadow: {
        'zen': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}

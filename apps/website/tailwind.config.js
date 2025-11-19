/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#818cf8',
        },
        secondary: '#8b5cf6',
        // Framework-level dark mode: Use CSS variables that auto-switch
        // Components use bg-bg, text-text etc. once, no dark: prefixes needed
        bg: {
          DEFAULT: 'var(--color-bg)',
          light: 'var(--color-bg-light)',
          lighter: 'var(--color-bg-lighter)',
          // Keep explicit dark variants for components that already use them
          dark: {
            DEFAULT: '#0a0a0a',
            light: '#1a1a1a',
            lighter: '#2a2a2a',
          },
        },
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          // Keep explicit dark variants for components that already use them
          dark: {
            DEFAULT: '#ffffff',
            muted: '#a0a0a0',
          },
        },
        border: {
          DEFAULT: 'var(--color-border)',
          // Keep explicit dark variant for components that already use it
          dark: '#333',
        },
        success: '#10b981',
      },
      borderRadius: {
        'zen': '12px',
      },
      boxShadow: {
        'zen': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'zen-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

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
          orange: '#e98003',     // Updated from #FF8C00 to #e98003
          'orange-light': '#FFA940',
          'orange-dark': '#D97706',
          gold: '#e98003',       // Keeping gold alias for backwards compatibility, updated to match
          'gold-light': '#FFA940',
          'gold-dark': '#D97706',
          emerald: '#10B981',    // Base emerald green
          'emerald-light': '#6EE7B7',
          'emerald-dark': '#047857',
        },
        dark: {
          background: '#121212', // Keeping as is
          surface: '#111827',    // Updated from #1E1E1E to #111827
          text: '#E0E0E0',
        },
        light: {
          background: '#FFFFFF',
          surface: '#F5F5F5',
          text: '#333333',
        }
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};
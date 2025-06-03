/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      spacing: {
        'safe-top': 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))',
        'safe-bottom': 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))',
        'safe-left': 'var(--safe-area-inset-left, env(safe-area-inset-left, 0px))',
        'safe-right': 'var(--safe-area-inset-right, env(safe-area-inset-right, 0px))',
      },
      padding: {
        'safe': 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) var(--safe-area-inset-right, env(safe-area-inset-right, 0px)) var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) var(--safe-area-inset-left, env(safe-area-inset-left, 0px))',
        'safe-top': 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))',
        'safe-bottom': 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))',
        'safe-left': 'var(--safe-area-inset-left, env(safe-area-inset-left, 0px))',
        'safe-right': 'var(--safe-area-inset-right, env(safe-area-inset-right, 0px))',
      },
      margin: {
        'safe-top': 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))',
        'safe-bottom': 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))',
        'safe-left': 'var(--safe-area-inset-left, env(safe-area-inset-left, 0px))',
        'safe-right': 'var(--safe-area-inset-right, env(safe-area-inset-right, 0px))',
      }
    },
  },
  plugins: [],
}


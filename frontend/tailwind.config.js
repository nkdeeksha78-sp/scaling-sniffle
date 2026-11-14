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
        guard: {
          bg: '#0B1220',
          sidebar: '#0D1728',
          card: '#111C2E',
          cardHover: '#16233B',
          border: '#1E2D4A',
          primary: '#38BDF8',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          text: '#E2E8F0',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(56, 189, 248, 0.35)',
        'glow-success': '0 0 20px -5px rgba(34, 197, 94, 0.35)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.35)',
        'glow-warning': '0 0 20px -5px rgba(245, 158, 11, 0.35)',
      },
    },
  },
  plugins: [],
}

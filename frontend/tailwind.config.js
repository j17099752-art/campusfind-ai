/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          dark:    '#3730a3',
          light:   '#818cf8',
        },
        secondary: '#7c3aed',
        accent:    '#06b6d4',
        danger: {
          DEFAULT: '#ef4444',
          dark:    '#b91c1c',
        },
        success: {
          DEFAULT: '#10b981',
          dark:    '#047857',
        },
        warning: '#f59e0b',
        'admin-gold': '#d97706',
        'bg-app':  '#f8faff',
        'bg-card': '#ffffff',
        'bg-soft': '#eef2ff',
        'text-main':  '#1e1b4b',
        'text-muted': '#6b7280',
        'text-light': '#9ca3af',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '14px',
        lg: '22px',
        full: '9999px',
      },
      boxShadow: {
        card:  '0 2px 16px rgba(0,0,0,0.07)',
        md:    '0 4px 20px rgba(79,70,229,0.12)',
        lg:    '0 10px 40px rgba(79,70,229,0.18)',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease',
        'pulse-dot':  'pulseDot 2s infinite',
        'blob-morph': 'blobMorph 8s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'counter':    'counter 0.8s ease',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%,100%': { transform: 'scale(1)' },
          '50%':     { transform: 'scale(1.15)' },
        },
        blobMorph: {
          '0%,100%': { borderRadius: '60% 40% 70% 30%/50% 60% 40% 50%' },
          '33%':     { borderRadius: '40% 60% 30% 70%/60% 40% 60% 40%' },
          '66%':     { borderRadius: '50% 50% 60% 40%/40% 70% 30% 60%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-16px)' },
        },
      },
    },
  },
  plugins: [],
}

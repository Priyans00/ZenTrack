/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#1a1a24',
          'card-hover': '#22222e',
          border: '#2a2a3a',
        },
        accent: {
          teal: '#00d4aa',
          'teal-dim': 'rgba(0, 212, 170, 0.15)',
          coral: '#ff6b6b',
          'coral-dim': 'rgba(255, 107, 107, 0.15)',
          blue: '#4dabf7',
          'blue-dim': 'rgba(77, 171, 247, 0.15)',
          purple: '#9775fa',
          'purple-dim': 'rgba(151, 117, 250, 0.15)',
          yellow: '#ffd43b',
          'yellow-dim': 'rgba(255, 212, 59, 0.15)',
          pink: '#f06595',
          'pink-dim': 'rgba(240, 101, 149, 0.15)',
        },
        primary: {
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
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-position': 'right center'
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            transform: 'translate(-50%, -50%)',
          },
          '25%': {
            transform: 'translate(50%, -50%)',
          },
          '50%': {
            transform: 'translate(50%, 50%)',
          },
          '75%': {
            transform: 'translate(-50%, 50%)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.dark-card': {
          'background': '#1a1a24',
          'border': '1px solid #2a2a3a',
          'border-radius': '1rem',
          'transition': 'all 0.2s ease',
        },
        '.dark-card:hover': {
          'background': '#22222e',
          'border-color': '#3a3a4a',
        },
        '.gradient-primary': {
          background: 'linear-gradient(135deg, #00d4aa 0%, #4dabf7 100%)',
        },
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-teal': {
          'background': 'linear-gradient(135deg, #00d4aa 0%, #4dabf7 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.card': {
          'background': '#1a1a24',
          'border': '1px solid #2a2a3a',
          'border-radius': '1rem',
          'padding': '1.5rem',
          'transition': 'all 0.2s ease',
        },
        '.border-gradient': {
          'border-image': 'linear-gradient(45deg, #00d4aa, #4dabf7) 1',
        },
        '.stat-card': {
          'background': '#1a1a24',
          'border': '1px solid #2a2a3a',
          'border-radius': '1rem',
          'padding': '1.25rem 1.5rem',
        },
        '.panel': {
          'background': '#1a1a24',
          'border': '1px solid #2a2a3a',
          'border-radius': '1rem',
          'padding': '1.5rem',
        },
        '.list-item': {
          'padding': '1rem 1.25rem',
          'border-bottom': '1px solid #2a2a3a',
          'transition': 'background 0.15s ease',
        },
        '.list-item:hover': {
          'background': '#22222e',
        },
        '.list-item:last-child': {
          'border-bottom': 'none',
        },
        '.badge': {
          'padding': '0.25rem 0.75rem',
          'border-radius': '9999px',
          'font-size': '0.75rem',
          'font-weight': '500',
        },
        '.badge-teal': {
          'background': 'rgba(0, 212, 170, 0.15)',
          'color': '#00d4aa',
        },
        '.badge-coral': {
          'background': 'rgba(255, 107, 107, 0.15)',
          'color': '#ff6b6b',
        },
        '.badge-blue': {
          'background': 'rgba(77, 171, 247, 0.15)',
          'color': '#4dabf7',
        },
        '.badge-purple': {
          'background': 'rgba(151, 117, 250, 0.15)',
          'color': '#9775fa',
        },
        '.badge-yellow': {
          'background': 'rgba(255, 212, 59, 0.15)',
          'color': '#ffd43b',
        },
        '.progress-bar': {
          'height': '0.5rem',
          'background': '#2a2a3a',
          'border-radius': '9999px',
          'overflow': 'hidden',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

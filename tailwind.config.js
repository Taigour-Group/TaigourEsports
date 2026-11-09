/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.jsx',
    './index.jsx',
    './components/**/*.{js,jsx}',
    './constants/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
    './services/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#0B0F14',
        navy: '#111827',
        cyan: '#22D3EE',
        cyann: '#1be1ff22',
        white: '#F8FAFC',
        tertiary: '#00ff80',
        primary: '#22D3EE',
        accent: '#F8FAFC',
        'bg-dark': '#0B0F14',
        'bg-card': '#111827',
        dark: '#0B0F14'
      },
      fontFamily: {
        space: ['Barlow', 'sans-serif'],
        inter: ['Manrope', 'sans-serif'],
        marker: ['Permanent Marker', 'cursive']
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'blur-in': 'blurIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shine: 'shine 3s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        blurIn: {
          '0%': { filter: 'blur(10px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' }
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' }
        }
      }
    }
  },
  plugins: []
};

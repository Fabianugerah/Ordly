import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#f59e0b",
        accent: "#10b981",
      },
      animation: {
      'fade-in-down': 'fadeInDown 0.8s ease-out forwards',
      'slide-up': 'slideUp 0.8s ease-out forwards',
      'scroll-line': 'scrollLine 2s ease-in-out infinite',
      'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    keyframes: {
      fadeInDown: {
        '0%': { opacity: '0', transform: 'translateY(-20px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      slideUp: {
        '0%': { opacity: '0', transform: 'translateY(40px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      scrollLine: {
        '0%': { transform: 'translateY(-100%)' },
        '100%': { transform: 'translateY(100%)' },
      }
    }
    },
  },
  plugins: [],
};

export default config;
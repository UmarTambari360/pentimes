import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          50:  'hsl(var(--ink-50))',
          100: 'hsl(var(--ink-100))',
          200: 'hsl(var(--ink-200))',
          300: 'hsl(var(--ink-300))',
          400: 'hsl(var(--ink-400))',
          500: 'hsl(var(--ink-500))',
          600: 'hsl(var(--ink-600))',
          700: 'hsl(var(--ink-700))',
          800: 'hsl(var(--ink-800))',
          900: 'hsl(var(--ink-900))',
        },
        amber: {
          DEFAULT: 'hsl(var(--amber))',
          50:  'hsl(var(--amber-50))',
          100: 'hsl(var(--amber-100))',
          200: 'hsl(var(--amber-200))',
          300: 'hsl(var(--amber-300))',
          400: 'hsl(var(--amber-400))',
          500: 'hsl(var(--amber-500))',
          600: 'hsl(var(--amber-600))',
          700: 'hsl(var(--amber-700))',
        },
        paper: {
          DEFAULT: 'hsl(var(--paper))',
          warm:    'hsl(var(--paper-warm))',
          cool:    'hsl(var(--paper-cool))',
        },
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        info:    'hsl(var(--info))',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:  ['var(--font-dm-sans)',  'system-ui', 'sans-serif'],
        mono:  ['var(--font-dm-mono)',  'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl':  ['4.5rem',    { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg':  ['3.75rem',   { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        'display':     ['3rem',      { lineHeight: '1.1',  letterSpacing: '-0.015em' }],
        'headline-xl': ['2.25rem',   { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'headline-lg': ['1.875rem',  { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'headline':    ['1.5rem',    { lineHeight: '1.25' }],
        'body-lg':     ['1.125rem',  { lineHeight: '1.7' }],
        'body':        ['1rem',      { lineHeight: '1.6' }],
        'body-sm':     ['0.9375rem', { lineHeight: '1.6' }],
        'caption':     ['0.8125rem', { lineHeight: '1.5' }],
        'overline':    ['0.75rem',   { lineHeight: '1.5', letterSpacing: '0.08em' }],
      },
      maxWidth: {
        'prose-narrow': '60ch',
        'prose':        '72ch',
        'prose-wide':   '80ch',
        'container':    '1200px',
        'container-lg': '1440px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'editorial':       '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)',
        'editorial-hover': '0 4px 16px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08)',
        'card':            '0 0 0 1px hsl(var(--border)), 0 2px 4px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in':        'fade-in 0.4s ease-out forwards',
        'fade-in-up':     'fade-in-up 0.5s ease-out forwards',
        'slide-in-left':  'slide-in-left 0.4s ease-out forwards',
        'scale-in':       'scale-in 0.3s ease-out forwards',
        'ticker':         'ticker-scroll 40s linear infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'ticker-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
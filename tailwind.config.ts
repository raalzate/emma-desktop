// Los plugins se importan como ESM, no con `require()`: el archivo ya es ESM
// (`import` + `export default`) y Node 25 lo carga como tal, donde `require` no
// existe. La mezcla tumbaba `next dev` en la primera recompilación de Tailwind
// con `ReferenceError: require is not defined`.
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

export default {
  darkMode: ['class'],
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        headline: ['var(--font-display)', 'sans-serif'],
        code: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          deep: 'hsl(var(--primary-deep))',
          soft: 'hsl(var(--primary-soft))',
        },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
        },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Andamiaje pedagógico (fácil/medio/difícil): texto y fondo suaves.
        scaffold: {
          easy: 'hsl(var(--scaffold-easy))',
          'easy-bg': 'hsl(var(--scaffold-easy-bg))',
          mid: 'hsl(var(--scaffold-mid))',
          'mid-bg': 'hsl(var(--scaffold-mid-bg))',
          hard: 'hsl(var(--scaffold-hard))',
          'hard-bg': 'hsl(var(--scaffold-hard-bg))',
        },
        // Categorías de temas/escenas (cat-1…cat-5).
        cat: {
          '1': 'hsl(var(--cat-1))',
          '2': 'hsl(var(--cat-2))',
          '3': 'hsl(var(--cat-3))',
          '4': 'hsl(var(--cat-4))',
          '5': 'hsl(var(--cat-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Tarjetas y burbujas de chat: radio grande fijo de 16px.
        bubble: '1rem',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        // Gamificación (#216): recompensa visible, siempre detrás de motion-safe.
        'xp-float': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.9)' },
          '15%': { opacity: '1', transform: 'translateY(0) scale(1.05)' },
          '70%': { opacity: '1', transform: 'translateY(-10px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-36px) scale(0.95)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'flame-flicker': {
          '0%, 100%': { transform: 'scale(1) rotate(-2deg)' },
          '25%': { transform: 'scale(1.08, 0.96) rotate(2deg)' },
          '50%': { transform: 'scale(0.96, 1.06) rotate(-1deg)' },
          '75%': { transform: 'scale(1.04) rotate(1deg)' },
        },
        'confetti-fall': {
          '0%': { opacity: '1', transform: 'translate3d(0, -10vh, 0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translate3d(var(--confetti-dx), 105vh, 0) rotate(var(--confetti-rot))' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
          '60%, 100%': { transform: 'translateX(220%) skewX(-20deg)' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--accent) / 0.45)' },
          '50%': { boxShadow: '0 0 0 10px hsl(var(--accent) / 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'xp-float': 'xp-float 2.4s ease-out forwards',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-in-right': 'slide-in-right 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'flame-flicker': 'flame-flicker 1.6s ease-in-out infinite',
        'confetti-fall': 'confetti-fall var(--confetti-duration, 2.8s) cubic-bezier(0.25, 0.6, 0.4, 1) forwards',
        shine: 'shine 3.5s ease-in-out infinite',
        'bar-grow': 'bar-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config;

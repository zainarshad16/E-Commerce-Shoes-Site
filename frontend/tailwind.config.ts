import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0F',
        surface: '#121216',
        'surface-elevated': '#18181D',
        'glow-primary': 'var(--glow-primary)',
        'glow-secondary': 'var(--glow-secondary)',
      },
      fontFamily: {
        condensed: ['var(--font-condensed)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backgroundImage: {
        'studio-radial':
          'radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--glow-primary) 16%, transparent), transparent 65%)',
      },
    },
  },
  plugins: [],
};

export default config;

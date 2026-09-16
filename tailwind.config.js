/** @type {import('tailwindcss').Config} */
// Couleurs du site : variables CSS (--fi-*) définies dans src/index.css et
// modifiables par le propriétaire via le Chef (SiteProvider les applique).
const v = (name) => `rgb(var(--fi-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fi: {
          primary: v('primary'),     // #2E7D32 vert forêt
          secondary: v('secondary'), // #4CAF50
          accent: v('accent'),       // #8BC34A lime
          dark: v('dark'),           // #1B5E20
          deep: v('deep'),           // #0f2e13 sections sombres
          light: v('light'),         // #C8E6C9
          mint: v('mint'),           // #E8F5E9
          bg: v('bg'),               // #F9FBF8
          text: v('text'),           // #263238
          soil: v('soil'),           // brun terre (logo)
          loam: v('loam'),           // brun clair
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.6rem, 6vw, 5.25rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 4.5vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.75rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.35rem, 2vw, 1.85rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },
      borderRadius: { '2.5xl': '1.25rem', '4xl': '2rem' },
      boxShadow: {
        leaf: '0 18px 50px -20px rgb(var(--fi-primary) / 0.35)',
        soft: '0 8px 30px -12px rgb(var(--fi-text) / 0.18)',
      },
      maxWidth: { wrap: '76rem' },
    },
  },
  plugins: [],
};

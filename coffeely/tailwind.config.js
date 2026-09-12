/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: ['class', '[data-theme="high-contrast"]'],
  theme: {
    extend: {
      // ─── Paleta migrada 1:1 desde Frontend/CSS/style.css ───────────────────
      colors: {
        // Marca principal
        'dark-olive':  '#4B5136',   // --color-dark-olive  (autoridad, headers, CTAs)
        'sage':        '#8A8F73',   // --color-sage        (acentos secundarios, badges)
        'coffee':      '#6B4426',   // --color-coffee      (brand icon, botones cálidos)
        'cream':       '#E8DCC5',   // --color-cream       (fondos de respiro, badges pill)
        'beige':       '#CBB9A3',   // --color-beige       (bordes suaves, elementos de apoyo)
        'bg-light':    '#F6F4EF',   // --color-bg-light    (fondo de página)
        'card-bg':     '#FFFFFF',   // --color-card-bg
        'text-main':   '#2C2D29',   // --color-text-main
        'text-muted':  '#64665C',   // --color-text-muted
        'border':      '#E0DACF',   // --color-border

        // Semáforo de riesgo (desaturado, apto daltónicos)
        'riesgo-verde':    '#2E7D32',   // --color-success
        'riesgo-verde-bg': '#E8F5E9',
        'riesgo-amber':    '#856404',
        'riesgo-amber-bg': '#FFF8E1',
        'riesgo-rojo':     '#B91C1C',
        'riesgo-rojo-bg':  '#FEF2F2',

        // Alias legacy (mantiene compatibilidad con componentes anteriores)
        espresso:   '#2C2D29',
        crema:      '#F6F4EF',
        caramelo:   '#6B4426',
        terracota:  '#4B5136',
        latte:      '#CBB9A3',
      },

      // ─── Tipografía ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      // ─── Escala de sombras semántica ────────────────────────────────────────
      boxShadow: {
        'soft':     '0 2px 8px 0 rgba(44,45,41,0.06)',
        'elevated': '0 8px 24px 0 rgba(44,45,41,0.12)',
        'hero':     '0 20px 60px 0 rgba(44,45,41,0.18)',
      },

      // ─── Bordes ─────────────────────────────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ─── Line-heights para jeraquía tipográfica del hero ────────────────────
      lineHeight: {
        'hero': '1.08',
      },

      // ─── Letter spacing hero ────────────────────────────────────────────────
      letterSpacing: {
        'tighter': '-0.03em',
      },
    },
  },
  plugins: [],
}

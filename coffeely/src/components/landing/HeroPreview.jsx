/**
 * HeroPreview.jsx
 * Sección hero de la landing:
 * - Imagen de cafetería moderna de Unsplash con overlay de gradiente
 * - Badge pill "SOFTWARE ESPECIALIZADO..."
 * - h1 text-5xl/6xl con tracking negativo (jerarquía tipográfica enterprise)
 * - Descripción con leading-relaxed
 * - Micro-sección "prueba social" entre hero y métricas
 */

// URL de imagen de alta calidad de Unsplash — cafetería moderna profesional
const HERO_IMAGE = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=85&auto=format&fit=crop'

export default function HeroPreview() {
  return (
    <div className="flex flex-col gap-0">

      {/* ── Imagen hero con overlay ── */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border
                      shadow-elevated" style={{ maxHeight: 400 }}>
        <img
          src={HERO_IMAGE}
          alt="Cafetería moderna con sistema de gestión financiera"
          className="w-full object-cover object-center"
          style={{ height: 400 }}
          loading="eager"
        />
        {/* Gradiente oscuro en la parte inferior para legibilidad */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(75,81,54,0.08) 0%, rgba(44,45,41,0.60) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Badge pill sobre la imagen */}
        <div className="absolute bottom-6 left-6">
          <span className="inline-flex items-center gap-2
                           bg-cream/95 backdrop-blur-sm
                           text-coffee font-bold text-[10px] uppercase tracking-widest
                           px-3 py-1.5 rounded-full border border-beige shadow-soft">
            Software especializado para cafeterías locales
          </span>
        </div>
      </div>

      {/* ── Tarjeta de bienvenida — jerarquía tipográfica marcada ── */}
      <div className="bg-card-bg border border-border rounded-2xl
                      shadow-soft hover:shadow-elevated transition-shadow duration-300
                      p-10 -mt-6 mx-4 relative z-10">

        {/* h1 grande — nivel enterprise */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark-olive
                       leading-[1.08] tracking-tight max-w-3xl">
          Cada peso en su cafetería,
          <span className="text-coffee"> con destino claro</span>
        </h1>

        {/* Subtítulo copia del HTML original — mejorado */}
        <p className="mt-6 text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl">
          Plataforma de análisis financiero diario con previsión de liquidez a 30 días,
          semaforización de riesgo operativo y recomendaciones de capital estratégico
          — diseñada para que ningún café cierre por no saber lo que viene.
        </p>

        {/* ── Micro-sección prueba social / resultado esperado ── */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm font-semibold text-dark-olive uppercase tracking-wider mb-4">
            ¿Qué consigues con Coffeely?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                metric: '30 días',
                label:  'de visibilidad financiera anticipada',
              },
              {
                metric: 'Alertas',
                label:  'antes de que el efectivo sea crítico',
              },
              {
                metric: 'Acciones',
                label:  'concretas para proteger tu colchón de capital',
              },
            ].map(({ metric, label }) => (
              <div
                key={metric}
                className="bg-bg-light rounded-xl p-5 border border-border
                           hover:border-beige hover:shadow-soft
                           transition-all duration-200"
              >
                <p className="text-2xl font-bold text-coffee">{metric}</p>
                <p className="text-sm text-text-muted mt-1 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}

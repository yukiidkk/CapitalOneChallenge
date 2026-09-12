/**
 * MetricPreviewCard.jsx
 * Tarjetas de métricas de ejemplo con:
 * - Valor numérico como elemento tipográfico dominante (text-4xl font-bold)
 * - Label en uppercase tracking-wider (sensación dashboard de datos)
 * - Badge de estado pill
 * - Texto "Ejemplo ilustrativo" en italic text-xs — no genera expectativas falsas
 */
import { TrendingUp, ShieldCheck } from 'lucide-react'

function MetricPreviewCard({ label, value, tag, tagColor, subtext, icon: Icon, accentColor }) {
  const tagStyles = {
    green:  'bg-riesgo-verde-bg text-riesgo-verde',
    amber:  'bg-riesgo-amber-bg text-riesgo-amber',
    red:    'bg-riesgo-rojo-bg text-riesgo-rojo',
  }

  const iconContainerStyles = {
    coffee:     'bg-cream text-coffee',
    'dark-olive': 'bg-cream text-dark-olive',
  }

  return (
    <article
      className="bg-card-bg border border-border rounded-2xl p-8
                 shadow-soft hover:shadow-elevated hover:scale-[1.02]
                 transition-all duration-300 flex flex-col gap-4"
    >
      {/* Header: label + tag */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Ícono en contenedor visual */}
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${iconContainerStyles[accentColor] ?? 'bg-cream text-coffee'}`}
            aria-hidden="true"
          >
            <Icon size={18} strokeWidth={2} />
          </span>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider leading-tight">
            {label}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap
                      ${tagStyles[tagColor] ?? tagStyles.green}`}
        >
          {tag}
        </span>
      </div>

      {/* Valor dominante */}
      <p className="text-4xl font-bold text-dark-olive tracking-tight leading-none">
        {value}
      </p>

      {/* Subtexto */}
      <p className="text-sm text-text-muted leading-snug">{subtext}</p>

      {/* Disclaimer — datos de muestra */}
      <p className="text-xs text-text-muted italic border-t border-border pt-3 mt-auto">
        Ejemplo ilustrativo — datos de muestra
      </p>
    </article>
  )
}

export default function MetricsPreviewSection() {
  return (
    <section aria-label="Métricas de ejemplo">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Vista previa del sistema
        </p>
        <span className="text-xs text-text-muted italic">Datos ilustrativos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MetricPreviewCard
          label="Liquidez Estimada (30 Días)"
          value="$142,800 MXN"
          tag="+8.4%"
          tagColor="green"
          subtext="Basado en comportamiento diario de ventas e insumos proyectados."
          icon={TrendingUp}
          accentColor="coffee"
        />
        <MetricPreviewCard
          label="Estado de Riesgo Operativo"
          value="Saludable"
          tag="Riesgo Bajo"
          tagColor="green"
          subtext="Colchón recomendado: 2.4× gastos mensuales fijos."
          icon={ShieldCheck}
          accentColor="dark-olive"
        />
      </div>
    </section>
  )
}

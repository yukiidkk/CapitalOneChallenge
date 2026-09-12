const POSITIVE_KEYS = ['expectedRevenue', 'minProfit', 'liquidityForecast']

export default function MetricCard({ metricKey, label, value, trend, icon, accent = 'coffee' }) {
  const isGood = POSITIVE_KEYS.includes(metricKey) ? trend >= 0 : trend <= 0
  const trendCls = trend === 0 ? 'text-text-muted bg-bg-light' : isGood ? 'text-riesgo-verde bg-riesgo-verde-bg' : 'text-riesgo-rojo bg-riesgo-rojo-bg'
  const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→'

  const iconBg = { coffee: 'bg-cream text-coffee', sage: 'bg-cream text-sage', 'dark-olive': 'bg-cream text-dark-olive', blue: 'bg-blue-50 text-blue-600' }

  return (
    <article className="bg-card-bg rounded-2xl border border-border shadow-soft
                        hover:shadow-elevated hover:scale-[1.02]
                        transition-all duration-300 p-8 flex flex-col gap-4"
      aria-label={label}>
      <div className="flex items-start justify-between">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg
                          flex-shrink-0 ${iconBg[accent] ?? iconBg.coffee}`} aria-hidden="true">
          {icon}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5 ${trendCls}`}
          aria-label={`${trend > 0 ? '+' : ''}${trend}% vs mes anterior`}>
          <span aria-hidden="true">{arrow}</span>{Math.abs(trend)}%
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold text-dark-olive tracking-tight leading-none">{value}</p>
        <p className="metric-label mt-2">{label}</p>
      </div>
    </article>
  )
}

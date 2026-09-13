/**
 * RiskSemaphore.jsx
 * Semáforo de salud financiera con análisis de Gemini (o fallback automático).
 *
 * Flujo:
 *   1. Al montar, llama a getRiskAnalysis(metrics) de services/gemini/index.js
 *   2. Mientras espera → Spinner
 *   3. Al resolver (Gemini o fallback, indistinguible) → muestra resultado
 *   4. Nunca muestra errores al usuario — el fallback siempre devuelve datos válidos
 *
 * El nivel de Gemini ("verde"|"amarillo"|"rojo") se mapea a los tres estados
 * visuales del semáforo: healthy | warning | danger.
 *
 * Accesibilidad daltónica: cada estado tiene color + patrón SVG distinto:
 *   healthy → sólido (relleno uniforme)
 *   warning → diagonal rayas
 *   danger  → puntos/círculos
 */
import { useState, useEffect }  from 'react'
import { useTranslation }       from 'react-i18next'
import { CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-react'
import { getRiskAnalysis }      from '../../services/gemini/index'
import Spinner                  from '../ui/Spinner'

/* ── Mapeo nivel Gemini → clave interna ── */
const NIVEL_MAP = { verde: 'healthy', amarillo: 'warning', rojo: 'danger' }

/* ── Config visual por estado ── */
const RISK_CONFIG = {
  healthy: {
    color:  '#2E7D32',
    bg:     'bg-riesgo-verde-bg',
    border: 'border-riesgo-verde/30',
    text:   'text-riesgo-verde',
    ring:   'ring-riesgo-verde/50',
    label:  'Saludable',
    Icon:   CheckCircle,
    /* Patrón: relleno sólido suave — representa estabilidad */
    pattern: (_id) => (
      <rect width="100%" height="100%" fill="#2E7D32" opacity="0.15" />
    ),
  },
  warning: {
    color:  '#856404',
    bg:     'bg-riesgo-amber-bg',
    border: 'border-riesgo-amber/30',
    text:   'text-riesgo-amber',
    ring:   'ring-riesgo-amber/50',
    label:  'Atención',
    Icon:   AlertTriangle,
    /* Patrón: líneas diagonales — representa movimiento/inestabilidad */
    pattern: (id) => (
      <>
        <defs>
          <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2"
              stroke="#856404" strokeWidth="2" opacity="0.35" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </>
    ),
  },
  danger: {
    color:  '#B91C1C',
    bg:     'bg-riesgo-rojo-bg',
    border: 'border-riesgo-rojo/30',
    text:   'text-riesgo-rojo',
    ring:   'ring-riesgo-rojo/50',
    label:  'Riesgo',
    Icon:   XCircle,
    /* Patrón: círculos/puntos — representa fragmentación/alerta */
    pattern: (id) => (
      <>
        <defs>
          <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2" fill="#B91C1C" opacity="0.28" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </>
    ),
  },
}

const LEVELS = ['healthy', 'warning', 'danger']

/* ── Tarjeta de recomendación ── */
function RecommendationCard({ text, index }) {
  return (
    <div className="flex items-start gap-3 bg-card-bg border border-border rounded-xl p-4
                    hover:shadow-soft transition-shadow duration-200">
      <span className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center
                       flex-shrink-0 text-xs font-bold text-coffee" aria-hidden="true">
        {index + 1}
      </span>
      <p className="text-sm text-text-muted leading-snug">{text}</p>
    </div>
  )
}

/* ── Estado de carga ── */
function LoadingState() {
  return (
    <div className="rounded-2xl border border-border bg-card-bg p-6 flex flex-col gap-4 h-full">
      <div className="h-5 w-36 bg-border/60 rounded animate-pulse" />
      <div className="flex items-center justify-center gap-3 py-4">
        <Spinner size={28} label="Calculando salud financiera…" />
        <p className="text-sm text-text-muted">Analizando tus finanzas…</p>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full  bg-border/50 rounded animate-pulse" />
        <div className="h-3 w-5/6   bg-border/50 rounded animate-pulse" />
        <div className="h-3 w-4/6   bg-border/50 rounded animate-pulse" />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════ */
export default function RiskSemaphore({ metrics }) {
  const { t } = useTranslation()

  /* metrics: { expectedRevenue, expectedExpenses, liquidityForecast } */
  const balance            = metrics?.liquidityForecast?.valueMXN  ?? 0
  const ingresosProyectados = metrics?.expectedRevenue?.valueMXN   ?? 0
  const gastosEstimados    = metrics?.expectedExpenses?.valueMXN   ?? 0

  const [loading,  setLoading]  = useState(true)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getRiskAnalysis({ balance, ingresosProyectados, gastosEstimados })
      .then(result => {
        if (!cancelled) {
          setAnalysis(result)
          setLoading(false)
        }
      })
      .catch(() => {
        /* No debería llegar aquí (index.js ya atrapa todo),
           pero si llegara, nunca mostramos error al usuario */
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [balance, ingresosProyectados, gastosEstimados])

  /* ── Spinner mientras carga ── */
  if (loading) return <LoadingState />

  /* ── Si por alguna razón analysis es null → fallback visual mínimo ── */
  if (!analysis) return <LoadingState />

  /* ── Mapear nivel Gemini → estado interno ── */
  const riskKey = NIVEL_MAP[analysis.nivel] ?? 'warning'
  const cfg     = RISK_CONFIG[riskKey]
  const { Icon } = cfg

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6 flex flex-col gap-5 h-full`}>

      {/* Título */}
      <h2 className="text-base font-bold text-dark-olive">
        {t('dashboard.risk.title')}
      </h2>

      {/* ── Semáforo tricolor ── */}
      <div
        role="status"
        aria-label={`Estado de salud financiera: ${cfg.label}`}
        className="flex items-center justify-center gap-3"
      >
        {LEVELS.map(level => {
          const lcfg   = RISK_CONFIG[level]
          const isActive = riskKey === level
          const LIcon  = lcfg.Icon
          const patId  = `pat-${level}`

          return (
            <div key={level} className="flex flex-col items-center gap-1.5">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isActive ? `scale-110 ring-2 ${lcfg.ring}` : 'opacity-25 grayscale'}`}
                style={{ backgroundColor: isActive ? lcfg.color + '20' : '#f0f0f0' }}
              >
                <svg
                  viewBox="0 0 56 56"
                  className="absolute inset-0 w-full h-full rounded-full"
                  aria-hidden="true"
                >
                  {lcfg.pattern(patId)}
                </svg>
                <LIcon
                  size={22}
                  style={{ color: lcfg.color }}
                  className="relative z-10"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <span className={`text-[10px] font-semibold
                ${isActive ? lcfg.text : 'text-text-muted/40'}`}>
                {lcfg.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Estado activo ── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg border ${cfg.border}`}>
        <Icon size={20} style={{ color: cfg.color }} strokeWidth={2} aria-hidden="true" />
        <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
      </div>

      {/* ── Justificación de Gemini / fallback ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="metric-label">{t('dashboard.risk.justification')}</p>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          {analysis.justificacion}
        </p>
      </div>

      {/* ── Recomendaciones de Gemini / fallback ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb size={13} className="text-coffee" aria-hidden="true" />
          <p className="metric-label">{t('dashboard.risk.recommendations')}</p>
        </div>
        <div className="flex flex-col gap-2">
          {(analysis.recomendaciones ?? []).slice(0, 2).map((rec, i) => (
            <RecommendationCard key={i} text={rec} index={i} />
          ))}
        </div>
      </div>

    </div>
  )
}

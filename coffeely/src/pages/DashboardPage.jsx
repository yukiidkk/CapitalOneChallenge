/**
 * DashboardPage.jsx
 * Dashboard principal con métricas reales, gráfica y semáforo de riesgo.
 * Incluye banner de captura pendiente (usePendingEntries).
 */
import { useState }          from 'react'
import { Link }              from 'react-router-dom'
import { useTranslation }    from 'react-i18next'
import { useApp }            from '../context/CoffeeShopContext'
import { useDashboardData }  from '../hooks/useDashboardData'
import { usePendingEntries } from '../hooks/usePendingEntries'
import Navbar                from '../components/layout/Navbar'
import MetricCard            from '../components/dashboard/MetricCard'
import CashFlowChart         from '../components/dashboard/CashFlowChart'
import RiskSemaphore         from '../components/dashboard/RiskSemaphore'
import { Bell, X, ClipboardList } from 'lucide-react'

/* ── Íconos de métricas (inline SVG) ── */
const ICONS = {
  TrendingUp: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Receipt: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
      <line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="12" y1="16" x2="8" y2="16"/>
    </svg>
  ),
  Wallet: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  Droplets: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
    </svg>
  ),
}

const METRIC_CONFIG = [
  { key: 'expectedRevenue',   accent: 'sage',       iconLabel: 'TrendingUp' },
  { key: 'expectedExpenses',  accent: 'coffee',     iconLabel: 'Receipt'    },
  { key: 'minProfit',         accent: 'dark-olive', iconLabel: 'Wallet'     },
  { key: 'liquidityForecast', accent: 'blue',       iconLabel: 'Droplets'   },
]

/* ── Banner de captura pendiente ── */
function PendingBanner({ pendienteHoy, diasSinRegistrar, yaPasoHoraCierre, destino, onDismiss }) {
  if (!pendienteHoy && diasSinRegistrar === 0) return null

  let mensaje = ''
  let urgencia = 'normal' // 'normal' | 'alta'

  if (diasSinRegistrar >= 1) {
    urgencia = diasSinRegistrar >= 3 ? 'alta' : 'normal'
    mensaje = `Llevas ${diasSinRegistrar} ${diasSinRegistrar === 1 ? 'día' : 'días'} sin registrar tus datos — entre más consistente seas, más precisas serán tus predicciones.`
  } else if (pendienteHoy && yaPasoHoraCierre) {
    mensaje = 'Tu negocio ya cerró — registra los datos de hoy para mejorar tus predicciones.'
  } else if (pendienteHoy) {
    mensaje = 'Aún no has registrado los datos de hoy. Hazlo al terminar tu jornada.'
  }

  if (!mensaje) return null

  const bgCls = urgencia === 'alta'
    ? 'bg-riesgo-amber-bg border-riesgo-amber/30'
    : 'bg-cream border-border'
  const iconCls = urgencia === 'alta' ? 'text-riesgo-amber' : 'text-coffee'

  return (
    <div role="alert" className={`rounded-2xl border ${bgCls} px-5 py-4 flex items-start gap-4`}>
      <Bell size={18} className={`${iconCls} shrink-0 mt-0.5`} aria-hidden="true" />
      <p className="text-sm text-text-main flex-1 leading-relaxed">{mensaje}</p>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={destino}
          className="text-xs font-semibold text-coffee hover:text-dark-olive underline
            focus:outline-none focus:ring-2 focus:ring-coffee/40 rounded transition-colors"
        >
          Registrar ahora
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar recordatorio"
          className="text-text-muted hover:text-text-main transition-colors
            focus:outline-none focus:ring-2 focus:ring-coffee/30 rounded p-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Saludo según hora ── */
function greeting(name) {
  const h = new Date().getHours()
  if (h < 12) return `Buenos días, ${name}`
  if (h < 19) return `Buenas tardes, ${name}`
  return `Buenas noches, ${name}`
}

/* ════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { t, i18n }        = useTranslation()
  const { user, business } = useApp()
  const { metrics } = useDashboardData()
  const pendingData = usePendingEntries()

  const [bannerDismissed, setBannerDismissed] = useState(false)

  const locale = i18n.language === 'es' ? 'es-MX' : 'en-US'
  const name   = business?.nombreCafeteria || business?.name || user?.name || 'barista'

  const today = new Date().toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  /* Si ya capturó hoy → el banner no reaparece en esta sesión */
  const showBanner = !bannerDismissed &&
    (pendingData.pendienteHoy || pendingData.diasSinRegistrar >= 1)

  return (
    <div className="min-h-screen bg-bg-light flex flex-col font-sans text-text-main">
      {/* Skip link accesibilidad */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 btn-primary z-50 text-sm">
        Ir al contenido
      </a>

      <Navbar />

      <main
        id="main-content"
        role="main"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col gap-8"
      >
        {/* Banner de captura pendiente */}
        {showBanner && (
          <PendingBanner
            {...pendingData}
            onDismiss={() => setBannerDismissed(true)}
          />
        )}

        {/* Saludo + fecha */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
          <div>
            <h1 className="text-2xl font-bold text-dark-olive tracking-tight">{greeting(name)}</h1>
            <p className="text-sm text-text-muted capitalize mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="metric-label">{t('dashboard.subtitle')}</p>
            {/* Acceso rápido a captura */}
            <Link
              to={pendingData.destino}
              className="flex items-center gap-1.5 text-xs font-medium text-coffee
                hover:text-dark-olive border border-coffee/30 hover:border-coffee
                px-3 py-1.5 rounded-xl transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-coffee/30"
            >
              <ClipboardList size={13} aria-hidden="true" />
              Registrar datos
            </Link>
          </div>
        </div>

        {/* 4 Métricas */}
        <section aria-label={t('dashboard.title')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {METRIC_CONFIG.map(({ key, accent, iconLabel }) => (
              <MetricCard
                key={key}
                metricKey={key}
                label={t(`dashboard.${key}`)}
                value={metrics[key]?.formatted ?? '—'}
                trend={metrics[key]?.trend ?? 0}
                icon={ICONS[iconLabel]}
                accent={accent}
              />
            ))}
          </div>
        </section>

        {/* Gráfica + Semáforo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section
            className="lg:col-span-2 bg-card-bg rounded-2xl border border-border shadow-soft p-8"
            aria-label={t('dashboard.chart.title')}
          >
            <CashFlowChart />
          </section>
          <section aria-label={t('dashboard.risk.title')}>
            <RiskSemaphore metrics={metrics} />
          </section>
        </div>

      </main>

      <footer className="mt-auto border-t border-border py-5 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} Coffeely · Hecho con cuidado
      </footer>
    </div>
  )
}

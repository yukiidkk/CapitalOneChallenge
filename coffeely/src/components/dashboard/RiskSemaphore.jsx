import { useTranslation } from 'react-i18next'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const RISK_CONFIG = {
  healthy: {
    color: '#2E7D32', bg: 'bg-riesgo-verde-bg', border: 'border-riesgo-verde/30',
    text: 'text-riesgo-verde', ring: 'ring-riesgo-verde/50',
    Icon: CheckCircle,
    pattern: id => <rect width="100%" height="100%" fill="#2E7D32" opacity="0.12" />,
  },
  warning: {
    color: '#856404', bg: 'bg-riesgo-amber-bg', border: 'border-riesgo-amber/30',
    text: 'text-riesgo-amber', ring: 'ring-riesgo-amber/50',
    Icon: AlertTriangle,
    pattern: id => (
      <>
        <defs>
          <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#856404" strokeWidth="2" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </>
    ),
  },
  danger: {
    color: '#B91C1C', bg: 'bg-riesgo-rojo-bg', border: 'border-riesgo-rojo/30',
    text: 'text-riesgo-rojo', ring: 'ring-riesgo-rojo/50',
    Icon: XCircle,
    pattern: id => (
      <>
        <defs>
          <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.5" fill="#B91C1C" opacity="0.25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </>
    ),
  },
}

function RecommendationCard({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3 bg-card-bg border border-border rounded-xl p-4
                    hover:shadow-soft transition-shadow duration-200">
      <span className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Icon size={16} className="text-coffee" strokeWidth={2} />
      </span>
      <p className="text-sm text-text-muted leading-snug">{text}</p>
    </div>
  )
}

export default function RiskSemaphore({ riskLevel }) {
  const { t } = useTranslation()
  const cfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.healthy
  const { Icon } = cfg

  const recIcons = {
    healthy: [CheckCircle, CheckCircle],
    warning: [AlertTriangle, AlertTriangle],
    danger:  [XCircle, XCircle],
  }

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6 flex flex-col gap-5 h-full`}>
      <h2 className="text-base font-bold text-dark-olive">{t('dashboard.risk.title')}</h2>

      {/* Semáforo tricolor */}
      <div role="status" aria-label={`Estado: ${t(`dashboard.risk.${riskLevel}`)}`}
        className="flex items-center justify-center gap-3">
        {['healthy', 'warning', 'danger'].map(level => {
          const lcfg = RISK_CONFIG[level]
          const isActive = riskLevel === level
          const LIcon = lcfg.Icon
          return (
            <div key={level} className="flex flex-col items-center gap-1.5">
              <div className={`relative w-14 h-14 rounded-full flex items-center justify-center
                               transition-all duration-300 ${isActive ? `scale-110 ring-2 ${lcfg.ring}` : 'opacity-25 grayscale'}`}
                style={{ backgroundColor: isActive ? lcfg.color + '20' : '#f0f0f0' }}>
                <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full rounded-full" aria-hidden="true">
                  {lcfg.pattern(`p-${level}`)}
                </svg>
                <LIcon size={22} style={{ color: lcfg.color }} className="relative z-10" strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? lcfg.text : 'text-text-muted/40'}`}>
                {t(`dashboard.risk.${level}`)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Estado activo */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg border ${cfg.border}`}>
        <Icon size={20} style={{ color: cfg.color }} strokeWidth={2} aria-hidden="true" />
        <p className={`text-sm font-bold ${cfg.text}`}>{t(`dashboard.risk.${riskLevel}`)}</p>
      </div>

      {/* Justificación */}
      <div>
        <p className="metric-label mb-1.5">{t('dashboard.risk.justification')}</p>
        <p className="text-sm text-text-muted leading-relaxed">{t(`dashboard.risk.${riskLevel}Desc`)}</p>
      </div>

      {/* Recomendaciones */}
      <div>
        <p className="metric-label mb-2">{t('dashboard.risk.recommendations')}</p>
        <div className="flex flex-col gap-2">
          {[1, 2].map(n => (
            <RecommendationCard key={n} icon={recIcons[riskLevel][n-1]} text={t(`dashboard.risk.rec${n}_${riskLevel}`)} />
          ))}
        </div>
      </div>
    </div>
  )
}

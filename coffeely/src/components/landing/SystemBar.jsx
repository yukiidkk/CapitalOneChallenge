/**
 * SystemBar.jsx
 * Barra superior de estado y accesibilidad.
 * - Dot de estado con animate-pulse
 * - Botones Alto Contraste y Lector de Voz con hover states
 */
import { useTranslation }    from 'react-i18next'
import { useAccessibility }  from '../../contexts/AccessibilityContext'

export default function SystemBar() {
  const { t }                              = useTranslation()
  const { highContrast, toggleHighContrast } = useAccessibility()

  return (
    <div className="bg-dark-olive text-cream text-xs font-medium
                    border-b border-white/10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                      h-9 flex items-center justify-between">

        {/* Estado del motor */}
        <div className="flex items-center gap-2">
          {/* Dot verde con pulso */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          <span className="tracking-wide">Motor de Tesorería</span>
          <span className="hidden sm:inline text-white/30 mx-1">·</span>
          <span className="hidden sm:inline text-white/50">Sistema operativo</span>
        </div>

        {/* Controles de accesibilidad */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            aria-label={t('accessibility.label')}
            className={`px-2.5 py-1 rounded border text-xs font-medium
                        transition-all duration-200 focus:outline-none
                        focus:ring-2 focus:ring-cream/40
                        ${highContrast
                          ? 'bg-cream/20 border-cream/40 text-cream'
                          : 'bg-white/10 border-white/20 text-cream/80 hover:bg-white/20 hover:text-cream'}`}
          >
            {t('accessibility.toggle')}
          </button>

          <button
            aria-label="Activar asistente de lectura de voz"
            className="px-2.5 py-1 rounded border border-white/20 bg-white/10
                       text-cream/80 hover:bg-white/20 hover:text-cream
                       transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cream/40"
          >
            Lector de Voz
          </button>
        </div>
      </div>
    </div>
  )
}

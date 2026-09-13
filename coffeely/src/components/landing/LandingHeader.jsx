/**
 * LandingHeader.jsx
 * Cabecera principal de la landing page.
 * - Logo "CF" con gradiente coffee → dark-olive
 * - Nombre + subtítulo en uppercase con tracking
 * - Botón "Iniciar Sesión" con Link de react-router-dom
 */
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useTranslation } from 'react-i18next'

export default function LandingHeader() {
  const { t } = useTranslation()
  const { language, changeLanguage, LANGUAGES } = useLanguage()
  const { currency, changeCurrency, CURRENCIES } = useCurrency()

  const selectCls = `text-xs bg-transparent border border-border rounded-lg px-2 py-1
                     text-text-muted cursor-pointer hover:border-coffee
                     focus:outline-none focus:ring-2 focus:ring-coffee/30 transition-colors`

  return (
    <header className="bg-card-bg border-b border-border w-full shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                      h-16 flex items-center justify-between">

        {/* ── Marca ── */}
        <div className="flex items-center gap-3">
          {/* Icono CF con gradiente */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center
                       text-cream font-bold text-base tracking-tight shadow-soft
                       flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)',
            }}
            aria-hidden="true"
          >
            CF
          </div>

          {/* Nombre + subtítulo */}
          <div className="leading-none">
            <span className="block text-lg font-bold text-dark-olive tracking-tight">
              Capital Coffee
            </span>
            <span className="block text-[10px] text-text-muted uppercase tracking-widest
                             font-medium mt-0.5">
              Previsión de Liquidez · Riesgo Operativo
            </span>
          </div>
        </div>

        {/* ── Controles + CTA ── */}
        <div className="flex items-center gap-3">
          {/* Selectores globales (visibles en desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label={t('nav.language')}
              className={selectCls}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              aria-label={t('nav.currency')}
              className={selectCls}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>

          {/* Botón Iniciar Sesión — Link funcional */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2
                       bg-coffee hover:bg-dark-olive text-white
                       text-sm font-semibold px-5 py-2 rounded-xl
                       shadow-soft hover:shadow-elevated
                       transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-coffee/50 focus:ring-offset-1"
          >
            Iniciar Sesión
          </Link>
        </div>

      </div>
    </header>
  )
}

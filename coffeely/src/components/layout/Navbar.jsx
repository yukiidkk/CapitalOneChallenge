/**
 * Navbar.jsx — Barra de app para el dashboard (post-login).
 * Incluye logo, nombre del negocio, selectores y logout.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useApp } from '../../context/CoffeeShopContext'
import { LogOut, Menu, X } from 'lucide-react'

export default function Navbar() {
  const { t } = useTranslation()
  const { language, changeLanguage, LANGUAGES } = useLanguage()
  const { currency, changeCurrency, CURRENCIES } = useCurrency()
  const { user, logout, business } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const selectCls = `text-xs bg-transparent border border-border rounded-lg px-2 py-1
                     text-text-muted cursor-pointer hover:border-coffee transition-colors
                     focus:outline-none focus:ring-2 focus:ring-coffee/30`

  const Controls = () => (
    <>
      <select value={language} onChange={e => changeLanguage(e.target.value)} aria-label={t('nav.language')} className={selectCls}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
      <select value={currency} onChange={e => changeCurrency(e.target.value)} aria-label={t('nav.currency')} className={selectCls}>
        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
      </select>
      {user ? (
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-medium
          text-text-muted hover:text-text-main border border-border hover:border-coffee
          px-3 py-1.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-coffee/30">
          <LogOut size={13} aria-hidden="true" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      ) : (
        <button onClick={() => navigate('/login')} className="btn-primary text-xs px-4 py-1.5">
          {t('nav.login')}
        </button>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 bg-card-bg/90 backdrop-blur-sm border-b border-border shadow-soft" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-cream font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)' }} aria-hidden="true">CF</div>
            <div className="leading-none">
              <span className="block text-base font-bold text-dark-olive tracking-tight">Capital Coffee</span>
              <span className="block text-[10px] text-text-muted uppercase tracking-widest font-medium mt-0.5">
                {business?.name || t('header.tagline')}
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-3" aria-label="Configuración global"><Controls /></nav>
          <button className="md:hidden text-text-main p-2 rounded-xl hover:bg-bg-light transition-colors
            focus:outline-none focus:ring-2 focus:ring-coffee/30"
            onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-card-bg px-4 py-4 flex flex-col gap-3" aria-label="Menú móvil">
          <Controls />
        </nav>
      )}
    </header>
  )
}

/**
 * OnboardingPage.jsx — 2 pasos: datos del negocio + historial o daily entry
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate }    from 'react-router-dom'
import { useApp }         from '../context/CoffeeShopContext'
import { useCurrency }    from '../contexts/CurrencyContext'
import FormField          from '../components/ui/FormField'
import { Building2, Clock, TrendingUp, FileText, DollarSign, PiggyBank } from 'lucide-react'

function Toggle({ id, checked, onChange, labelOn, labelOff }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:ring-offset-1
        ${checked ? 'bg-coffee border-coffee' : 'bg-border border-border'}`}>
      <span aria-hidden="true" className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow
        ring-0 transition duration-200 ${checked ? 'translate-x-7' : 'translate-x-0'}`} />
      <span className="sr-only">{checked ? labelOn : labelOff}</span>
    </button>
  )
}

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-2 rounded-full transition-all duration-300
          ${i + 1 === current ? 'w-6 bg-coffee' : i + 1 < current ? 'w-2 bg-coffee/40' : 'w-2 bg-border'}`}
          aria-hidden="true" />
      ))}
    </div>
  )
}

function DailyCard({ id, label, placeholder, value, onChange, Icon, currency }) {
  return (
    <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-6
                    hover:shadow-elevated hover:border-beige transition-all duration-300 group">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-coffee
                         group-hover:bg-beige transition-colors duration-200 flex-shrink-0" aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </span>
        <label htmlFor={id} className="text-sm font-semibold text-text-main cursor-pointer">{label}</label>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted pointer-events-none" aria-hidden="true">{currency}</span>
        <input id={id} type="number" min="0" step="0.01" value={value} onChange={onChange} placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-bg-light pl-12 pr-3 py-2.5 text-sm text-text-main
            placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
            hover:border-beige transition-colors" />
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const { t }         = useTranslation()
  const { finishOnboarding } = useApp()
  const { CURRENCIES, currency, changeCurrency } = useCurrency()
  const navigate      = useNavigate()

  const [step, setStep]         = useState(1)
  const [errors, setErrors]     = useState({})
  const [name, setName]         = useState('')
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [hasHistory, setHasHistory] = useState(false)
  const [historyRows, setHistoryRows] = useState([])
  const [daily, setDaily] = useState({ dailyRevenue: '', availableCapital: '', fixedExpenses: '', savingsGoal: '' })

  const validateStep1 = () => {
    const e = {}
    if (!name.trim()) e.name = t('errors.requiredField')
    if (!openTime)    e.openTime = t('errors.invalidTime')
    if (!closeTime)   e.closeTime = t('errors.invalidTime')
    return e
  }

  const handleNext = () => {
    const e = validateStep1(); if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setStep(2)
  }

  const handleFinish = () => {
    finishOnboarding({ name: name.trim(), openTime, closeTime, currency, hasHistory, monthlyHistory: historyRows, dailyEntry: daily })
    navigate('/dashboard')
  }

  const inputBase = `w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-main
    placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
    hover:border-beige transition-colors`

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Cabecera */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {t('onboarding.step', { current: step, total: 2 })}
            </span>
            <StepDots current={step} total={2} />
          </div>
          <h1 className="text-3xl font-bold text-dark-olive tracking-tight">{t('onboarding.title')}</h1>
          <p className="text-sm text-text-muted mt-1">{t('onboarding.subtitle')}</p>
        </div>

        <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <FormField id="ob-name" label={t('onboarding.businessName')}
                placeholder={t('onboarding.businessNamePh')} value={name}
                onChange={e => setName(e.target.value)} error={errors.name} required
                icon={<Building2 size={16} />} />

              <div className="grid grid-cols-2 gap-4">
                {[['ob-open', t('onboarding.openTime'), openTime, setOpenTime, errors.openTime],
                  ['ob-close', t('onboarding.closeTime'), closeTime, setCloseTime, errors.closeTime]
                ].map(([id, label, val, setter, err]) => (
                  <div key={id} className="flex flex-col gap-1">
                    <label htmlFor={id} className="text-sm font-medium text-text-main">
                      {label}<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"><Clock size={15} /></span>
                      <input id={id} type="time" value={val} onChange={e => setter(e.target.value)}
                        className={`${inputBase} pl-10`} aria-invalid={!!err} />
                    </div>
                    {err && <p role="alert" className="text-xs text-red-600">⚠ {err}</p>}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="ob-currency" className="text-sm font-medium text-text-main">{t('onboarding.mainCurrency')}</label>
                <select id="ob-currency" value={currency} onChange={e => changeCurrency(e.target.value)} className={`${inputBase} cursor-pointer`}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {t(`currency.${c.code}`)}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2 p-5 bg-cream/40 rounded-xl border border-cream">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text-main">{t('onboarding.hasHistory')}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t('onboarding.hasHistoryHint')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${!hasHistory ? 'text-text-main' : 'text-text-muted'}`}>{t('onboarding.no')}</span>
                    <Toggle id="ob-history" checked={hasHistory} onChange={setHasHistory} labelOn={t('onboarding.yes')} labelOff={t('onboarding.no')} />
                    <span className={`text-xs font-medium ${hasHistory ? 'text-coffee' : 'text-text-muted'}`}>{t('onboarding.yes')}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-dark-olive">{hasHistory ? t('onboarding.history.title') : t('onboarding.daily.title')}</h3>
                <p className="text-sm text-text-muted mt-0.5">{hasHistory ? t('onboarding.history.subtitle') : t('onboarding.daily.subtitle')}</p>
              </div>
              {!hasHistory && (
                <>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>{Object.values(daily).filter(v => v !== '').length}/4</span>
                      <span>{Math.round(Object.values(daily).filter(v => v !== '').length / 4 * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-coffee rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(Object.values(daily).filter(v => v !== '').length / 4 * 100)}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      ['daily-rev', t('onboarding.daily.dailyRevenue'), t('onboarding.daily.dailyRevenuePh'), 'dailyRevenue', TrendingUp],
                      ['daily-cap', t('onboarding.daily.availableCapital'), t('onboarding.daily.availableCapitalPh'), 'availableCapital', DollarSign],
                      ['daily-exp', t('onboarding.daily.fixedExpenses'), t('onboarding.daily.fixedExpensesPh'), 'fixedExpenses', FileText],
                      ['daily-sav', t('onboarding.daily.savingsGoal'), t('onboarding.daily.savingsGoalPh'), 'savingsGoal', PiggyBank],
                    ].map(([id, label, ph, key, Icon]) => (
                      <DailyCard key={id} id={id} label={label} placeholder={ph} value={daily[key]}
                        onChange={e => setDaily(p => ({ ...p, [key]: e.target.value }))} Icon={Icon} currency={currency} />
                    ))}
                  </div>
                </>
              )}
              {hasHistory && (
                <p className="text-sm text-text-muted text-center py-4 border border-dashed border-border rounded-xl">
                  {t('placeholders.comingSoon')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main
                         transition-colors focus:outline-none focus:ring-2 focus:ring-coffee/30 rounded-lg px-2 py-1">
              ← {t('onboarding.back')}
            </button>
          ) : <span />}
          {step < 2 ? (
            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
              {t('onboarding.next')} →
            </button>
          ) : (
            <button onClick={handleFinish} className="btn-primary flex items-center gap-2">
              {t('onboarding.finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

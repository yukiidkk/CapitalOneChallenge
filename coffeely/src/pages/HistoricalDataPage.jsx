/**
 * HistoricalDataPage.jsx — /captura-historial
 * Para negocios establecidos: carga múltiples meses de historial.
 * Para cargas futuras (modo mensual): una sola entrada.
 * Al guardar: agrega a registrosMensuales y redirige a /dashboard.
 */
import { useState, useMemo } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useApp }            from '../context/CoffeeShopContext'
import { useCurrency }       from '../contexts/CurrencyContext'
import { useEntryFrequency } from '../hooks/useEntryFrequency'
import { Calendar, TrendingUp, Receipt, ShoppingCart, Wallet, Plus, Trash2, Calculator } from 'lucide-react'

/* Genera lista de "YYYY-MM" para los últimos 24 meses */
function generateMonthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    opts.push({ val, label })
  }
  return opts
}
const MONTH_OPTIONS = generateMonthOptions()

const emptyEntry = () => ({
  mes:                     MONTH_OPTIONS[1]?.val ?? '',
  ingresosTotales:         '',
  gastosFijos:             '',
  gastosVariables:         '',
  utilidadNetaManual:      '',
  overrideUtilidad:        false,
  capitalDisponibleCierre: '',
})

/* ── Campo numérico ── */
function NumField({ id, label, value, onChange, error, icon, hint, required = true }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0.00"
          aria-invalid={!!error}
          className={`w-full rounded-lg border bg-white ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm text-text-main
            placeholder:text-text-muted transition-colors
            focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
            ${error ? 'border-red-400' : 'border-border hover:border-beige'}`}
        />
      </div>
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>{error}
        </p>
      )}
    </div>
  )
}

/* ── Tarjeta de un mes ── */
function MonthCard({ entry, idx, onChange, onRemove, errors, symbol, isOnly, modoMensual }) {
  const utilidadCalculada = useMemo(() => {
    const ing  = Number(entry.ingresosTotales)  || 0
    const fij  = Number(entry.gastosFijos)       || 0
    const vari = Number(entry.gastosVariables)   || 0
    return ing - fij - vari
  }, [entry.ingresosTotales, entry.gastosFijos, entry.gastosVariables])

  const set = field => val => onChange(idx, { ...entry, [field]: val })

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-4">

      {/* Header: mes + botón eliminar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-coffee" aria-hidden="true" />
          <select
            value={entry.mes}
            onChange={e => set('mes')(e.target.value)}
            aria-label={`Mes del registro ${idx + 1}`}
            className="text-sm font-semibold text-dark-olive bg-transparent border-none
              focus:outline-none focus:ring-2 focus:ring-coffee/40 rounded cursor-pointer"
          >
            {MONTH_OPTIONS.map(o => (
              <option key={o.val} value={o.val}>{o.label}</option>
            ))}
          </select>
        </div>
        {!isOnly && !modoMensual && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            aria-label={`Eliminar mes ${idx + 1}`}
            className="text-text-muted hover:text-red-500 transition-colors
              focus:outline-none focus:ring-2 focus:ring-red-300 rounded p-1"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Grid de campos */}
      <div className="grid grid-cols-2 gap-3">
        <NumField id={`ing-${idx}`} label="Ingresos totales"
          value={entry.ingresosTotales} onChange={set('ingresosTotales')}
          error={errors?.[`ing-${idx}`]} icon={<TrendingUp size={14} />} />

        <NumField id={`fij-${idx}`} label="Gastos fijos"
          value={entry.gastosFijos} onChange={set('gastosFijos')}
          error={errors?.[`fij-${idx}`]} icon={<Receipt size={14} />} />

        <NumField id={`var-${idx}`} label="Gastos variables"
          value={entry.gastosVariables} onChange={set('gastosVariables')}
          error={errors?.[`var-${idx}`]} icon={<ShoppingCart size={14} />} />

        <NumField id={`cap-${idx}`} label="Capital al cierre"
          value={entry.capitalDisponibleCierre} onChange={set('capitalDisponibleCierre')}
          error={errors?.[`cap-${idx}`]} icon={<Wallet size={14} />} />
      </div>

      {/* Utilidad neta */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Utilidad neta<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <button
            type="button"
            onClick={() => set('overrideUtilidad')(!entry.overrideUtilidad)}
            className="flex items-center gap-1 text-xs text-coffee hover:text-dark-olive
              font-medium transition-colors focus:outline-none focus:underline"
          >
            <Calculator size={11} aria-hidden="true" />
            {entry.overrideUtilidad ? 'Usar cálculo automático' : 'Ingresar manualmente'}
          </button>
        </div>

        {entry.overrideUtilidad ? (
          <NumField id={`util-${idx}`} label={null}
            value={entry.utilidadNetaManual} onChange={set('utilidadNetaManual')}
            error={errors?.[`util-${idx}`]} required />
        ) : (
          <div className={`rounded-lg border px-3 py-2 text-sm font-semibold
            ${utilidadCalculada >= 0 ? 'border-riesgo-verde/30 bg-riesgo-verde-bg text-riesgo-verde'
              : 'border-riesgo-rojo/30 bg-riesgo-rojo-bg text-riesgo-rojo'}`}>
            {symbol}{utilidadCalculada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal ml-2 opacity-70">(ingresos − gastos)</span>
          </div>
        )}
      </div>

    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function HistoricalDataPage() {
  const navigate = useNavigate()
  const { business, addRegistroMensual } = useApp()
  const { currency, CURRENCIES }         = useCurrency()
  const { frecuencia }                   = useEntryFrequency()

  const symbol      = CURRENCIES.find(c => c.code === currency)?.symbol ?? '$'
  const modoMensual = frecuencia === 'mensual' // carga futura, solo 1 mes

  const [entries, setEntries] = useState([emptyEntry()])
  const [errors, setErrors]   = useState({})

  const updateEntry = (idx, data) => setEntries(prev => prev.map((e, i) => i === idx ? data : e))
  const removeEntry = (idx)      => setEntries(prev => prev.filter((_, i) => i !== idx))
  const addEntry    = ()         => setEntries(prev => [...prev, emptyEntry()])

  const validate = () => {
    const errs = {}
    const mesesUsados = new Set()
    entries.forEach((e, idx) => {
      if (mesesUsados.has(e.mes)) errs[`mes-dup-${idx}`] = 'Este mes ya está registrado.'
      mesesUsados.add(e.mes)
      if (!e.ingresosTotales || Number(e.ingresosTotales) < 0)
        errs[`ing-${idx}`] = 'Requerido y no negativo.'
      if (!e.gastosFijos || Number(e.gastosFijos) < 0)
        errs[`fij-${idx}`] = 'Requerido y no negativo.'
      if (!e.gastosVariables || Number(e.gastosVariables) < 0)
        errs[`var-${idx}`] = 'Requerido y no negativo.'
      if (!e.capitalDisponibleCierre || Number(e.capitalDisponibleCierre) < 0)
        errs[`cap-${idx}`] = 'Requerido y no negativo.'
      if (e.overrideUtilidad && (e.utilidadNetaManual === '' || isNaN(Number(e.utilidadNetaManual))))
        errs[`util-${idx}`] = 'Ingresa un valor numérico.'
    })
    return errs
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    entries.forEach(entry => {
      const utilidad = entry.overrideUtilidad
        ? Number(entry.utilidadNetaManual)
        : Number(entry.ingresosTotales) - Number(entry.gastosFijos) - Number(entry.gastosVariables)

      addRegistroMensual({
        mes:                     entry.mes,
        ingresosTotales:         Number(entry.ingresosTotales),
        gastosFijos:             Number(entry.gastosFijos),
        gastosVariables:         Number(entry.gastosVariables),
        utilidadNeta:            utilidad,
        capitalDisponibleCierre: Number(entry.capitalDisponibleCierre),
        moneda:                  currency,
      })
    })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-cream font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)' }} aria-hidden="true">CF</div>
            <div>
              <span className="block text-lg font-bold text-dark-olive">Coffeely</span>
              <span className="block text-xs text-text-muted">
                {modoMensual ? 'Registro mensual' : 'Historial financiero'}
              </span>
            </div>
          </div>

          <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
            <h1 className="text-xl font-bold text-dark-olive mb-1">
              {modoMensual ? 'Registro del mes' : 'Carga tu historial'}
            </h1>
            <p className="text-sm text-text-muted mb-6">
              {modoMensual
                ? `Registra los datos del mes actual en ${currency} (${symbol}) para mantener tus predicciones actualizadas.`
                : `Carga los meses disponibles en ${currency} (${symbol}). Puedes agregar todos los que tengas — entre más datos, mejores predicciones.`}
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {entries.map((entry, idx) => (
                <MonthCard
                  key={idx}
                  entry={entry}
                  idx={idx}
                  onChange={updateEntry}
                  onRemove={removeEntry}
                  errors={errors}
                  symbol={symbol}
                  isOnly={entries.length === 1}
                  modoMensual={modoMensual}
                />
              ))}

              {/* Error de mes duplicado global */}
              {Object.entries(errors).filter(([k]) => k.startsWith('mes-dup')).map(([k, v]) => (
                <p key={k} role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <span aria-hidden="true">⚠</span>{v}
                </p>
              ))}

              {/* Agregar mes (solo en modo historial inicial) */}
              {!modoMensual && (
                <button
                  type="button"
                  onClick={addEntry}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                    border-2 border-dashed border-border hover:border-coffee text-sm
                    text-text-muted hover:text-coffee font-medium transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-coffee/30"
                >
                  <Plus size={16} aria-hidden="true" />
                  Agregar otro mes
                </button>
              )}

              <button type="submit" className="btn-primary w-full justify-center mt-2">
                Guardar y ver mi Dashboard
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

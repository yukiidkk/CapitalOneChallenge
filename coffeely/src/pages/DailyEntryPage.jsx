/**
 * DailyEntryPage.jsx — /captura-diaria
 * Guarda en Supabase via upsertRegistroDiario (UNIQUE negocio_id+fecha).
 * El hook bug de useMemo-after-return está corregido: todos los hooks
 * están al tope; la redirección usa useEffect.
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/CoffeeShopContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useEntryFrequency } from '../hooks/useEntryFrequency'
import { upsertRegistroDiario } from '../services/supabase/negociosService'
import { TrendingUp, Wallet, Receipt, PiggyBank, ShoppingCart, Hash } from 'lucide-react'

const TODAY = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"

/* ── Campo numérico reutilizable ── */
function MoneyField({ id, label, value, onChange, error, icon, hint, required = true, placeholder = '0.00' }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text-main">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id} type="number" min="0" step="0.01"
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-text-main
            placeholder:text-text-muted transition-colors
            focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
            ${error ? 'border-red-400' : 'border-border hover:border-beige'}`}
        />
      </div>
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>{error}
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function DailyEntryPage() {
  const navigate = useNavigate()
  const { business, addRegistroDiario } = useApp()
  const { currency, CURRENCIES } = useCurrency()
  const { frecuencia } = useEntryFrequency()

  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? '$'

  /* ── Todos los hooks ANTES de cualquier return condicional ── */

  /* Redirige a mensual si corresponde — useEffect para no violar reglas de hooks */
  useEffect(() => {
    if (frecuencia === 'mensual') {
      navigate('/captura-historial', { replace: true })
    }
  }, [frecuencia, navigate])

  /* Detectar si ya hay registro de hoy */
  const registroHoy = useMemo(
    () => business.registrosDiarios?.find(r => r.fecha === TODAY),
    [business.registrosDiarios]
  )

  const [form, setForm] = useState({
    ingresosTotales: '',
    capitalDisponible: '',
    gastosFijos: '',
    gastosVariables: '',
    metaAhorro: '',
    numeroVentas: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const set = field => val => setForm(p => ({ ...p, [field]: val }))

  const validate = () => {
    const errs = {}
    const required = ['ingresosTotales', 'capitalDisponible', 'gastosFijos', 'gastosVariables', 'metaAhorro']
    required.forEach(k => {
      if (form[k] === '' || form[k] === null) errs[k] = 'Este campo es obligatorio.'
      else if (Number(form[k]) < 0) errs[k] = 'El valor no puede ser negativo.'
    })
    if (form.numeroVentas !== '' && (isNaN(Number(form.numeroVentas)) || Number(form.numeroVentas) < 0))
      errs.numeroVentas = 'Ingresa un número entero válido.'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (registroHoy && !confirmOverwrite) { setConfirmOverwrite(true); return }

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setServerError('')
    setSaving(true)

    const registro = {
      fecha: TODAY,
      ingresosTotales: Number(form.ingresosTotales),
      capitalDisponible: Number(form.capitalDisponible),
      gastosFijos: Number(form.gastosFijos),
      gastosVariables: Number(form.gastosVariables),
      metaAhorro: Number(form.metaAhorro),
      numeroVentas: form.numeroVentas !== '' ? Number(form.numeroVentas) : null,
    }

    try {
      // 1. Guardar en Supabase (upsert por UNIQUE negocio_id + fecha)
      const negocioId = business.id
      if (!negocioId) throw new Error('No se encontró el negocio. Recarga la página.')
      const saved = await upsertRegistroDiario(negocioId, registro)

      // 2. Actualizar estado local optimistamente
      addRegistroDiario(saved)

      navigate('/dashboard')
    } catch (err) {
      console.error('[DailyEntryPage]', err)
      setServerError(err.message ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Pantalla de confirmación de sobreescritura ── */
  if (registroHoy && !confirmOverwrite) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
        <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-riesgo-verde-bg flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-riesgo-verde" />
          </div>
          <h2 className="text-xl font-bold text-dark-olive mb-2">Ya registraste hoy</h2>
          <p className="text-sm text-text-muted mb-6">
            Ya existe un registro para el <strong>{TODAY}</strong>.
            ¿Deseas actualizar los datos de hoy?
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setConfirmOverwrite(true)} className="btn-primary w-full justify-center">
              Sí, actualizar datos de hoy
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full text-sm text-text-muted hover:text-text-main font-medium
                py-2.5 rounded-xl border border-border hover:border-beige transition-colors
                focus:outline-none focus:ring-2 focus:ring-coffee/30">
              No, ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const todayLabel = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-cream font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)' }} aria-hidden="true">CF</div>
            <div>
              <span className="block text-lg font-bold text-dark-olive">Capital Coffee</span>
              <span className="block text-xs text-text-muted capitalize">{todayLabel}</span>
            </div>
          </div>

          <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
            <h1 className="text-xl font-bold text-dark-olive mb-1">Registro del día</h1>
            <p className="text-sm text-text-muted mb-6">
              Ingresa los datos de hoy en <strong>{currency}</strong> ({symbol}).
              Entre más consistente seas, más precisas serán tus predicciones.
            </p>

            {serverError && (
              <div role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200
                rounded-lg px-3 py-2 flex items-center gap-1.5 mb-4">
                <span aria-hidden="true">⚠</span>{serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <MoneyField id="ing-tot" label="Ingresos totales del día"
                value={form.ingresosTotales} onChange={set('ingresosTotales')}
                error={errors.ingresosTotales} icon={<TrendingUp size={16} />}
                placeholder={`${symbol}0.00`} />

              <MoneyField id="cap-disp" label="Capital disponible actual"
                value={form.capitalDisponible} onChange={set('capitalDisponible')}
                error={errors.capitalDisponible} icon={<Wallet size={16} />}
                placeholder={`${symbol}0.00`} />

              <MoneyField id="gast-fij" label="Gastos fijos del día"
                value={form.gastosFijos} onChange={set('gastosFijos')}
                error={errors.gastosFijos} icon={<Receipt size={16} />}
                hint="Gastos que no cambian con las ventas: renta, sueldos, servicios."
                placeholder={`${symbol}0.00`} />

              <MoneyField id="gast-var" label="Gastos variables del día"
                value={form.gastosVariables} onChange={set('gastosVariables')}
                error={errors.gastosVariables} icon={<ShoppingCart size={16} />}
                hint="Gastos que varían con las ventas: insumos, materia prima."
                placeholder={`${symbol}0.00`} />

              <MoneyField id="meta-aho" label="Meta de ahorro"
                value={form.metaAhorro} onChange={set('metaAhorro')}
                error={errors.metaAhorro} icon={<PiggyBank size={16} />}
                placeholder={`${symbol}0.00`} />

              <MoneyField id="num-ven" label="Número de ventas del día"
                value={form.numeroVentas} onChange={set('numeroVentas')}
                error={errors.numeroVentas} icon={<Hash size={16} />}
                required={false} placeholder="Ej. 45"
                hint="Opcional — número entero de transacciones." />

              <button type="submit" disabled={saving}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando…
                  </span>
                ) : 'Guardar y ver mi Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * BusinessRegistrationPage.jsx — /registro-negocio
 * Un solo paso: Nombre del negocio + horario por día.
 * Al confirmar, guarda tiene_historial = false y tipo_formulario = 'diario'
 * por defecto, y redirige siempre a /captura-diaria.
 */
import { useState } from 'react'
import { useNavigate }    from 'react-router-dom'
import { useApp }         from '../context/CoffeeShopContext'
import { supabase }       from '../services/supabase/client'
import { insertNegocio }  from '../services/supabase/negociosService'
import { Coffee, Clock, Copy, Building2, ChevronRight } from 'lucide-react'

const DIAS = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0')
  return `${h}:00`
})

/* ── Toggle switch ── */
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2
        border-transparent transition-colors duration-200 ease-in-out focus:outline-none
        focus:ring-2 focus:ring-coffee/40 focus:ring-offset-1
        ${checked ? 'bg-coffee' : 'bg-border'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
          transform transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

/* ── Selector de hora ── */
function HourSelect({ value, onChange, label, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className={`text-xs rounded-lg border px-2 py-1.5 bg-white transition-colors
        focus:outline-none focus:ring-2 focus:ring-coffee/40
        ${disabled ? 'opacity-40 cursor-not-allowed border-border' : 'border-border hover:border-coffee cursor-pointer'}`}
    >
      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
    </select>
  )
}

/* ── Fila de un día ── */
function DayRow({ dia, config, onChange }) {
  const abierto = !config.cerrado
  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-colors
      ${abierto ? 'bg-white border border-border' : 'bg-bg-light border border-transparent'}`}>

      {/* Nombre del día */}
      <span className={`text-sm font-medium w-20 shrink-0 ${abierto ? 'text-text-main' : 'text-text-muted'}`}>
        {dia.label}
      </span>

      {/* Toggle abierto/cerrado */}
      <div className="flex items-center gap-2 shrink-0">
        <Toggle
          checked={abierto}
          onChange={open => onChange({ ...config, cerrado: !open })}
          label={`${dia.label} abierto`}
        />
        <span className={`text-xs font-medium w-14 ${abierto ? 'text-coffee' : 'text-text-muted'}`}>
          {abierto ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {/* Selectores de hora */}
      {abierto ? (
        <div className="flex items-center gap-2 ml-auto">
          <HourSelect
            value={config.abre}
            onChange={val => onChange({ ...config, abre: val })}
            label={`Hora apertura ${dia.label}`}
          />
          <span className="text-xs text-text-muted">–</span>
          <HourSelect
            value={config.cierra}
            onChange={val => onChange({ ...config, cierra: val })}
            label={`Hora cierre ${dia.label}`}
          />
        </div>
      ) : (
        <span className="text-xs text-text-muted ml-auto italic">Día cerrado</span>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════ */
export default function BusinessRegistrationPage() {
  const navigate = useNavigate()
  const { business, saveBusinessInfo, setNegocioData } = useApp()

  const [errors, setErrors]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [serverError, setServerError] = useState('')

  /* Nombre + horario */
  const [nombre, setNombre]   = useState(business.nombreCafeteria || '')
  const [horario, setHorario] = useState(business.horarioNegocio)

  const updateDia = (key, config) => setHorario(prev => ({ ...prev, [key]: config }))

  const copyLunesToAll = () => {
    const lunes = horario.lunes
    const newHorario = {}
    DIAS.forEach(d => { newHorario[d.key] = { ...lunes } })
    setHorario(newHorario)
  }

  const validate = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'El nombre del negocio es obligatorio.'
    const algúnAbierto = DIAS.some(d => !horario[d.key].cerrado)
    if (!algúnAbierto) errs.horario = 'Debe haber al menos un día abierto.'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setServerError('')
    setSaving(true)

    // Guardar en contexto local antes de ir a Supabase
    saveBusinessInfo({ nombreCafeteria: nombre.trim(), horarioNegocio: horario })

    try {
      const { data: { user: supaUser } } = await supabase.auth.getUser()
      if (!supaUser) throw new Error('Sin sesión activa. Vuelve a iniciar sesión.')

      // Siempre: tiene_historial = false, tipo_formulario = 'diario'
      const negocio = await insertNegocio({
        usuarioId:                supaUser.id,
        nombreCafeteria:          nombre.trim(),
        horarioNegocio:           horario,
        tieneHistorialFinanciero: false,
      })

      setNegocioData({
        ...negocio,
        registrosDiarios:   [],
        registrosMensuales: [],
      })

      // Todos los negocios nuevos van siempre a captura diaria
      navigate('/captura-diaria')
    } catch (err) {
      console.error('[BusinessRegistrationPage]', err)
      setServerError(err.message ?? 'Error al guardar el negocio. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
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
              <span className="block text-lg font-bold text-dark-olive">Capital Coffee</span>
              <span className="block text-xs text-text-muted">Configuración inicial</span>
            </div>
          </div>

          {/* ══════════ FORMULARIO ÚNICO ══════════ */}
          <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center">
                <Building2 size={18} className="text-coffee" />
              </div>
              <h1 className="text-xl font-bold text-dark-olive">Tu negocio</h1>
            </div>
            <p className="text-sm text-text-muted mb-6 ml-12">
              Cuéntanos el nombre y los horarios de tu cafetería.
            </p>

            {/* Nombre */}
            <div className="flex flex-col gap-1 mb-6">
              <label htmlFor="biz-name" className="text-sm font-medium text-text-main">
                Nombre del negocio <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
                  <Coffee size={16} />
                </span>
                <input
                  id="biz-name"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Café El Rincón"
                  autoComplete="organization"
                  aria-invalid={!!errors.nombre}
                  className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-text-main
                    placeholder:text-text-muted transition-colors
                    focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
                    ${errors.nombre ? 'border-red-400' : 'border-border hover:border-beige'}`}
                />
              </div>
              {errors.nombre && (
                <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <span aria-hidden="true">⚠</span>{errors.nombre}
                </p>
              )}
            </div>

            {/* Horario */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-coffee" aria-hidden="true" />
                  <span className="text-sm font-medium text-text-main">Horario por día</span>
                </div>
                <button
                  type="button"
                  onClick={copyLunesToAll}
                  className="flex items-center gap-1.5 text-xs text-coffee hover:text-dark-olive
                    font-medium px-3 py-1.5 rounded-lg border border-coffee/30 hover:border-coffee
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-coffee/30"
                >
                  <Copy size={12} aria-hidden="true" />
                  Copiar lunes a todos
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {DIAS.map(dia => (
                  <DayRow
                    key={dia.key}
                    dia={dia}
                    config={horario[dia.key]}
                    onChange={cfg => updateDia(dia.key, cfg)}
                  />
                ))}
              </div>
              {errors.horario && (
                <p role="alert" className="text-xs text-red-600 flex items-center gap-1 mt-2">
                  <span aria-hidden="true">⚠</span>{errors.horario}
                </p>
              )}
            </div>

            {serverError && (
              <div role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200
                rounded-lg px-3 py-2 flex items-center gap-1.5 mt-4">
                <span aria-hidden="true">⚠</span>{serverError}
              </div>
            )}

            {/* Acción */}
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    Comenzar
                    <ChevronRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

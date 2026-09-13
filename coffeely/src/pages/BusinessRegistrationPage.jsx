/**
 * BusinessRegistrationPage.jsx — /registro-negocio
 * Paso 1: Nombre del negocio + horario por día
 * Paso 2: ¿Tiene historial financiero?
 * Al completar: marca registroNegocioCompletado y redirige según elección.
 */
import { useState } from 'react'
import { useNavigate }    from 'react-router-dom'
import { useApp }         from '../context/CoffeeShopContext'
import { supabase }       from '../services/supabase/client'
import { insertNegocio }  from '../services/supabase/negociosService'
import { Coffee, Clock, Calendar, ChevronRight, ChevronLeft, Copy, Building2, TrendingUp } from 'lucide-react'

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

  const [step, setStep]     = useState(1)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  /* ── Paso 1: nombre + horario ── */
  const [nombre, setNombre] = useState(business.nombreCafeteria || '')
  const [horario, setHorario] = useState(business.horarioNegocio)

  const updateDia = (key, config) => setHorario(prev => ({ ...prev, [key]: config }))

  const copyLunesToAll = () => {
    const lunes = horario.lunes
    const newHorario = {}
    DIAS.forEach(d => { newHorario[d.key] = { ...lunes } })
    setHorario(newHorario)
  }

  const validateStep1 = () => {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'El nombre del negocio es obligatorio.'
    const algúnAbierto = DIAS.some(d => !horario[d.key].cerrado)
    if (!algúnAbierto) errs.horario = 'Debe haber al menos un día abierto.'
    return errs
  }

  const handleStep1 = () => {
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    saveBusinessInfo({ nombreCafeteria: nombre.trim(), horarioNegocio: horario })
    setStep(2)
  }

  /* ── Paso 2: historial ── */
  const [historial, setHistorial] = useState(null) // true | false

  const handleFinish = async () => {
    if (historial === null) {
      setErrors({ historial: 'Selecciona una opción para continuar.' })
      return
    }
    setServerError('')
    setSaving(true)
    try {
      const { data: { user: supaUser } } = await supabase.auth.getUser()
      if (!supaUser) throw new Error('Sin sesión activa. Vuelve a iniciar sesión.')

      // Insertar negocio en Supabase
      const negocio = await insertNegocio({
        usuarioId:                supaUser.id,
        nombreCafeteria:          nombre.trim(),
        horarioNegocio:           horario,
        tieneHistorialFinanciero: historial,
      })

      // Actualizar estado global con los datos reales (incluyendo el id del negocio)
      setNegocioData({
        ...negocio,
        registrosDiarios:   [],
        registrosMensuales: [],
      })

      navigate(historial ? '/captura-historial' : '/captura-diaria')
    } catch (err) {
      console.error('[BusinessRegistrationPage]', err)
      setServerError(err.message ?? 'Error al guardar el negocio. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Indicador de pasos ── */
  const StepDots = () => (
    <div className="flex items-center gap-2 mb-8" aria-label={`Paso ${step} de 2`}>
      {[1, 2].map(n => (
        <div key={n} className={`h-2 rounded-full transition-all duration-300
          ${n === step ? 'w-8 bg-coffee' : n < step ? 'w-4 bg-coffee/40' : 'w-4 bg-border'}`} />
      ))}
      <span className="text-xs text-text-muted ml-1">Paso {step} de 2</span>
    </div>
  )

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
              <span className="block text-xs text-text-muted">Configuración inicial</span>
            </div>
          </div>

          <StepDots />

          {/* ══════════ PASO 1 ══════════ */}
          {step === 1 && (
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

              {/* Acción */}
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={handleStep1}
                  className="btn-primary flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════ PASO 2 ══════════ */}
          {step === 2 && (
            <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center">
                  <Calendar size={18} className="text-coffee" />
                </div>
                <h1 className="text-xl font-bold text-dark-olive">Historial financiero</h1>
              </div>
              <p className="text-sm text-text-muted mb-8 ml-12">
                Esto nos ayuda a darte predicciones más precisas desde el primer día.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">

                {/* Opción: negocio nuevo */}
                <button
                  type="button"
                  onClick={() => setHistorial(false)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-coffee/40
                    ${historial === false
                      ? 'border-coffee bg-cream/40 shadow-soft'
                      : 'border-border bg-white hover:border-coffee/50 hover:bg-cream/20'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                    ${historial === false ? 'bg-coffee text-cream' : 'bg-cream text-coffee'}`}>
                    <Coffee size={20} aria-hidden="true" />
                  </div>
                  <p className="font-bold text-dark-olive text-base mb-1">Negocio nuevo</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Estoy empezando o no tengo registros financieros previos. Comenzaré con capturas diarias.
                  </p>
                </button>

                {/* Opción: negocio establecido */}
                <button
                  type="button"
                  onClick={() => setHistorial(true)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-coffee/40
                    ${historial === true
                      ? 'border-coffee bg-cream/40 shadow-soft'
                      : 'border-border bg-white hover:border-coffee/50 hover:bg-cream/20'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                    ${historial === true ? 'bg-coffee text-cream' : 'bg-cream text-coffee'}`}>
                    <TrendingUp size={20} aria-hidden="true" />
                  </div>
                  <p className="font-bold text-dark-olive text-base mb-1">Negocio establecido</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Tengo meses de operación y puedo cargar datos históricos para mejores predicciones.
                  </p>
                </button>
              </div>

              {errors.historial && (
                <p role="alert" className="text-xs text-red-600 flex items-center gap-1 mb-4">
                  <span aria-hidden="true">⚠</span>{errors.historial}
                </p>
              )}

              {serverError && (
                <div role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200
                  rounded-lg px-3 py-2 flex items-center gap-1.5 mb-4">
                  <span aria-hidden="true">⚠</span>{serverError}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-between mt-8">
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrors({}) }}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main
                    font-medium transition-colors focus:outline-none focus:underline"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
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
          )}

        </div>
      </div>
    </div>
  )
}

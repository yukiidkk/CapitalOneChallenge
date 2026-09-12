/**
 * CoffeeShopContext.jsx
 * Estado global de la app. Todo se persiste en localStorage bajo la clave
 * "coffeely_state" para sobrevivir recargas sin backend.
 *
 * Modelo de datos:
 *   user                       — sesión activa
 *   business                   — datos del negocio + dataset financiero
 *     ├ nombreCafeteria
 *     ├ horarioNegocio          — objeto por día de la semana
 *     ├ tieneHistorialFinanciero — boolean | null
 *     ├ fechaRegistroNegocio    — ISO string
 *     ├ registroNegocioCompletado — boolean
 *     ├ registrosDiarios        — array
 *     └ registrosMensuales      — array
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CoffeeShopContext = createContext(null)
const LS_KEY = 'coffeely_state'

/* ── Horario vacío para un día ── */
const emptyDay = () => ({ abre: '08:00', cierra: '22:00', cerrado: false })

/* ── Estado inicial limpio (sin mocks) ── */
const INITIAL_BUSINESS = {
  nombreCafeteria: '',
  horarioNegocio: {
    lunes:     emptyDay(),
    martes:    emptyDay(),
    miercoles: emptyDay(),
    jueves:    emptyDay(),
    viernes:   emptyDay(),
    sabado:    emptyDay(),
    domingo:   { ...emptyDay(), cerrado: true },
  },
  tieneHistorialFinanciero: null,
  fechaRegistroNegocio: null,
  registroNegocioCompletado: false,
  registrosDiarios: [],
  registrosMensuales: [],
  // Campos legacy que aún usan componentes existentes — se mantienen por compat
  currency: 'MXN',
}

/* ── Leer desde localStorage ── */
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { user: null, business: INITIAL_BUSINESS }
    return JSON.parse(raw)
  } catch {
    return { user: null, business: INITIAL_BUSINESS }
  }
}

/* ── Guardar en localStorage ── */
function saveState(user, business) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ user, business }))
  } catch {
    // quota exceeded — silencioso
  }
}

/* ══════════════════════════════════════════════════════ */
export function AppProvider({ children }) {
  const stored = loadState()
  const [user, setUser]         = useState(stored.user)
  const [business, setBusiness] = useState({ ...INITIAL_BUSINESS, ...stored.business })

  /* Persistir cada vez que cambie user o business */
  useEffect(() => {
    saveState(user, business)
  }, [user, business])

  /* ── Auth ── */
  const login = useCallback((userData) => {
    setUser(userData ?? { email: 'demo@coffeely.mx', name: 'Demo' })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setBusiness(INITIAL_BUSINESS)
    localStorage.removeItem(LS_KEY)
  }, [])

  /* ── Negocio ── */
  const updateBusiness = useCallback((patch) => {
    setBusiness(prev => ({ ...prev, ...patch }))
  }, [])

  /* Completa el paso 1 del registro: nombre + horario */
  const saveBusinessInfo = useCallback(({ nombreCafeteria, horarioNegocio }) => {
    setBusiness(prev => ({ ...prev, nombreCafeteria, horarioNegocio }))
  }, [])

  /* Completa el paso 2: ¿tiene historial? */
  const saveHistorialChoice = useCallback((tieneHistorialFinanciero) => {
    setBusiness(prev => ({ ...prev, tieneHistorialFinanciero }))
  }, [])

  /* Marca el registro de negocio como completado */
  const completeBusinessRegistration = useCallback((tieneHistorialFinanciero) => {
    setBusiness(prev => ({
      ...prev,
      tieneHistorialFinanciero,
      fechaRegistroNegocio: new Date().toISOString(),
      registroNegocioCompletado: true,
    }))
  }, [])

  /* ── Registros diarios ── */
  const addRegistroDiario = useCallback((registro) => {
    // registro: { fecha, ingresosTotales, capitalDisponible, gastosFijos,
    //             gastosVariables, metaAhorro, numeroVentas }
    setBusiness(prev => {
      const existing = prev.registrosDiarios.findIndex(r => r.fecha === registro.fecha)
      const updated = [...prev.registrosDiarios]
      if (existing >= 0) {
        updated[existing] = registro        // sobrescribe
      } else {
        updated.push(registro)
      }
      return { ...prev, registrosDiarios: updated.sort((a, b) => a.fecha.localeCompare(b.fecha)) }
    })
  }, [])

  /* ── Registros mensuales ── */
  const addRegistroMensual = useCallback((registro) => {
    // registro: { mes, ingresosTotales, gastosFijos, gastosVariables,
    //             utilidadNeta, capitalDisponibleCierre }
    setBusiness(prev => {
      const existing = prev.registrosMensuales.findIndex(r => r.mes === registro.mes)
      const updated = [...prev.registrosMensuales]
      if (existing >= 0) {
        updated[existing] = registro
      } else {
        updated.push(registro)
      }
      return { ...prev, registrosMensuales: updated.sort((a, b) => a.mes.localeCompare(b.mes)) }
    })
  }, [])

  /* ── Compat: finishOnboarding (OnboardingPage legacy) ── */
  const finishOnboarding = useCallback((data) => {
    setBusiness(prev => ({ ...prev, ...data }))
  }, [])

  const value = {
    user,
    business,
    login,
    logout,
    updateBusiness,
    saveBusinessInfo,
    saveHistorialChoice,
    completeBusinessRegistration,
    addRegistroDiario,
    addRegistroMensual,
    finishOnboarding,
  }

  return (
    <CoffeeShopContext.Provider value={value}>
      {children}
    </CoffeeShopContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(CoffeeShopContext)
  if (!ctx) throw new Error('useApp must be within AppProvider')
  return ctx
}

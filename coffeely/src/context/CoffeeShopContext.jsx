/**
 * CoffeeShopContext.jsx
 * Fuente de verdad: Supabase.
 * localStorage solo como caché de última sesión para evitar
 * pantalla en blanco en la primera carga mientras se resuelve la BD.
 *
 * Modelo de estado:
 *   user                        — usuario de Supabase Auth (o null)
 *   business
 *     ├ id                      — UUID del negocio en Supabase
 *     ├ nombreCafeteria
 *     ├ horarioNegocio
 *     ├ tieneHistorialFinanciero
 *     ├ tipoFormulario           — 'diario' | 'mensual'
 *     ├ fechaRegistroNegocio
 *     ├ registroNegocioCompletado
 *     ├ registrosDiarios         — array (cargado desde Supabase)
 *     └ registrosMensuales       — array (cargado desde Supabase)
 *   loading                     — true mientras se carga desde Supabase
 */
import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react'
import { supabase }          from '../services/supabase/client'
import {
  getNegocio,
  insertNegocio,
  getRegistrosDiarios,
  upsertRegistroDiario,
  getEstadosMensuales,
  upsertEstadoMensual,
} from '../services/supabase/negociosService'

const CoffeeShopContext = createContext(null)
const LS_KEY = 'coffeely_cache'

/* ── Horario vacío por día ── */
const emptyDay = () => ({ abre: '08:00', cierra: '22:00', cerrado: false })

const INITIAL_BUSINESS = {
  id:                         null,
  nombreCafeteria:            '',
  horarioNegocio: {
    lunes:     emptyDay(),
    martes:    emptyDay(),
    miercoles: emptyDay(),
    jueves:    emptyDay(),
    viernes:   emptyDay(),
    sabado:    emptyDay(),
    domingo:   { ...emptyDay(), cerrado: true },
  },
  tieneHistorialFinanciero:   null,
  tipoFormulario:             'diario',
  fechaRegistroNegocio:       null,
  registroNegocioCompletado:  false,
  registrosDiarios:           [],
  registrosMensuales:         [],
  currency:                   'MXN', // compat legacy
}

/* ── Caché localStorage ── */
function loadCache() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveCache(user, business) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ user, business }))
  } catch { /* quota exceeded — silencioso */ }
}
function clearCache() {
  localStorage.removeItem(LS_KEY)
}

/* ════════════════════════════════════════════════════ */
export function AppProvider({ children }) {
  const cache = loadCache()

  const [user,     setUser]     = useState(cache?.user     ?? null)
  const [business, setBusiness] = useState({ ...INITIAL_BUSINESS, ...(cache?.business ?? {}) })
  const [loading,  setLoading]  = useState(true)

  // Evita doble-fetch en StrictMode
  const fetchedRef = useRef(false)

  /* ── Cargar datos reales desde Supabase cuando hay sesión ── */
  const loadFromSupabase = useCallback(async (supabaseUser) => {
    if (!supabaseUser) {
      setUser(null)
      setBusiness(INITIAL_BUSINESS)
      setLoading(false)
      clearCache()
      return
    }

    setUser({ id: supabaseUser.id, email: supabaseUser.email, name: supabaseUser.user_metadata?.user_name ?? supabaseUser.email })

    try {
      // 1. Negocio
      const negocio = await getNegocio(supabaseUser.id)

      if (!negocio) {
        // Usuario nuevo sin negocio registrado
        setBusiness(prev => ({ ...INITIAL_BUSINESS, registroNegocioCompletado: false }))
        setLoading(false)
        return
      }

      // 2. Registros del negocio en paralelo
      const [diarios, mensuales] = await Promise.all([
        getRegistrosDiarios(negocio.id),
        getEstadosMensuales(negocio.id),
      ])

      const fullBusiness = {
        ...negocio,
        registrosDiarios:  diarios,
        registrosMensuales: mensuales,
        currency: cache?.business?.currency ?? 'MXN',
      }

      setBusiness(fullBusiness)
      saveCache({ id: supabaseUser.id, email: supabaseUser.email, name: supabaseUser.user_metadata?.user_name ?? supabaseUser.email }, fullBusiness)
    } catch (err) {
      console.error('[AppProvider] Error cargando datos de Supabase:', err)
      // Fallback al caché si hay error de red
      if (cache?.business) setBusiness(prev => ({ ...INITIAL_BUSINESS, ...cache.business }))
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Escuchar cambios de sesión de Supabase Auth ── */
  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      if (!fetchedRef.current) {
        fetchedRef.current = true
        loadFromSupabase(data.session?.user ?? null)
      }
    })

    // Cambios posteriores (login, logout, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchedRef.current = true
      loadFromSupabase(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [loadFromSupabase])

  /* ── Auth helpers ── */
  const login = useCallback((userData) => {
    // Usado solo como fallback de compatibilidad — la sesión real la maneja Supabase
    setUser(userData ?? null)
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setBusiness(INITIAL_BUSINESS)
    clearCache()
  }, [])

  /* ── Negocio: guardar nombre + horario (paso 1) en estado local ── */
  const saveBusinessInfo = useCallback(({ nombreCafeteria, horarioNegocio }) => {
    setBusiness(prev => ({ ...prev, nombreCafeteria, horarioNegocio }))
  }, [])

  /* ── Negocio: completar registro (paso 2) + insertar en Supabase ── */
  const completeBusinessRegistration = useCallback(async (tieneHistorialFinanciero) => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (!supaUser) throw new Error('Sin sesión activa')

    setBusiness(prev => ({
      ...prev,
      tieneHistorialFinanciero,
      fechaRegistroNegocio:      new Date().toISOString(),
      registroNegocioCompletado: true,
    }))

    // El insert real lo hace BusinessRegistrationPage llamando a insertNegocio()
    // directamente — aquí solo actualizamos estado local para que los guards
    // redirijan inmediatamente sin esperar un re-fetch.
  }, [])

  /* ── Guardar negocio recién creado en el estado ── */
  const setNegocioData = useCallback((negocioData) => {
    setBusiness(prev => {
      const updated = { ...prev, ...negocioData }
      saveCache(user, updated)
      return updated
    })
  }, [user])

  /* ── Registros diarios: upsert local + Supabase ── */
  const addRegistroDiario = useCallback(async (registro) => {
    setBusiness(prev => {
      const existing = prev.registrosDiarios.findIndex(r => r.fecha === registro.fecha)
      const updated  = [...prev.registrosDiarios]
      if (existing >= 0) updated[existing] = registro
      else updated.push(registro)
      const next = { ...prev, registrosDiarios: updated.sort((a, b) => a.fecha.localeCompare(b.fecha)) }
      saveCache(user, next)
      return next
    })
    // El upsert real a Supabase lo hace DailyEntryPage directamente
  }, [user])

  /* ── Registros mensuales: upsert local ── */
  const addRegistroMensual = useCallback(async (registro) => {
    setBusiness(prev => {
      const existing = prev.registrosMensuales.findIndex(r => r.mes === registro.mes)
      const updated  = [...prev.registrosMensuales]
      if (existing >= 0) updated[existing] = registro
      else updated.push(registro)
      const next = { ...prev, registrosMensuales: updated.sort((a, b) => a.mes.localeCompare(b.mes)) }
      saveCache(user, next)
      return next
    })
    // El upsert real a Supabase lo hace HistoricalDataPage directamente
  }, [user])

  /* ── Refrescar datos desde Supabase ── */
  const refreshData = useCallback(async () => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (supaUser) await loadFromSupabase(supaUser)
  }, [loadFromSupabase])

  /* ── Compat legacy ── */
  const updateBusiness   = useCallback((patch) => setBusiness(prev => ({ ...prev, ...patch })), [])
  const saveHistorialChoice = useCallback((v) => setBusiness(prev => ({ ...prev, tieneHistorialFinanciero: v })), [])
  const finishOnboarding = useCallback((data) => setBusiness(prev => ({ ...prev, ...data })), [])

  const value = {
    user,
    business,
    loading,
    login,
    logout,
    updateBusiness,
    saveBusinessInfo,
    saveHistorialChoice,
    completeBusinessRegistration,
    setNegocioData,
    addRegistroDiario,
    addRegistroMensual,
    refreshData,
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

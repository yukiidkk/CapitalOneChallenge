/**
 * useAuth.js
 * Expone el usuario y el estado de carga de la sesión de Supabase Auth.
 *
 * Uso:
 *   const { user, session, loading } = useAuth()
 *
 *   - loading: true mientras Supabase resuelve la sesión inicial (evita
 *              parpadeos de redirección al recargar la página).
 *   - user:    objeto auth.User de Supabase, o null si no hay sesión.
 *   - session: objeto Session completo (con access_token, etc.), o null.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase/client'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = todavía cargando
  const [user,    setUser]    = useState(undefined)

  useEffect(() => {
    // 1. Obtener sesión activa al montar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
    })

    // 2. Suscribirse a cambios de sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
      setUser(newSession?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loading = session === undefined // undefined = aún no resuelto

  return { user, session, loading }
}

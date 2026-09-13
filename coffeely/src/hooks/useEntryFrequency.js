/**
 * useEntryFrequency.js
 * Determina si el negocio debe capturar en modo "diario" o "mensual".
 *
 * Lógica:
 *   - tipoFormulario === 'mensual' (negocio establecido con historial)  → 'mensual'
 *   - Si han pasado ≥ 30 días desde fechaRegistroNegocio               → 'mensual'
 *   - Cualquier otro caso                                              → 'diario'
 *
 * Ahora lee de Supabase a través del contexto (business viene de BD).
 */
import { useMemo } from 'react'
import { useApp }  from '../context/CoffeeShopContext'

export function useEntryFrequency() {
  const { business } = useApp()

  return useMemo(() => {
    // Si el negocio tiene historial financiero → siempre mensual
    if (business.tipoFormulario === 'mensual' || business.tieneHistorialFinanciero === true) {
      return { frecuencia: 'mensual', diasDesdeRegistro: 0 }
    }

    const { fechaRegistroNegocio } = business
    if (!fechaRegistroNegocio) {
      return { frecuencia: 'diario', diasDesdeRegistro: 0 }
    }

    const registro       = new Date(fechaRegistroNegocio)
    const ahora          = new Date()
    const diasDesdeRegistro = Math.floor((ahora - registro) / (1000 * 60 * 60 * 24))
    const frecuencia     = diasDesdeRegistro >= 30 ? 'mensual' : 'diario'

    return { frecuencia, diasDesdeRegistro }
  }, [business.tipoFormulario, business.tieneHistorialFinanciero, business.fechaRegistroNegocio])
}

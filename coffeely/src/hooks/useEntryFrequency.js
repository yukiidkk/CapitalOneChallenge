/**
 * useEntryFrequency.js
 * Determina si el negocio debe capturar datos en modo "diario" o "mensual".
 *
 * Lógica:
 *   - Si han pasado < 30 días desde fechaRegistroNegocio → "diario"
 *   - Si han pasado ≥ 30 días                           → "mensual"
 *   - Si fechaRegistroNegocio es null                   → "diario" (default)
 *
 * Retorna: { frecuencia: 'diario' | 'mensual', diasDesdeRegistro: number }
 */
import { useMemo } from 'react'
import { useApp }  from '../context/CoffeeShopContext'

export function useEntryFrequency() {
  const { business } = useApp()

  return useMemo(() => {
    const { fechaRegistroNegocio } = business

    if (!fechaRegistroNegocio) {
      return { frecuencia: 'diario', diasDesdeRegistro: 0 }
    }

    const registro = new Date(fechaRegistroNegocio)
    const ahora    = new Date()
    const diffMs   = ahora.getTime() - registro.getTime()
    const diasDesdeRegistro = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    const frecuencia = diasDesdeRegistro >= 30 ? 'mensual' : 'diario'

    return { frecuencia, diasDesdeRegistro }
  }, [business.fechaRegistroNegocio])
}

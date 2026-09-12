/**
 * usePendingEntries.js
 * Determina si hay capturas pendientes basándose en:
 *   - frecuencia (diario | mensual) de useEntryFrequency
 *   - horarioNegocio del contexto (si hoy el negocio está cerrado, no cuenta)
 *   - registrosDiarios / registrosMensuales del contexto
 *
 * Retorna:
 *   {
 *     pendienteHoy:      boolean  — falta captura del día/mes actual
 *     diasSinRegistrar:  number   — días corridos sin ningún registro nuevo
 *     yaPasoHoraCierre:  boolean  — la hora actual superó el cierre de hoy
 *     destino:           string   — '/captura-diaria' | '/captura-historial'
 *   }
 */
import { useMemo }           from 'react'
import { useApp }            from '../context/CoffeeShopContext'
import { useEntryFrequency } from './useEntryFrequency'

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

export function usePendingEntries() {
  const { business }      = useApp()
  const { frecuencia }    = useEntryFrequency()

  return useMemo(() => {
    const ahora     = new Date()
    const hoy       = ahora.toISOString().slice(0, 10)           // "YYYY-MM-DD"
    const mesActual = ahora.toISOString().slice(0, 7)             // "YYYY-MM"
    const diaSemana = DIAS_ES[ahora.getDay()]                     // "lunes", etc.
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes() // minutos desde medianoche

    const horarioDia = business.horarioNegocio?.[diaSemana]
    const negocioAbiertaHoy = horarioDia ? !horarioDia.cerrado : true

    /* ── ¿Ya pasó la hora de cierre? ── */
    let yaPasoHoraCierre = false
    if (negocioAbiertaHoy && horarioDia?.cierra) {
      const [h, m] = horarioDia.cierra.split(':').map(Number)
      yaPasoHoraCierre = horaActual >= h * 60 + m
    }

    /* ── ¿Hay captura pendiente hoy? ── */
    let pendienteHoy = false
    let diasSinRegistrar = 0
    const destino = frecuencia === 'mensual' ? '/captura-historial' : '/captura-diaria'

    if (frecuencia === 'diario') {
      const tieneHoy = business.registrosDiarios?.some(r => r.fecha === hoy)
      pendienteHoy = negocioAbiertaHoy && !tieneHoy

      /* Días sin registrar: diferencia entre hoy y el último registro */
      if (business.registrosDiarios?.length > 0) {
        const sorted = [...business.registrosDiarios].sort((a, b) => b.fecha.localeCompare(a.fecha))
        const ultimo = new Date(sorted[0].fecha + 'T00:00:00')
        const diff   = Math.floor((ahora - ultimo) / (1000 * 60 * 60 * 24))
        diasSinRegistrar = Math.max(0, diff)
      } else if (business.fechaRegistroNegocio) {
        /* Nunca ha registrado: contar desde el registro del negocio */
        const registro = new Date(business.fechaRegistroNegocio)
        diasSinRegistrar = Math.floor((ahora - registro) / (1000 * 60 * 60 * 24))
      }
    } else {
      /* Modo mensual */
      const tieneMes = business.registrosMensuales?.some(r => r.mes === mesActual)
      pendienteHoy = !tieneMes

      if (business.registrosMensuales?.length > 0) {
        const sorted = [...business.registrosMensuales].sort((a, b) => b.mes.localeCompare(a.mes))
        const [y, mo] = sorted[0].mes.split('-').map(Number)
        const ultimoMes = new Date(y, mo - 1, 1)
        diasSinRegistrar = Math.floor((ahora - ultimoMes) / (1000 * 60 * 60 * 24))
      }
    }

    return { pendienteHoy, diasSinRegistrar, yaPasoHoraCierre, destino }
  }, [
    business.registrosDiarios,
    business.registrosMensuales,
    business.horarioNegocio,
    business.fechaRegistroNegocio,
    frecuencia,
  ])
}

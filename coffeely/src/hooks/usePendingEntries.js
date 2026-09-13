/**
 * usePendingEntries.js
 * Determina si hay capturas pendientes usando datos reales de Supabase
 * (los arrays registrosDiarios / registrosMensuales vienen del contexto,
 * que a su vez los carga desde Supabase al iniciar sesión).
 */
import { useMemo }           from 'react'
import { useApp }            from '../context/CoffeeShopContext'
import { useEntryFrequency } from './useEntryFrequency'

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

export function usePendingEntries() {
  const { business }   = useApp()
  const { frecuencia } = useEntryFrequency()

  return useMemo(() => {
    // Si el negocio aún no está cargado, no hay pendiente
    if (!business.id) {
      return { pendienteHoy: false, diasSinRegistrar: 0, yaPasoHoraCierre: false, destino: '/captura-diaria' }
    }

    const ahora      = new Date()
    const hoy        = ahora.toISOString().slice(0, 10)
    const mesActual  = ahora.toISOString().slice(0, 7)
    const diaSemana  = DIAS_ES[ahora.getDay()]
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes()

    const horarioDia        = business.horarioNegocio?.[diaSemana]
    const negocioAbiertoHoy = horarioDia ? !horarioDia.cerrado : true

    /* ¿Ya pasó la hora de cierre? */
    let yaPasoHoraCierre = false
    if (negocioAbiertoHoy && horarioDia?.cierra) {
      const [h, m] = horarioDia.cierra.split(':').map(Number)
      yaPasoHoraCierre = horaActual >= h * 60 + m
    }

    let pendienteHoy     = false
    let diasSinRegistrar = 0
    const destino = frecuencia === 'mensual' ? '/captura-historial' : '/captura-diaria'

    if (frecuencia === 'diario') {
      const tieneHoy = business.registrosDiarios?.some(r => r.fecha === hoy)
      pendienteHoy   = negocioAbiertoHoy && !tieneHoy

      if (business.registrosDiarios?.length > 0) {
        const sorted = [...business.registrosDiarios].sort((a, b) => b.fecha.localeCompare(a.fecha))
        const ultimo = new Date(sorted[0].fecha + 'T00:00:00')
        diasSinRegistrar = Math.max(0, Math.floor((ahora - ultimo) / (1000 * 60 * 60 * 24)))
      } else if (business.fechaRegistroNegocio) {
        const registro   = new Date(business.fechaRegistroNegocio)
        diasSinRegistrar = Math.floor((ahora - registro) / (1000 * 60 * 60 * 24))
      }
    } else {
      const tieneMes = business.registrosMensuales?.some(r => r.mes === mesActual)
      pendienteHoy   = !tieneMes

      if (business.registrosMensuales?.length > 0) {
        const sorted     = [...business.registrosMensuales].sort((a, b) => b.mes.localeCompare(a.mes))
        const [y, mo]    = sorted[0].mes.split('-').map(Number)
        const ultimoMes  = new Date(y, mo - 1, 1)
        diasSinRegistrar = Math.floor((ahora - ultimoMes) / (1000 * 60 * 60 * 24))
      }
    }

    return { pendienteHoy, diasSinRegistrar, yaPasoHoraCierre, destino }
  }, [
    business.id,
    business.registrosDiarios,
    business.registrosMensuales,
    business.horarioNegocio,
    business.fechaRegistroNegocio,
    frecuencia,
  ])
}

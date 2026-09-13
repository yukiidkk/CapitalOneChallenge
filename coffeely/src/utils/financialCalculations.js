/**
 * financialCalculations.js
 * Utilidades de proyección financiera para el CashFlowChart.
 * Trabaja en la moneda base del negocio (MXN) y devuelve datos
 * listos para renderizar en Recharts.
 */

/**
 * projectCashFlow30Days
 * Genera una proyección día a día de 30 días combinando:
 *   a) Registros diarios reales ya guardados (si existen para ese día)
 *   b) Proyección basada en promedios para los días sin datos
 *
 * @param {object} params
 * @param {number} params.ventasPromedioDiarias   — ingresos promedio por día
 * @param {number} params.costosFijosMensuales    — gastos fijos del mes ÷ 30
 * @param {number} params.costosVariablesPromedio — gastos variables promedio por día
 * @param {number} params.balanceInicial          — capital disponible al inicio
 * @param {Array}  params.registrosDiarios        — array de registros reales del contexto
 * @param {string} params.mesBase                 — "YYYY-MM" del mes a proyectar
 *
 * @returns {Array<{
 *   dia: number,          — número de día (1–30)
 *   ingresos: number,     — ingresos del día (real o proyectado)
 *   gastos: number,       — gastos del día (real o proyectado)
 *   balance: number,      — balance acumulado al final del día
 *   esProyeccion: boolean — true = proyectado, false = dato real
 * }>}
 */
export function projectCashFlow30Days({
  ventasPromedioDiarias   = 0,
  costosFijosMensuales    = 0,
  costosVariablesPromedio = 0,
  balanceInicial          = 0,
  registrosDiarios        = [],
  mesBase                 = new Date().toISOString().slice(0, 7),
}) {
  const gastosFijoDiario = costosFijosMensuales / 30
  const resultado        = []
  let balanceAcumulado   = balanceInicial

  for (let dia = 1; dia <= 30; dia++) {
    const fechaDia = `${mesBase}-${String(dia).padStart(2, '0')}`
    const registro = registrosDiarios.find(r => r.fecha === fechaDia)

    let ingresos, gastos, esProyeccion

    if (registro) {
      ingresos      = registro.ingresosTotales   ?? ventasPromedioDiarias
      gastos        = (registro.gastosFijos ?? gastosFijoDiario)
                    + (registro.gastosVariables ?? costosVariablesPromedio)
      esProyeccion  = false
      // Si hay capital disponible registrado, actualizar balance
      if (registro.capitalDisponible != null) {
        balanceAcumulado = registro.capitalDisponible
      } else {
        balanceAcumulado += ingresos - gastos
      }
    } else {
      ingresos      = ventasPromedioDiarias
      gastos        = gastosFijoDiario + costosVariablesPromedio
      esProyeccion  = true
      balanceAcumulado += ingresos - gastos
    }

    resultado.push({
      dia,
      ingresos:      Math.max(0, Math.round(ingresos)),
      gastos:        Math.max(0, Math.round(gastos)),
      balance:       Math.round(balanceAcumulado),
      esProyeccion,
    })
  }

  return resultado
}

/**
 * calcularPromediosDiarios
 * Calcula promedios de ingresos y gastos variables a partir de
 * los registros diarios existentes.
 *
 * @param {Array} registrosDiarios
 * @returns {{ ventasPromedioDiarias: number, costosVariablesPromedio: number }}
 */
export function calcularPromediosDiarios(registrosDiarios = []) {
  if (registrosDiarios.length === 0) {
    return { ventasPromedioDiarias: 0, costosVariablesPromedio: 0 }
  }
  const n = registrosDiarios.length
  const ventasPromedioDiarias = registrosDiarios.reduce(
    (s, r) => s + (r.ingresosTotales ?? 0), 0
  ) / n
  const costosVariablesPromedio = registrosDiarios.reduce(
    (s, r) => s + (r.gastosVariables ?? 0), 0
  ) / n
  return { ventasPromedioDiarias, costosVariablesPromedio }
}

/**
 * calcularCostosFijosMensuales
 * Extrae gastos fijos mensuales desde registros mensuales o
 * diarios (suma de gastosFijos del mes más reciente).
 *
 * @param {Array} registrosMensuales
 * @param {Array} registrosDiarios
 * @param {string} mesActual — "YYYY-MM"
 * @returns {number}
 */
export function calcularCostosFijosMensuales(
  registrosMensuales = [],
  registrosDiarios   = [],
  mesActual          = new Date().toISOString().slice(0, 7),
) {
  // Prioridad 1: registro mensual del mes actual o el más reciente
  if (registrosMensuales.length > 0) {
    const sorted = [...registrosMensuales].sort((a, b) => b.mes.localeCompare(a.mes))
    return sorted[0].gastosFijos ?? 0
  }
  // Prioridad 2: suma de gastosFijos diarios del mes actual
  const delMes = registrosDiarios.filter(r => r.fecha?.startsWith(mesActual))
  if (delMes.length > 0) {
    // Los gastos fijos son constantes — devolvemos el del último día registrado
    const sorted = [...delMes].sort((a, b) => b.fecha.localeCompare(a.fecha))
    return (sorted[0].gastosFijos ?? 0) * 30
  }
  return 0
}

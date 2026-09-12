/**
 * useDashboardData.js
 * Calcula métricas y datos de gráfica a partir de los registros REALES
 * guardados en CoffeeShopContext. Sin valores mock hardcodeados.
 *
 * Métricas calculadas:
 *   expectedRevenue    — suma de ingresosTotales del mes actual (diarios)
 *                        o ingresosTotales del último mes (mensual)
 *   expectedExpenses   — suma de (gastosFijos + gastosVariables) del período
 *   minProfit          — ingresos - gastos
 *   liquidityForecast  — capitalDisponible más reciente
 *
 * chartData: registros diarios del mes actual para la gráfica.
 * riskLevel: calculado en base a margen y liquidez reales.
 */
import { useMemo }   from 'react'
import { useApp }    from '../context/CoffeeShopContext'
import { useCurrency } from '../contexts/CurrencyContext'

function calcRisk(rev, exp, liquidity) {
  if (rev === 0) return 'warning'
  const margin       = (rev - exp) / rev
  const liquidMonths = exp > 0 ? liquidity / (exp / 30) : 2
  if (margin >= 0.20 && liquidMonths >= 1.5) return 'healthy'
  if (margin >= 0.08 && liquidMonths >= 0.5) return 'warning'
  return 'danger'
}

export function useDashboardData() {
  const { business }        = useApp()
  const { format, convert } = useCurrency()

  /* ── Mes actual: "YYYY-MM" ── */
  const mesActual = new Date().toISOString().slice(0, 7)

  /* ── Métricas desde registros diarios del mes actual ── */
  const metricsFromDaily = useMemo(() => {
    const registrosMes = (business.registrosDiarios ?? [])
      .filter(r => r.fecha?.startsWith(mesActual))

    if (registrosMes.length === 0) return null

    const ingresos   = registrosMes.reduce((s, r) => s + (r.ingresosTotales   ?? 0), 0)
    const gastosFij  = registrosMes.reduce((s, r) => s + (r.gastosFijos       ?? 0), 0)
    const gastosVar  = registrosMes.reduce((s, r) => s + (r.gastosVariables   ?? 0), 0)
    const gastos     = gastosFij + gastosVar
    const profit     = ingresos - gastos
    const lastEntry  = [...registrosMes].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
    const liquidity  = lastEntry?.capitalDisponible ?? 0

    return { ingresos, gastos, profit, liquidity }
  }, [business.registrosDiarios, mesActual])

  /* ── Métricas desde registros mensuales (fallback o modo mensual) ── */
  const metricsFromMonthly = useMemo(() => {
    const all = (business.registrosMensuales ?? [])
    if (all.length === 0) return null

    const sorted   = [...all].sort((a, b) => b.mes.localeCompare(a.mes))
    const last     = sorted[0]
    const prev     = sorted[1] ?? null

    return {
      ingresos:  last.ingresosTotales,
      gastos:    (last.gastosFijos ?? 0) + (last.gastosVariables ?? 0),
      profit:    last.utilidadNeta,
      liquidity: last.capitalDisponibleCierre ?? 0,
      prevIngresos:  prev?.ingresosTotales ?? null,
      prevGastos:    prev ? (prev.gastosFijos ?? 0) + (prev.gastosVariables ?? 0) : null,
      prevProfit:    prev?.utilidadNeta ?? null,
      prevLiquidity: prev?.capitalDisponibleCierre ?? null,
    }
  }, [business.registrosMensuales])

  /* ── Selección final: diarios tienen prioridad si hay datos del mes ── */
  const base = metricsFromDaily ?? metricsFromMonthly ?? {
    ingresos: 0, gastos: 0, profit: 0, liquidity: 0,
  }

  const prevBase = metricsFromMonthly ?? null

  /* ── trend: % vs período anterior (solo si hay datos mensuales previos) ── */
  const trendPct = (current, prev) => {
    if (prev === null || prev === 0) return 0
    return Number(((current - prev) / Math.abs(prev) * 100).toFixed(1))
  }

  const metrics = useMemo(() => {
    const rev = base.ingresos
    const exp = base.gastos
    const prf = base.profit
    const liq = base.liquidity

    const prevRev = prevBase?.prevIngresos ?? null
    const prevExp = prevBase?.prevGastos   ?? null
    const prevPrf = prevBase?.prevProfit   ?? null
    const prevLiq = prevBase?.prevLiquidity ?? null

    return {
      expectedRevenue:   { valueMXN: rev, formatted: format(rev, 'MXN'), trend: trendPct(rev, prevRev) },
      expectedExpenses:  { valueMXN: exp, formatted: format(exp, 'MXN'), trend: trendPct(exp, prevExp) },
      minProfit:         { valueMXN: prf, formatted: format(prf, 'MXN'), trend: trendPct(prf, prevPrf) },
      liquidityForecast: { valueMXN: liq, formatted: format(liq, 'MXN'), trend: trendPct(liq, prevLiq) },
    }
  }, [base, prevBase, format])

  /* ── chartData: registros diarios del mes actual ── */
  const chartData = useMemo(() => {
    const registrosMes = (business.registrosDiarios ?? [])
      .filter(r => r.fecha?.startsWith(mesActual))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    if (registrosMes.length === 0) return []

    return registrosMes.map(r => {
      const gastos = (r.gastosFijos ?? 0) + (r.gastosVariables ?? 0)
      return {
        day:      parseInt(r.fecha.slice(8), 10), // día del mes
        revenue:  Math.round(convert(r.ingresosTotales ?? 0, 'MXN')),
        expenses: Math.round(convert(gastos, 'MXN')),
      }
    })
  }, [business.registrosDiarios, mesActual, convert])

  /* ── riskLevel ── */
  const riskLevel = useMemo(
    () => calcRisk(base.ingresos, base.gastos, base.liquidity),
    [base]
  )

  return { metrics, chartData, riskLevel }
}

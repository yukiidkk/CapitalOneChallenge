import { useMemo } from 'react'
import { useCurrency } from '../contexts/CurrencyContext'

const BASE = {
  expectedRevenue: 85_000, expectedExpenses: 61_000,
  minProfit: 18_000, liquidityForecast: 24_000,
  lastMonth: { expectedRevenue: 79_000, expectedExpenses: 58_500, minProfit: 15_200, liquidityForecast: 19_800 },
}

function generateChartData() {
  const dayCount = new Date().getDate()
  return Array.from({ length: dayCount }, (_, i) => {
    const day = i + 1
    const noise = Math.sin(day * 42) * 0.15
    return {
      day,
      revenue:  Math.round(BASE.expectedRevenue  / 30 * (1 + noise)),
      expenses: Math.round(BASE.expectedExpenses / 30 * (1 + noise * 0.6)),
    }
  })
}

function calcRisk(rev, exp, liquidity) {
  const margin = (rev - exp) / rev
  const liquidMonths = liquidity / (exp / 30)
  if (margin >= 0.20 && liquidMonths >= 1.5) return 'healthy'
  if (margin >= 0.08 && liquidMonths >= 0.5) return 'warning'
  return 'danger'
}

export function useDashboardData() {
  const { format, convert } = useCurrency()

  const metrics = useMemo(() => {
    return Object.fromEntries(
      ['expectedRevenue', 'expectedExpenses', 'minProfit', 'liquidityForecast'].map(key => {
        const valueMXN = BASE[key], lastMXN = BASE.lastMonth[key]
        const trend = Number(((valueMXN - lastMXN) / lastMXN * 100).toFixed(1))
        return [key, { valueMXN, formatted: format(valueMXN, 'MXN'), trend }]
      })
    )
  }, [format])

  const chartData = useMemo(() =>
    generateChartData().map(({ day, revenue, expenses }) => ({
      day,
      revenue:  Math.round(convert(revenue,  'MXN')),
      expenses: Math.round(convert(expenses, 'MXN')),
    })),
    [convert]
  )

  const riskLevel = useMemo(() =>
    calcRisk(BASE.expectedRevenue, BASE.expectedExpenses, BASE.liquidityForecast), []
  )

  return { metrics, chartData, riskLevel }
}

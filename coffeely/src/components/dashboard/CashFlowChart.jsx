/**
 * CashFlowChart.jsx
 * Proyección de flujo de caja a 30 días usando datos reales del contexto.
 *
 * Accesibilidad daltónica:
 *   - Ingresos:  línea SÓLIDA + puntos en diamante  (forma distinta)
 *   - Gastos:    línea PUNTEADA + puntos circulares  (forma distinta)
 *   - Balance:   área semitransparente + línea sólida más delgada
 *   → Tres series diferenciadas por forma/patrón, no solo color.
 *
 * Datos generados en financialCalculations.js a partir de:
 *   ventasPromedioDiarias, costosFijosMensuales, costosVariablesPromedio,
 *   balanceInicial — todos derivados de CoffeeShopContext.
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import { useApp } from '../../context/CoffeeShopContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import {
  projectCashFlow30Days,
  calcularPromediosDiarios,
  calcularCostosFijosMensuales,
} from '../../utils/financialCalculations'
import { ClipboardList } from 'lucide-react'

/* ── Intl.NumberFormat para formato de moneda ── */
function fmtMXN(value, symbol = '$') {
  const n = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
  return `${symbol}${n}`
}

/* ── Punto diamante para ingresos ── */
function DiamondDot({ cx, cy, fill, esProyeccion }) {
  if (cx == null || cy == null) return null
  const s = esProyeccion ? 3 : 5
  return (
    <polygon
      points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
      fill={fill}
      opacity={esProyeccion ? 0.45 : 0.9}
    />
  )
}

/* ── Tooltip personalizado ── */
function CustomTooltip({ active, payload, label, symbol }) {
  if (!active || !payload?.length) return null

  const hoy = new Date().getDate()
  const esProyeccion = Number(label) > hoy

  return (
    <div className="bg-white border border-border rounded-xl shadow-elevated px-4 py-3 text-sm min-w-[180px]">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="metric-label">Día {label}</p>
        {esProyeccion && (
          <span className="text-[10px] font-semibold text-text-muted bg-bg-light
            rounded-full px-2 py-0.5 border border-border">
            Proyectado
          </span>
        )}
      </div>
      {payload.map(e => {
        const labels = {
          ingresos: 'Ingresos',
          gastos: 'Gastos',
          balance: 'Balance',
        }
        /* Indicador de forma según serie */
        const shapes = {
          ingresos: <polygon points="0,-4 4,0 0,4 -4,0" fill={e.color}
            style={{ display: 'inline-block', marginRight: 4 }} />,
          gastos: <circle cx="0" cy="0" r="4" fill={e.color} />,
          balance: <rect x="-4" y="-3" width="8" height="6" fill={e.color} opacity={0.5} />,
        }
        return (
          <div key={e.dataKey} className="flex justify-between items-center gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="-5 -5 10 10" aria-hidden="true">
                {shapes[e.dataKey]}
              </svg>
              <span className="text-text-muted">{labels[e.dataKey] ?? e.dataKey}</span>
            </span>
            <span className="font-semibold text-text-main tabular-nums">
              {fmtMXN(e.value ?? 0, symbol)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Leyenda personalizada ── */
function CustomLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-text-muted">
      <span className="flex items-center gap-1.5">
        <svg width="24" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="24" y2="5" stroke="#6B4426" strokeWidth="2.5" />
          <polygon points="12,1 16,5 12,9 8,5" fill="#6B4426" />
        </svg>
        Ingresos (real)
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="24" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="24" y2="5" stroke="#4B5136" strokeWidth="2"
            strokeDasharray="4 3" />
          <circle cx="12" cy="5" r="3" fill="#4B5136" />
        </svg>
        Gastos (real)
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="24" height="10" aria-hidden="true">
          <rect x="0" y="2" width="24" height="6" fill="#6B4426" opacity="0.2" />
          <line x1="0" y1="5" x2="24" y2="5" stroke="#6B4426" strokeWidth="1.5"
            strokeDasharray="2 2" />
        </svg>
        Balance acumulado
      </span>
      <span className="flex items-center gap-1.5 italic opacity-60">
        <svg width="16" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="16" y2="5" stroke="#64665C" strokeWidth="1.5"
            strokeDasharray="2 2" opacity="0.5" />
        </svg>
        · · proyección
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════ */
export default function CashFlowChart() {
  const { t } = useTranslation()
  const { business } = useApp()
  const { currency: currCode, CURRENCIES, convert } = useCurrency()
  const symbol = CURRENCIES.find(c => c.code === currCode)?.symbol ?? '$'

  const mesActual = new Date().toISOString().slice(0, 7)
  const hoy = new Date().getDate()

  /* ── Calcular parámetros de proyección ── */
  const { ventasPromedioDiarias, costosVariablesPromedio } = useMemo(
    () => calcularPromediosDiarios(business.registrosDiarios ?? []),
    [business.registrosDiarios]
  )

  const costosFijosMensuales = useMemo(
    () => calcularCostosFijosMensuales(
      business.registrosMensuales ?? [],
      business.registrosDiarios ?? [],
      mesActual,
    ),
    [business.registrosMensuales, business.registrosDiarios, mesActual]
  )

  /* Capital inicial: último registro diario o el más reciente mensual */
  const balanceInicial = useMemo(() => {
    const diarios = (business.registrosDiarios ?? [])
      .filter(r => r.fecha?.startsWith(mesActual))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
    if (diarios.length > 0 && diarios[0].capitalDisponible != null)
      return diarios[0].capitalDisponible
    const mensuales = [...(business.registrosMensuales ?? [])]
      .sort((a, b) => b.mes.localeCompare(a.mes))
    return mensuales[0]?.capitalDisponibleCierre ?? 0
  }, [business.registrosDiarios, business.registrosMensuales, mesActual])

  /* ── Generar proyección 30 días ── */
  const rawData = useMemo(
    () => projectCashFlow30Days({
      ventasPromedioDiarias,
      costosFijosMensuales,
      costosVariablesPromedio,
      balanceInicial,
      registrosDiarios: business.registrosDiarios ?? [],
      mesBase: mesActual,
    }),
    [ventasPromedioDiarias, costosFijosMensuales, costosVariablesPromedio,
      balanceInicial, business.registrosDiarios, mesActual]
  )

  /* ── Convertir a moneda activa ── */
  const data = useMemo(
    () => rawData.map(d => ({
      dia: d.dia,
      ingresos: Math.round(convert(d.ingresos, 'MXN')),
      gastos: Math.round(convert(d.gastos, 'MXN')),
      balance: Math.round(convert(d.balance, 'MXN')),
      esProyeccion: d.esProyeccion,
    })),
    [rawData, convert]
  )

  /* ── Sin datos suficientes ── */
  const sinDatos = ventasPromedioDiarias === 0 && costosFijosMensuales === 0

  if (sinDatos) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <ClipboardList size={32} className="text-border" aria-hidden="true" />
        <p className="text-sm text-text-muted text-center max-w-xs">
          {t('dashboard.chart.noData')}
        </p>
      </div>
    )
  }

  /* ── Dominio Y dinámico ── */
  const allValues = data.flatMap(d => [d.ingresos, d.gastos, d.balance])
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPad = Math.abs(yMax - yMin) * 0.15 || 1000
  const yDomain = [
    Math.floor((yMin - yPad) / 1000) * 1000,
    Math.ceil((yMax + yPad) / 1000) * 1000,
  ]

  return (
    <div>
      <h2 className="text-base font-bold text-dark-olive mb-1">
        {t('dashboard.chart.title')}
      </h2>
      <p className="text-xs text-text-muted mb-5">
        Proyección a 30 días — los días anteriores a tu primer registro se muestran en 0.
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          role="img"
          aria-label="Gráfica de proyección de ingresos, gastos y balance a 30 días"
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="4 4"
            stroke="#E0DACF"
          />

          <XAxis
            dataKey="dia"
            tick={{ fontSize: 11, fill: '#64665C' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v % 5 === 0 || v === 1 ? `${v}` : ''}
          />

          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11, fill: '#64665C' }}
            axisLine={false}
            tickLine={false}
            width={62}
            tickFormatter={v => {
              const abs = Math.abs(v)
              const prefix = v < 0 ? '-' : ''
              return `${prefix}${symbol}${(abs / 1000).toFixed(0)}k`
            }}
          />

          <Tooltip
            content={<CustomTooltip symbol={symbol} />}
            cursor={{ stroke: '#CBB9A3', strokeWidth: 1, strokeDasharray: '3 3' }}
          />

          {/* Línea de cero para balance negativo */}
          {yDomain[0] < 0 && (
            <ReferenceLine y={0} stroke="#B91C1C" strokeDasharray="3 3"
              strokeWidth={1} opacity={0.5} />
          )}

          {/* Línea vertical "Hoy" */}
          <ReferenceLine
            x={hoy}
            stroke="#CBB9A3"
            strokeDasharray="3 3"
            label={{ value: 'Hoy', fill: '#8A8F73', fontSize: 10, position: 'insideTopRight' }}
          />

          {/* Balance: área semitransparente + línea */}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#6B4426"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            fill="#6B4426"
            fillOpacity={0.08}
            dot={false}
            activeDot={{ r: 4, fill: '#6B4426', stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Gastos: línea PUNTEADA + puntos circulares */}
          <Line
            type="monotone"
            dataKey="gastos"
            stroke="#4B5136"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={(props) => {
              const { cx, cy, payload } = props
              if (!cx || !cy) return null
              return (
                <circle
                  key={`g-${payload.dia}`}
                  cx={cx} cy={cy} r={payload.esProyeccion ? 2 : 3.5}
                  fill="#4B5136"
                  opacity={payload.esProyeccion ? 0.4 : 0.85}
                />
              )
            }}
            activeDot={{ r: 6, stroke: '#4B5136', strokeWidth: 2, fill: '#fff' }}
          />

          {/* Ingresos: línea SÓLIDA + diamantes */}
          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="#6B4426"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props
              return (
                <DiamondDot
                  key={`i-${payload.dia}`}
                  cx={cx} cy={cy}
                  fill="#6B4426"
                  esProyeccion={payload.esProyeccion}
                />
              )
            }}
            activeDot={{ r: 6, stroke: '#6B4426', strokeWidth: 2, fill: '#fff' }}
          />

        </ComposedChart>
      </ResponsiveContainer>

      <CustomLegend />
    </div>
  )
}

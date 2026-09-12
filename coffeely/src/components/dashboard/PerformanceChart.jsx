import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../../contexts/CurrencyContext'

function CustomTooltip({ active, payload, label, symbol, tRev, tExp, tDay }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-elevated px-4 py-3 text-sm min-w-[160px]">
      <p className="metric-label mb-2">{tDay} {label}</p>
      {payload.map(e => (
        <div key={e.dataKey} className="flex justify-between items-center gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} aria-hidden="true" />
            <span className="text-text-muted">{e.dataKey === 'revenue' ? tRev : tExp}</span>
          </span>
          <span className="font-semibold text-text-main">{symbol}{e.value?.toLocaleString('es-MX')}</span>
        </div>
      ))}
    </div>
  )
}

function DiamondDot({ cx, cy, fill }) {
  if (!cx || !cy) return null
  const s = 5
  return <polygon points={`${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`} fill={fill} opacity={0.85} />
}

export default function PerformanceChart({ data }) {
  const { t } = useTranslation()
  const { currency: currCode, CURRENCIES } = useCurrency()
  const symbol = CURRENCIES.find(c => c.code === currCode)?.symbol ?? '$'

  if (!data?.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-text-muted">
      {t('dashboard.chart.noData')}
    </div>
  )

  const yMax = Math.ceil(Math.max(...data.flatMap(d => [d.revenue, d.expenses])) * 1.15 / 1000) * 1000

  return (
    <div>
      <h2 className="text-base font-bold text-dark-olive mb-5">{t('dashboard.chart.title')}</h2>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E0DACF" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64665C' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, yMax]} tick={{ fontSize: 11, fill: '#64665C' }} axisLine={false} tickLine={false} width={60}
            tickFormatter={v => `${symbol}${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip symbol={symbol} tRev={t('dashboard.chart.revenue')} tExp={t('dashboard.chart.expenses')} tDay={t('dashboard.chart.day')} />}
            cursor={{ stroke: '#CBB9A3', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={v => v === 'revenue' ? t('dashboard.chart.revenue') : t('dashboard.chart.expenses')} />
          <Line type="monotone" dataKey="revenue" stroke="#6B4426" strokeWidth={2.5}
            dot={<DiamondDot fill="#6B4426" />} activeDot={{ r: 6, stroke: '#6B4426', strokeWidth: 2, fill: '#fff' }} />
          <Line type="monotone" dataKey="expenses" stroke="#4B5136" strokeWidth={2} strokeDasharray="5 3"
            dot={{ r: 3, fill: '#4B5136', opacity: 0.8 }} activeDot={{ r: 6, stroke: '#4B5136', strokeWidth: 2, fill: '#fff' }} />
          <ReferenceLine x={data[data.length-1]?.day} stroke="#CBB9A3" strokeDasharray="3 3"
            label={{ value: 'Hoy', fill: '#8A8F73', fontSize: 10, position: 'top' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

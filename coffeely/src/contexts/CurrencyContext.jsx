import { createContext, useContext, useState, useCallback } from 'react'
const CurrencyContext = createContext(null)

export const CURRENCIES = [
  { code: 'MXN', symbol: '$',   name: 'Peso mexicano' },
  { code: 'USD', symbol: 'US$', name: 'Dólar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
]
const RATES_TO_MXN = { MXN: 1, USD: 18, EUR: 20 }

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MXN')

  const convert = useCallback((amount, from, to) => {
    const target = to ?? currency
    if (from === target) return amount
    return (amount * (RATES_TO_MXN[from] ?? 1)) / (RATES_TO_MXN[target] ?? 1)
  }, [currency])

  const format = useCallback((amount, from = 'MXN') => {
    const converted = convert(amount, from)
    const info = CURRENCIES.find(c => c.code === currency)
    return `${info?.symbol ?? ''}${converted.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [convert, currency])

  const changeCurrency = (code) => { if (CURRENCIES.some(c => c.code === code)) setCurrency(code) }

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, CURRENCIES, convert, format, RATES_TO_MXN }}>
      {children}
    </CurrencyContext.Provider>
  )
}
export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be within CurrencyProvider')
  return ctx
}

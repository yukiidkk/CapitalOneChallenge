export const RATES_TO_MXN = { MXN: 1, USD: 18, EUR: 20 }
export const CURRENCY_SYMBOLS = { MXN: '$', USD: 'US$', EUR: '€' }

export function convertAmount(amount, from, to, rates = RATES_TO_MXN) {
  if (from === to) return amount
  return (amount * (rates[from] ?? 1)) / (rates[to] ?? 1)
}
export function formatCurrency(amount, currencyCode, locale = 'es-MX') {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? ''
  return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
export function convertAndFormat(amount, from, to, rates = RATES_TO_MXN, locale = 'es-MX') {
  return formatCurrency(convertAmount(amount, from, to, rates), to, locale)
}

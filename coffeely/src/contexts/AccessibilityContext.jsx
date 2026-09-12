import { createContext, useContext, useState, useEffect } from 'react'
const AccessibilityContext = createContext(null)

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem('coffeely-hc') === 'true'
  )
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) { root.setAttribute('data-theme', 'high-contrast'); root.classList.add('high-contrast') }
    else { root.removeAttribute('data-theme'); root.classList.remove('high-contrast') }
    localStorage.setItem('coffeely-hc', String(highContrast))
  }, [highContrast])

  return (
    <AccessibilityContext.Provider value={{ highContrast, toggleHighContrast: () => setHighContrast(p => !p) }}>
      {children}
    </AccessibilityContext.Provider>
  )
}
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be within AccessibilityProvider')
  return ctx
}

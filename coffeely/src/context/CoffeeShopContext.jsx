import { createContext, useContext, useState } from 'react'
const CoffeeShopContext = createContext(null)

const INITIAL_BUSINESS = {
  name: '', openTime: '08:00', closeTime: '22:00', currency: 'MXN',
  hasHistory: false, monthlyHistory: [],
  dailyEntry: { dailyRevenue: '', availableCapital: '', fixedExpenses: '', savingsGoal: '' },
}

export function AppProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [business, setBusiness] = useState(INITIAL_BUSINESS)

  const login = (userData) => setUser(userData ?? { email: 'demo@coffeely.mx', name: 'Demo' })
  const logout = () => { setUser(null); setBusiness(INITIAL_BUSINESS) }
  const finishOnboarding = (data) => setBusiness(prev => ({ ...prev, ...data }))
  const updateBusiness   = (patch) => setBusiness(prev => ({ ...prev, ...patch }))

  return (
    <CoffeeShopContext.Provider value={{ user, login, logout, business, updateBusiness, finishOnboarding }}>
      {children}
    </CoffeeShopContext.Provider>
  )
}
export function useApp() {
  const ctx = useContext(CoffeeShopContext)
  if (!ctx) throw new Error('useApp must be within AppProvider')
  return ctx
}

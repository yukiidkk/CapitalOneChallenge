/**
 * App.jsx — Raíz con react-router-dom v6
 *
 * Rutas:
 *   /            → LandingPage
 *   /login       → LoginPage
 *   /onboarding  → OnboardingPage (requiere auth)
 *   /dashboard   → DashboardPage  (requiere auth)
 *   *            → redirect a /
 *
 * Providers (exterior → interior):
 *   BrowserRouter → AccessibilityProvider → LanguageProvider
 *     → CurrencyProvider → AppProvider
 */
import './i18n'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { LanguageProvider }      from './contexts/LanguageContext'
import { CurrencyProvider }      from './contexts/CurrencyContext'
import { AppProvider, useApp }   from './contexts/AppContext'
import ErrorBoundary             from './components/ErrorBoundary'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage  from './pages/DashboardPage'

/* Guard: redirige a /login si no hay sesión */
function RequireAuth({ children }) {
  const { user } = useApp()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<LandingPage />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/dashboard"  element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AccessibilityProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AppProvider>
                <AppRoutes />
              </AppProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </AccessibilityProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

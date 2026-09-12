/**
 * App.jsx — Raíz con react-router-dom v6
 *
 * Rutas públicas:
 *   /                  → LandingPage
 *   /login             → LoginPage
 *   /registro          → RegisterPage
 *
 * Rutas protegidas (requieren sesión):
 *   /registro-negocio  → BusinessRegistrationPage  (requiere auth, NO negocio)
 *   /captura-diaria    → DailyEntryPage             (requiere auth + negocio)
 *   /captura-historial → HistoricalDataPage         (requiere auth + negocio)
 *   /dashboard         → DashboardPage              (requiere auth + negocio + ≥1 registro)
 *
 * Guards:
 *   RequireAuth        — redirige a /login si no hay sesión
 *   RequireBusiness    — redirige a /registro-negocio si negocio no completado
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
import { AppProvider, useApp }   from './context/CoffeeShopContext'
import ErrorBoundary             from './components/ErrorBoundary'

import LandingPage              from './pages/LandingPage'
import LoginPage                from './pages/LoginPage'
import RegisterPage             from './pages/RegisterPage'
import BusinessRegistrationPage from './pages/BusinessRegistrationPage'
import DailyEntryPage           from './pages/DailyEntryPage'
import HistoricalDataPage       from './pages/HistoricalDataPage'
import DashboardPage            from './pages/DashboardPage'

/* ─────────────────────────────────────────────────
   Guard 1: usuario autenticado
   Si no hay sesión → /login
───────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  return children
}

/* ─────────────────────────────────────────────────
   Guard 2: negocio registrado
   Si autenticado pero registroNegocioCompletado === false → /registro-negocio
   Aplica también a usuarios que llegaron via Google OAuth.
───────────────────────────────────────────────── */
function RequireBusiness({ children }) {
  const { user, business } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (!business.registroNegocioCompletado) return <Navigate to="/registro-negocio" replace />
  return children
}

/* ─────────────────────────────────────────────────
   Guard 3: negocio registrado + al menos 1 registro
   Si no hay datos → redirige al formulario correspondiente
───────────────────────────────────────────────── */
function RequireData({ children }) {
  const { user, business } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (!business.registroNegocioCompletado) return <Navigate to="/registro-negocio" replace />

  const hasDailyData   = business.registrosDiarios?.length > 0
  const hasMonthlyData = business.registrosMensuales?.length > 0

  if (!hasDailyData && !hasMonthlyData) {
    const dest = business.tieneHistorialFinanciero ? '/captura-historial' : '/captura-diaria'
    return <Navigate to={dest} replace />
  }

  return children
}

/* ─────────────────────────────────────────────────
   Guard: si ya tiene negocio registrado, no debe
   volver a /registro-negocio
───────────────────────────────────────────────── */
function RedirectIfBusinessDone({ children }) {
  const { user, business } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (business.registroNegocioCompletado) {
    const hasDailyData   = business.registrosDiarios?.length > 0
    const hasMonthlyData = business.registrosMensuales?.length > 0
    if (hasDailyData || hasMonthlyData) return <Navigate to="/dashboard" replace />
    const dest = business.tieneHistorialFinanciero ? '/captura-historial' : '/captura-diaria'
    return <Navigate to={dest} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Registro de negocio: requiere auth pero NO negocio completado */}
      <Route
        path="/registro-negocio"
        element={
          <RedirectIfBusinessDone>
            <BusinessRegistrationPage />
          </RedirectIfBusinessDone>
        }
      />

      {/* Captura de datos: requiere auth + negocio completado */}
      <Route
        path="/captura-diaria"
        element={
          <RequireBusiness>
            <DailyEntryPage />
          </RequireBusiness>
        }
      />
      <Route
        path="/captura-historial"
        element={
          <RequireBusiness>
            <HistoricalDataPage />
          </RequireBusiness>
        }
      />

      {/* Dashboard: requiere auth + negocio + ≥1 registro */}
      <Route
        path="/dashboard"
        element={
          <RequireData>
            <DashboardPage />
          </RequireData>
        }
      />

      {/* Legacy /onboarding → redirect al nuevo flujo */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Navigate to="/registro-negocio" replace />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
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

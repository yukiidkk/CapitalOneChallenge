/**
 * App.jsx — Raíz con react-router-dom v6
 *
 * Rutas públicas:
 *   /                  → LandingPage
 *   /login             → LoginPage
 *   /registro          → RegisterPage
 *
 * Rutas protegidas (requieren sesión Supabase real):
 *   /registro-negocio  → BusinessRegistrationPage  (auth, sin negocio aún)
 *   /captura-diaria    → DailyEntryPage             (auth + negocio)
 *   /captura-historial → HistoricalDataPage         (auth + negocio)
 *   /dashboard         → DashboardPage              (auth + negocio + ≥1 registro)
 *
 * Guards:
 *   RequireAuth             — sesión Supabase real; muestra spinner mientras carga
 *   RequireBusiness         — auth + registroNegocioCompletado
 *   RequireData             — auth + negocio + ≥1 registro
 *   RedirectIfBusinessDone  — evita volver a /registro-negocio si ya completó
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
import { useAuth }               from './hooks/useAuth'
import ErrorBoundary             from './components/ErrorBoundary'

import LandingPage              from './pages/LandingPage'
import LoginPage                from './pages/LoginPage'
import RegisterPage             from './pages/RegisterPage'
import BusinessRegistrationPage from './pages/BusinessRegistrationPage'
import DailyEntryPage           from './pages/DailyEntryPage'
import HistoricalDataPage       from './pages/HistoricalDataPage'
import DashboardPage            from './pages/DashboardPage'

/* ── Spinner de pantalla completa mientras Supabase resuelve la sesión ── */
function AuthLoading() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-coffee border-t-transparent
                       rounded-full animate-spin" aria-label="Cargando sesión" />
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Guard 1: usuario autenticado (sesión Supabase real)
   - Mientras carga → spinner (evita parpadeo de redirect)
   - Sin sesión     → /login
───────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

/* ─────────────────────────────────────────────────
   Guard 2: negocio registrado
   Requiere auth + registroNegocioCompletado === true
───────────────────────────────────────────────── */
function RequireBusiness({ children }) {
  const { user, loading } = useAuth()
  const { business }      = useApp()
  if (loading) return <AuthLoading />
  if (!user)   return <Navigate to="/login" replace />
  if (!business.registroNegocioCompletado) return <Navigate to="/registro-negocio" replace />
  return children
}

/* ─────────────────────────────────────────────────
   Guard 3: negocio + al menos 1 registro de datos
───────────────────────────────────────────────── */
function RequireData({ children }) {
  const { user, loading } = useAuth()
  const { business }      = useApp()
  if (loading) return <AuthLoading />
  if (!user)   return <Navigate to="/login" replace />
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
   Guard 4: evita volver a /registro-negocio si ya
   completó el registro del negocio
───────────────────────────────────────────────── */
function RedirectIfBusinessDone({ children }) {
  const { user, loading } = useAuth()
  const { business }      = useApp()
  if (loading) return <AuthLoading />
  if (!user)   return <Navigate to="/login" replace />
  if (business.registroNegocioCompletado) {
    const hasDailyData   = business.registrosDiarios?.length > 0
    const hasMonthlyData = business.registrosMensuales?.length > 0
    if (hasDailyData || hasMonthlyData) return <Navigate to="/dashboard" replace />
    const dest = business.tieneHistorialFinanciero ? '/captura-historial' : '/captura-diaria'
    return <Navigate to={dest} replace />
  }
  return children
}

/* ─────────────────────────────────────────────────
   Rutas
───────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Registro de negocio: auth pero sin negocio completado */}
      <Route path="/registro-negocio" element={
        <RedirectIfBusinessDone>
          <BusinessRegistrationPage />
        </RedirectIfBusinessDone>
      } />

      {/* Captura de datos: auth + negocio */}
      <Route path="/captura-diaria" element={
        <RequireBusiness><DailyEntryPage /></RequireBusiness>
      } />
      <Route path="/captura-historial" element={
        <RequireBusiness><HistoricalDataPage /></RequireBusiness>
      } />

      {/* Dashboard: auth + negocio + ≥1 registro */}
      <Route path="/dashboard" element={
        <RequireData><DashboardPage /></RequireData>
      } />

      {/* Legacy /onboarding → nuevo flujo */}
      <Route path="/onboarding" element={
        <RequireAuth><Navigate to="/registro-negocio" replace /></RequireAuth>
      } />

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

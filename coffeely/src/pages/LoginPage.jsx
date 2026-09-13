/**
 * LoginPage.jsx — Login / recuperación de contraseña.
 * Auth real con Supabase:
 *   - Email+password → supabase.auth.signInWithPassword()
 *   - Google         → supabase.auth.signInWithOAuth({ provider: 'google' })
 *   - Recovery       → supabase.auth.resetPasswordForEmail()
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/supabase/client'
import { useLanguage } from '../contexts/LanguageContext'
import FormField from '../components/ui/FormField'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

/* ── Controles de idioma ── */
function AuthControls() {
  const { t } = useTranslation()
  const { language, changeLanguage, LANGUAGES } = useLanguage()
  const cls = `text-xs bg-transparent border border-border rounded-lg px-2 py-1
               text-text-muted cursor-pointer hover:border-coffee transition-colors
               focus:outline-none focus:ring-2 focus:ring-coffee/30`
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <select value={language} onChange={e => changeLanguage(e.target.value)}
        aria-label={t('nav.language')} className={cls}>
        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </div>
  )
}

/* ── Ícono Google (inline SVG) ── */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

/* ══════════════════════════════════════════════ */
export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'recovery'
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.email)
      errs.email = t('errors.requiredField')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = t('errors.invalidEmail')
    if (mode !== 'recovery') {
      if (!form.password)
        errs.password = t('errors.requiredField')
      else if (form.password.length < 8)
        errs.password = t('errors.passwordShort')
    }
    return errs
  }

  /* ── Email + password login ── */
  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setServerError('')
    setLoading(true)

    try {
      if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setRecoverySent(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) throw error
        // onAuthStateChange en useAuth detecta la sesión → los guards redirigen
        navigate('/dashboard')
      }
    } catch (err) {
      setServerError(err.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  /* ── Google OAuth ── */
  const handleGoogle = async () => {
    setServerError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) setServerError(error.message)
    // Si no hay error, Supabase redirige al proveedor automáticamente
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <div className="py-4 px-6"><AuthControls /></div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                            text-cream font-bold text-xl shadow-elevated mb-3"
              style={{ background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)' }}
              aria-hidden="true">CF</div>
            <h1 className="text-2xl font-bold text-dark-olive tracking-tight">Capital Coffee</h1>
            <p className="text-sm text-text-muted mt-1">{t('auth.welcomeSub')}</p>
          </div>

          <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
            <h2 className="text-lg font-bold text-dark-olive mb-6">
              {mode === 'recovery' ? t('auth.recovery') : t('auth.welcomeBack')}
            </h2>

            {recoverySent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-coffee" />
                </div>
                <p className="text-sm font-semibold text-text-main">{t('auth.recoverySent')}</p>
                <button onClick={() => { setRecoverySent(false); setMode('login') }}
                  className="mt-4 text-sm text-coffee hover:text-dark-olive font-medium
                             focus:outline-none focus:underline transition-colors">
                  {t('auth.recoveryBack')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                {/* Error del servidor */}
                {serverError && (
                  <div role="alert"
                    className="text-xs text-red-600 bg-red-50 border border-red-200
                               rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <span aria-hidden="true">⚠</span>{serverError}
                  </div>
                )}

                {/* Email */}
                <FormField id="auth-email" label={t('auth.email')} type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={form.email} onChange={set('email')}
                  error={errors.email} autoComplete="email" required
                  icon={<Mail size={16} />} />

                {/* Contraseña */}
                {mode !== 'recovery' && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="auth-pw" className="text-sm font-medium text-text-main">
                      {t('auth.password')}
                      <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
                        <Lock size={16} />
                      </span>
                      <input id="auth-pw" type={showPw ? 'text' : 'password'}
                        value={form.password} onChange={set('password')}
                        placeholder={t('auth.passwordPlaceholder')}
                        autoComplete="current-password" aria-invalid={!!errors.password}
                        className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm
                          text-text-main placeholder:text-text-muted transition-colors
                          focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
                          ${errors.password ? 'border-red-400' : 'border-border hover:border-beige'}`} />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted
                                   hover:text-text-main transition-colors focus:outline-none">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p role="alert" className="text-xs text-red-600">⚠ {errors.password}</p>
                    )}
                  </div>
                )}

                {/* Olvidé contraseña */}
                {mode === 'login' && (
                  <div className="flex justify-end -mt-1">
                    <button type="button"
                      onClick={() => { setMode('recovery'); setErrors({}); setServerError('') }}
                      className="text-xs text-coffee hover:text-dark-olive font-medium
                                 focus:outline-none focus:underline transition-colors">
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {mode === 'recovery' ? t('auth.recoverySend') : t('auth.loginBtn')}
                    </span>
                  ) : (
                    mode === 'recovery' ? t('auth.recoverySend') : t('auth.loginBtn')
                  )}
                </button>

                {/* Google */}
                {mode !== 'recovery' && (
                  <>
                    <div className="flex items-center gap-3 my-1">
                      <span className="flex-1 h-px bg-border" aria-hidden="true" />
                      <span className="text-xs text-text-muted">{t('auth.orContinueWith')}</span>
                      <span className="flex-1 h-px bg-border" aria-hidden="true" />
                    </div>
                    <button type="button" onClick={handleGoogle}
                      className="w-full flex items-center justify-center gap-3 border border-border
                        hover:border-beige bg-card-bg rounded-xl py-2.5 text-sm font-medium
                        text-text-main hover:shadow-soft transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-coffee/30">
                      <GoogleIcon />{t('auth.loginGoogle')}
                    </button>
                  </>
                )}

                {/* Link cruzado → registro */}
                <p className="text-center text-xs text-text-muted mt-2">
                  {mode === 'login' ? (
                    <>
                      {t('auth.noAccount')}{' '}
                      <Link to="/registro"
                        className="text-coffee hover:text-dark-olive font-semibold
                                   focus:outline-none focus:underline transition-colors">
                        {t('auth.register')}
                      </Link>
                    </>
                  ) : (
                    <button type="button"
                      onClick={() => { setMode('login'); setErrors({}); setServerError('') }}
                      className="text-coffee hover:text-dark-olive font-semibold
                                 focus:outline-none focus:underline transition-colors">
                      {t('auth.recoveryBack')}
                    </button>
                  )}
                </p>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * RegisterPage.jsx — Registro de cuenta nueva con Supabase Auth.
 *   - Email+password → supabase.auth.signUp()
 *   - Google         → supabase.auth.signInWithOAuth({ provider: 'google' })
 *
 * La tabla "perfiles" se llena automáticamente mediante el trigger
 * handle_new_user() en Supabase — NO se inserta manualmente aquí.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase/client'
import FormField from '../components/ui/FormField'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'

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

/* ── Validaciones ── */
function validate(form) {
  const errs = {}
  if (!form.fullName.trim())
    errs.fullName = 'Este campo es obligatorio.'
  if (!form.email)
    errs.email = 'Este campo es obligatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = 'Ingresa un correo válido.'
  if (!form.password)
    errs.password = 'Este campo es obligatorio.'
  else if (form.password.length < 8)
    errs.password = 'Mínimo 8 caracteres.'
  else if (!/[A-Z]/.test(form.password))
    errs.password = 'Debe incluir al menos una letra mayúscula.'
  else if (!/[^A-Za-z0-9]/.test(form.password))
    errs.password = 'Debe incluir al menos un carácter especial (!@#$%…).'
  if (!form.confirm)
    errs.confirm = 'Este campo es obligatorio.'
  else if (form.confirm !== form.password)
    errs.confirm = 'Las contraseñas no coinciden.'
  return errs
}

/* ═══════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  // Supabase puede requerir confirmación de email — mostramos un aviso
  const [signedUp, setSignedUp] = useState(false)

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  /* ── Email + password signup ── */
  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setServerError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            // Se pasa al trigger handle_new_user() como raw_user_meta_data
            user_name: form.fullName,
          },
          emailRedirectTo: `${window.location.origin}/registro-negocio`,
        },
      })

      if (error) throw error

      // Si identities vacío → email ya registrado (Supabase devuelve 200 por seguridad)
      if (data.user && data.user.identities?.length === 0) {
        setServerError('Este correo ya tiene una cuenta. Inicia sesión.')
        return
      }

      // Si hay sesión activa ya (email confirm desactivado en Supabase) → redirigir
      if (data.session) {
        navigate('/registro-negocio')
      } else {
        // Supabase envió email de confirmación
        setSignedUp(true)
      }
    } catch (err) {
      setServerError(err.message ?? 'Algo salió mal. Intenta de nuevo.')
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
        redirectTo: `${window.location.origin}/registro-negocio`,
      },
    })
    if (error) setServerError(error.message)
  }

  /* ── Pantalla de confirmación de email ── */
  if (signedUp) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
        <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-10
                        max-w-md w-full text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center">
            <Mail size={26} className="text-coffee" />
          </div>
          <h2 className="text-xl font-bold text-dark-olive">Revisa tu correo</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Te enviamos un enlace de confirmación a <strong>{form.email}</strong>.
            Haz clic en él para activar tu cuenta y acceder a Capital Coffee.
          </p>
          <Link to="/login"
            className="text-sm text-coffee hover:text-dark-olive font-semibold
                       focus:outline-none focus:underline transition-colors">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                            text-cream font-bold text-xl shadow-elevated mb-3"
              style={{ background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)' }}
              aria-hidden="true">CF</div>
            <h1 className="text-2xl font-bold text-dark-olive tracking-tight">Capital Coffee</h1>
            <p className="text-sm text-text-muted mt-1">Crea tu cuenta y empieza hoy</p>
          </div>

          <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
            <h2 className="text-lg font-bold text-dark-olive mb-6">Crear cuenta</h2>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {/* Error del servidor */}
              {serverError && (
                <div role="alert"
                  className="text-xs text-red-600 bg-red-50 border border-red-200
                             rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <span aria-hidden="true">⚠</span>{serverError}
                </div>
              )}

              {/* Nombre completo */}
              <FormField id="reg-name" label="Nombre completo" type="text"
                placeholder="Ej. María García"
                value={form.fullName} onChange={set('fullName')}
                error={errors.fullName} autoComplete="name" required
                icon={<User size={16} />} />

              {/* Email */}
              <FormField id="reg-email" label="Correo electrónico" type="email"
                placeholder="tu@cafeteria.com"
                value={form.email} onChange={set('email')}
                error={errors.email} autoComplete="email" required
                icon={<Mail size={16} />} />

              {/* Contraseña */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-pw" className="text-sm font-medium text-text-main">
                  Contraseña<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
                    <Lock size={16} />
                  </span>
                  <input id="reg-pw" type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
                    placeholder="••••••••" autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'reg-pw-error' : 'reg-pw-hint'}
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
                {!errors.password && (
                  <p id="reg-pw-hint" className="text-xs text-text-muted">
                    Mínimo 8 caracteres, una mayúscula y un carácter especial.
                  </p>
                )}
                {errors.password && (
                  <p id="reg-pw-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                    <span aria-hidden="true">⚠</span>{errors.password}
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-cf" className="text-sm font-medium text-text-main">
                  Confirmar contraseña<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
                    <Lock size={16} />
                  </span>
                  <input id="reg-cf" type={showCf ? 'text' : 'password'}
                    value={form.confirm} onChange={set('confirm')}
                    placeholder="••••••••" autoComplete="new-password"
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? 'reg-cf-error' : undefined}
                    className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm
                      text-text-main placeholder:text-text-muted transition-colors
                      focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
                      ${errors.confirm ? 'border-red-400' : 'border-border hover:border-beige'}`} />
                  <button type="button" onClick={() => setShowCf(p => !p)}
                    aria-label={showCf ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted
                               hover:text-text-main transition-colors focus:outline-none">
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && (
                  <p id="reg-cf-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                    <span aria-hidden="true">⚠</span>{errors.confirm}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando cuenta…
                  </span>
                ) : 'Crear cuenta'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <span className="flex-1 h-px bg-border" aria-hidden="true" />
                <span className="text-xs text-text-muted">o continúa con</span>
                <span className="flex-1 h-px bg-border" aria-hidden="true" />
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-border
                  hover:border-beige bg-card-bg rounded-xl py-2.5 text-sm font-medium
                  text-text-main hover:shadow-soft transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-coffee/30">
                <GoogleIcon />
                Registrarse con Google
              </button>

              {/* Link cruzado */}
              <p className="text-center text-xs text-text-muted mt-2">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login"
                  className="text-coffee hover:text-dark-olive font-semibold
                             focus:outline-none focus:underline transition-colors">
                  Inicia sesión
                </Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

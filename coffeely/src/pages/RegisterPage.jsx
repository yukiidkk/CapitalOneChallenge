/**
 * RegisterPage.jsx — Registro de cuenta nueva.
 * Valida: campos no vacíos, email válido, contraseña ≥8 chars,
 * mínimo 1 mayúscula, mínimo 1 carácter especial, confirmación coincide.
 * Al enviar: guarda flag en localStorage y redirige a /onboarding.
 */
import { useState }            from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { useGoogleLogin }      from '@react-oauth/google'
import { useApp }              from '../context/CoffeeShopContext'
import { useAccessibility }    from '../contexts/AccessibilityContext'
import FormField               from '../components/ui/FormField'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'

/* ── Ícono Google (inline, sin dependencia extra) ── */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

/* ── Selector de contraste accesible ── */
function A11yBar() {
  const { highContrast, toggleHighContrast } = useAccessibility()
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
        aria-label="Modo de alto contraste"
        className={`text-xs px-2.5 py-1 rounded-lg border transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-coffee/30
          ${highContrast
            ? 'bg-dark-olive text-white border-dark-olive'
            : 'border-border text-text-muted hover:border-coffee'}`}
      >
        Alto contraste
      </button>
    </div>
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

/* ── Componente principal ── */
export default function RegisterPage() {
  const { login }  = useApp()
  const navigate   = useNavigate()

  const [form, setForm]     = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    // Simulación hackathon: guardar flag y hacer login
    localStorage.setItem('authenticated', 'true')
    login({ email: form.email, name: form.fullName })
    navigate('/onboarding')
  }

  const handleGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      })
        .then(r => r.json())
        .then(profile => {
          localStorage.setItem('authenticated', 'true')
          login({ email: profile.email, name: profile.name })
          navigate('/onboarding')
        })
        .catch(() => {
          localStorage.setItem('authenticated', 'true')
          login({ email: 'google@coffeely.mx', name: 'Google User' })
          navigate('/onboarding')
        })
    },
    onError: () => console.error('Google register fallido'),
  })

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">

      {/* Barra accesibilidad */}
      <div className="py-4 px-6">
        <A11yBar />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center
                         text-cream font-bold text-xl shadow-elevated mb-3"
              style={{ background: 'linear-gradient(135deg, #6B4426 0%, #4B5136 100%)' }}
              aria-hidden="true"
            >CF</div>
            <h1 className="text-2xl font-bold text-dark-olive tracking-tight">Coffeely</h1>
            <p className="text-sm text-text-muted mt-1">Crea tu cuenta y empieza hoy</p>
          </div>

          {/* Tarjeta */}
          <div className="bg-card-bg rounded-2xl border border-border shadow-soft p-8">
            <h2 className="text-lg font-bold text-dark-olive mb-6">Crear cuenta</h2>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {/* Nombre completo */}
              <FormField
                id="reg-name"
                label="Nombre completo"
                type="text"
                placeholder="Ej. María García"
                value={form.fullName}
                onChange={set('fullName')}
                error={errors.fullName}
                autoComplete="name"
                required
                icon={<User size={16} />}
              />

              {/* Email */}
              <FormField
                id="reg-email"
                label="Correo electrónico"
                type="email"
                placeholder="tu@cafeteria.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
                required
                icon={<Mail size={16} />}
              />

              {/* Contraseña */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-pw" className="text-sm font-medium text-text-main">
                  Contraseña<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">
                    <Lock size={16} />
                  </span>
                  <input
                    id="reg-pw"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'reg-pw-error' : 'reg-pw-hint'}
                    className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-text-main
                      placeholder:text-text-muted transition-colors
                      focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
                      ${errors.password ? 'border-red-400' : 'border-border hover:border-beige'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors focus:outline-none"
                  >
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
                  <input
                    id="reg-cf"
                    type={showCf ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? 'reg-cf-error' : undefined}
                    className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-text-main
                      placeholder:text-text-muted transition-colors
                      focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
                      ${errors.confirm ? 'border-red-400' : 'border-border hover:border-beige'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf(p => !p)}
                    aria-label={showCf ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors focus:outline-none"
                  >
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
              <button type="submit" className="btn-primary w-full justify-center mt-1">
                Crear cuenta
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <span className="flex-1 h-px bg-border" aria-hidden="true" />
                <span className="text-xs text-text-muted">o continúa con</span>
                <span className="flex-1 h-px bg-border" aria-hidden="true" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={() => handleGoogle()}
                className="w-full flex items-center justify-center gap-3 border border-border
                  hover:border-beige bg-card-bg rounded-xl py-2.5 text-sm font-medium
                  text-text-main hover:shadow-soft transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-coffee/30"
              >
                <GoogleIcon />
                Registrarse con Google
              </button>

              {/* Link cruzado */}
              <p className="text-center text-xs text-text-muted mt-2">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="text-coffee hover:text-dark-olive font-semibold focus:outline-none focus:underline transition-colors"
                >
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

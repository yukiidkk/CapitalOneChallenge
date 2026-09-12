/**
 * AppFooter.jsx
 * Pie de página compacto con copyright y links legales.
 */
import { Link } from 'react-router-dom'

export default function AppFooter() {
  return (
    <footer
      className="w-full border-t border-border bg-card-bg"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                      py-5 flex flex-col sm:flex-row items-center justify-between gap-3">

        <span className="text-xs text-text-muted">
          © {new Date().getFullYear()} Coffeely · Software Financiero para Cafeterías
        </span>

        <nav aria-label="Links legales" className="flex items-center gap-5">
          {['Privacidad de Datos', 'Seguridad', 'Accesibilidad'].map((label) => (
            <Link
              key={label}
              to="#"
              className="text-xs text-text-muted hover:text-text-main
                         transition-colors duration-150 focus:outline-none
                         focus:underline"
            >
              {label}
            </Link>
          ))}
        </nav>

      </div>
    </footer>
  )
}

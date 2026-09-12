/**
 * CtaFooterCard.jsx
 * Sección CTA de cierre con fondo dark-olive de alto contraste.
 * El botón "Acceder al Registro" es el elemento más llamativo de la sección.
 */
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CtaFooterCard() {
  return (
    <section
      className="bg-dark-olive rounded-2xl p-10 shadow-hero"
      aria-label="Registro de cuenta"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center
                      justify-between gap-8">

        {/* Texto */}
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-cream leading-tight
                         tracking-tight max-w-md">
            ¿Listo para registrar su establecimiento?
          </h2>
          <p className="mt-3 text-sm text-cream/75 leading-relaxed max-w-sm">
            Configure los parámetros de su cafetería en minutos y obtenga
            su primer pronóstico de liquidez el mismo día.
          </p>
        </div>

        {/* CTA principal — elemento más llamativo */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 flex-shrink-0
                     bg-cream hover:bg-white text-coffee
                     text-base font-bold px-8 py-4 rounded-xl
                     shadow-elevated hover:shadow-hero hover:scale-[1.03]
                     transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-cream/60 focus:ring-offset-2
                     focus:ring-offset-dark-olive"
        >
          Acceder al Registro
          <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </Link>

      </div>
    </section>
  )
}

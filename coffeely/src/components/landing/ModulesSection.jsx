/**
 * ModulesSection.jsx
 * Los 3 módulos del sistema — SIN emojis.
 * Íconos de lucide-react encerrados en contenedores visuales (TAREA 0.7).
 */
import { BarChart3, ShieldCheck, MessageCircle } from 'lucide-react'

const MODULES = [
  {
    Icon:  BarChart3,
    title: 'Modelado Adaptativo de Datos',
    desc:  'Formulario parametrizado para nuevos establecimientos (ingreso diario) o carga directa de estados financieros mensuales para negocios con historial.',
  },
  {
    Icon:  ShieldCheck,
    title: 'Procesamiento Anónimo con IA',
    desc:  'Protección estricta de confidencialidad mediante la anonimización de datos contables antes del análisis predictivo — sus cifras nunca salen en bruto.',
  },
  {
    Icon:  MessageCircle,
    title: 'Asistente Inteligente de Soporte',
    desc:  'Chatbot con restricciones de dominio para responder dudas exclusivas sobre el balance financiero de su cafetería, sin desvíos off-topic.',
  },
]

export default function ModulesSection() {
  return (
    <section
      className="bg-card-bg border border-border rounded-2xl shadow-soft p-8"
      aria-label="Módulos del sistema"
    >
      {/* Cabecera de sección */}
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-border">
        <h2 className="text-lg font-bold text-dark-olive">
          Arquitectura y Módulos del Sistema
        </h2>
        <span
          className="bg-sage text-white text-[10px] font-bold uppercase tracking-widest
                     px-3 py-1 rounded-full"
        >
          Enterprise Core
        </span>
      </div>

      {/* Lista de módulos */}
      <ul className="flex flex-col gap-5" role="list">
        {MODULES.map(({ Icon, title, desc }) => (
          <li
            key={title}
            className="flex items-start gap-4
                       group hover:bg-bg-light rounded-xl p-3 -mx-3
                       transition-all duration-200"
          >
            {/* Ícono en contenedor visual — TAREA 0.7 */}
            <span
              className="w-11 h-11 rounded-xl bg-cream flex items-center justify-center
                         text-coffee flex-shrink-0 shadow-soft
                         group-hover:bg-beige transition-colors duration-200"
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={1.75} />
            </span>

            <div>
              <h3 className="text-sm font-semibold text-text-main">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed mt-1">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Spinner.jsx — indicador de carga accesible.
 * Props:
 *   size   — px del cuadrado (default 24)
 *   label  — texto para lectores de pantalla (default "Cargando…")
 *   color  — clase de color Tailwind (default "text-coffee")
 */
export default function Spinner({ size = 24, label = 'Cargando…', color = 'text-coffee' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`animate-spin ${color}`}
        aria-hidden="true"
      >
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="45"
          opacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

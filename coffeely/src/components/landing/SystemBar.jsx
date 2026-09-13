/**
 * SystemBar.jsx
 * Barra superior de estado del motor.
 */

export default function SystemBar() {
  return (
    <div className="bg-dark-olive text-cream text-xs font-medium
                    border-b border-white/10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                      h-9 flex items-center">

        {/* Estado del motor */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          <span className="tracking-wide">Motor de Tesorería</span>
          <span className="hidden sm:inline text-white/30 mx-1">·</span>
          <span className="hidden sm:inline text-white/50">Sistema operativo</span>
        </div>

      </div>
    </div>
  )
}

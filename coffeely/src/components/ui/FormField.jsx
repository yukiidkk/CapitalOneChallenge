export default function FormField({ id, label, type='text', placeholder='', value, onChange, error, icon, required=false, autoComplete, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text-main">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true">{icon}</span>}
        <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
          autoComplete={autoComplete} required={required} aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-text-main
            placeholder:text-text-muted transition-colors
            focus:outline-none focus:ring-2 focus:ring-coffee/40 focus:border-coffee
            ${icon ? 'pl-10' : ''} ${error ? 'border-red-400' : 'border-border hover:border-beige'}`}
        />
      </div>
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-red-600 flex items-center gap-1"><span aria-hidden="true">⚠</span>{error}</p>}
    </div>
  )
}

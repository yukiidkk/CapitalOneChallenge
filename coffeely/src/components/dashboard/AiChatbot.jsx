/**
 * AiChatbot.jsx
 * Panel de chat flotante con asistente financiero de IA.
 *
 * - Botón flotante en la esquina inferior derecha que abre/cierra el panel.
 * - Mensajes del usuario alineados a la derecha (burbuja coffee).
 * - Mensajes del asistente alineados a la izquierda (burbuja card-bg).
 * - Redirecciones fuera de tema: misma burbuja + sugerencias rápidas.
 * - Indicador "escribiendo..." mientras espera respuesta.
 * - Llama a getChatResponse(message, context) — sin lógica de restricción propia.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, MessageSquare, X, Bot }              from 'lucide-react'
import { useApp }           from '../../context/CoffeeShopContext'
import { useDashboardData } from '../../hooks/useDashboardData'
import { getChatResponse }  from '../../services/gemini/index'
import Spinner              from '../ui/Spinner'

/* ── Sugerencias rápidas que se muestran después de una redirección ── */
const QUICK_SUGGESTIONS = [
  '¿Cómo va mi flujo de caja?',
  '¿Qué significa el semáforo rojo?',
  'Dame un consejo de ahorro',
]

/* ── Mensaje de bienvenida inicial ── */
const WELCOME_MESSAGE = {
  id:   'welcome',
  role: 'assistant',
  text: 'Hola, soy tu asistente financiero de Coffeely. Puedo ayudarte a entender tu flujo de caja, interpretar el semáforo de riesgo, analizar tus gastos y darte consejos prácticos para tu cafetería. ¿En qué puedo ayudarte hoy?',
  ts:   Date.now(),
}

/* ── Detecta si es un mensaje de redirección (fuera de tema).
   Solo se activa cuando el asistente dice explícitamente que no puede
   ayudar con algo — no en respuestas normales que mencionan finanzas. ── */
function esRedireccion(text) {
  const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  /* Frases que el fallback/Gemini usan cuando redirigen fuera de tema */
  const patrones = [
    'solo puedo ayudarte con temas',
    'solo puede ayudarte con temas',
    'fuera de ese ambito',
    'no puedo ayudarte con eso',
    'ese tema esta fuera',
    'no esta dentro de mis capacidades',
    'no tengo informacion sobre',
  ]
  return patrones.some(p => norm.includes(p))
}

/* ── Burbuja de mensaje ── */
function MessageBubble({ msg, onSuggestion }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-coffee text-cream rounded-br-md'
            : 'bg-card-bg border border-border text-text-main rounded-bl-md shadow-soft'
          }`}
      >
        {msg.text}
      </div>

      {/* Sugerencias rápidas después de redirección */}
      {!isUser && msg.showSuggestions && onSuggestion && (
        <div className="flex flex-wrap gap-1.5 max-w-[90%] mt-1">
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="text-xs text-coffee border border-coffee/30 hover:border-coffee
                hover:bg-cream/50 rounded-xl px-3 py-1.5 transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-coffee/30"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Indicador "escribiendo..." ── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="bg-card-bg border border-border rounded-2xl rounded-bl-md
        px-4 py-3 flex items-center gap-2 shadow-soft">
        <Spinner size={14} label="El asistente está escribiendo" color="text-coffee" />
        <span className="text-xs text-text-muted">Escribiendo…</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════ */
export default function AiChatbot() {
  const { business }  = useApp()
  const { metrics }   = useDashboardData()

  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput]     = useState('')
  const [typing, setTyping]   = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const listRef    = useRef(null)

  /* Scroll al último mensaje */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  /* Focus al input al abrir */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  /* Construir contexto desde el store */
  const buildContext = useCallback(() => {
    const mesActual = new Date().toISOString().slice(0, 7)
    const diarios   = (business.registrosDiarios ?? [])
      .filter(r => r.fecha?.startsWith(mesActual))
    const ingresos  = diarios.reduce((s, r) => s + (r.ingresosTotales ?? 0), 0)
    const gastos    = diarios.reduce(
      (s, r) => s + (r.gastosFijos ?? 0) + (r.gastosVariables ?? 0), 0
    )
    const lastEntry = [...diarios].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]

    // Nivel de riesgo derivado de las métricas actuales
    const rev = metrics?.expectedRevenue?.valueMXN   ?? 0
    const exp = metrics?.expectedExpenses?.valueMXN  ?? 0
    const liq = metrics?.liquidityForecast?.valueMXN ?? 0
    const margin = rev > 0 ? (rev - exp) / rev : 0
    const nivel = margin >= 0.2 ? 'verde' : margin >= 0.08 ? 'amarillo' : 'rojo'

    return {
      nombreCafeteria:      business.nombreCafeteria || '',
      capitalDisponible:    lastEntry?.capitalDisponible ?? liq,
      ingresosUltimoMes:    ingresos || rev,
      gastosUltimoMes:      gastos   || exp,
      nivel,
    }
  }, [business, metrics])

  /* Enviar mensaje */
  const send = useCallback(async (text) => {
    const msg = text.trim()
    if (!msg || typing) return
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', text: msg, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    try {
      const ctx      = buildContext()
      const response = await getChatResponse(msg, ctx)
      const isRedir  = esRedireccion(response)

      setMessages(prev => [...prev, {
        id:             Date.now() + 1,
        role:           'assistant',
        text:           response,
        ts:             Date.now(),
        showSuggestions: isRedir,
      }])
    } finally {
      setTyping(false)
    }
  }, [typing, buildContext])

  const handleSubmit = e => {
    e.preventDefault()
    send(input)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Cerrar asistente financiero' : 'Abrir asistente financiero'}
        aria-expanded={open}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-elevated
          flex items-center justify-center transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-coffee/50 focus:ring-offset-2
          ${open
            ? 'bg-dark-olive text-cream hover:bg-dark-olive/90'
            : 'bg-coffee text-cream hover:bg-dark-olive'
          }`}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* ── Panel del chat ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Asistente financiero Coffeely"
          aria-modal="false"
          className="fixed bottom-24 right-6 z-40
            w-[calc(100vw-3rem)] max-w-sm
            bg-bg-light border border-border rounded-2xl shadow-hero
            flex flex-col overflow-hidden
            transition-all duration-300"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3
            bg-card-bg border-b border-border flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-coffee flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-cream" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark-olive leading-none">Asistente Financiero</p>
              <p className="text-[10px] text-text-muted mt-0.5 truncate">
                {business.nombreCafeteria || 'Coffeely'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="text-text-muted hover:text-text-main transition-colors
                focus:outline-none focus:ring-2 focus:ring-coffee/30 rounded p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Lista de mensajes */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            aria-live="polite"
            aria-label="Historial de conversación"
          >
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSuggestion={send}
              />
            ))}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-3 py-3
              bg-card-bg border-t border-border flex-shrink-0"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta financiera…"
              rows={1}
              disabled={typing}
              aria-label="Mensaje para el asistente"
              className="flex-1 resize-none rounded-xl border border-border bg-white
                px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted
                transition-colors focus:outline-none focus:ring-2 focus:ring-coffee/40
                focus:border-coffee hover:border-beige disabled:opacity-50
                max-h-24 overflow-y-auto"
              style={{ lineHeight: '1.4' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Enviar mensaje"
              className="w-10 h-10 rounded-xl bg-coffee hover:bg-dark-olive text-cream
                flex items-center justify-center flex-shrink-0
                transition-all duration-200 focus:outline-none focus:ring-2
                focus:ring-coffee/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {typing
                ? <Spinner size={16} label="Enviando…" color="text-cream" />
                : <Send size={16} aria-hidden="true" />
              }
            </button>
          </form>
        </div>
      )}
    </>
  )
}

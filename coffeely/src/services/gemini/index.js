/**
 * src/services/gemini/index.js — Capa unificadora
 *
 * Expone dos funciones públicas:
 *   getRiskAnalysis(metrics)          → { nivel, justificacion, recomendaciones }
 *   getChatResponse(message, context) → string
 *
 * Patrón: intenta Gemini → si falla por CUALQUIER razón → fallback silencioso.
 * Los componentes que consumen estas funciones nunca necesitan saber cuál
 * fuente respondió.
 */
import { callGemini }                from './geminiClient'
import { getFallbackRiskAnalysis, getFallbackChatResponse } from './fallbackHandler'

/* ── Extrae JSON de una cadena que puede tener bloques ```json ... ``` ── */
function extractJSON(text) {
  // Intentar quitar bloques de código markdown si Gemini los incluye
  const clean = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  return JSON.parse(clean)
}

/* ══════════════════════════════════════════════
   ANÁLISIS DE RIESGO
══════════════════════════════════════════════ */

const RISK_SYSTEM = `Eres un analista financiero especializado en pequeñas cafeterías en México.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques markdown.
El JSON debe tener exactamente estas tres claves:
- "nivel": "verde", "amarillo" o "rojo"
- "justificacion": string de 2-3 oraciones explicando el análisis en lenguaje sencillo para un dueño sin formación contable
- "recomendaciones": array de exactamente 2 strings con acciones concretas y accionables
No incluyas ningún texto fuera del JSON.`

/**
 * getRiskAnalysis({ balance, ingresosProyectados, gastosEstimados })
 * @returns {{ nivel: string, justificacion: string, recomendaciones: string[] }}
 */
export async function getRiskAnalysis(metrics) {
  const { balance = 0, ingresosProyectados = 0, gastosEstimados = 0 } = metrics

  const prompt = `Analiza la salud financiera de una cafetería con estos datos:
- Capital disponible (balance): $${balance.toLocaleString('es-MX')} MXN
- Ingresos proyectados del período: $${ingresosProyectados.toLocaleString('es-MX')} MXN
- Gastos estimados del período: $${gastosEstimados.toLocaleString('es-MX')} MXN
- Margen bruto: ${ingresosProyectados > 0 ? Math.round(((ingresosProyectados - gastosEstimados) / ingresosProyectados) * 100) : 0}%

Clasifica el nivel de riesgo y da recomendaciones accionables.
Responde SOLO con el JSON especificado.`

  try {
    const raw     = await callGemini(prompt, RISK_SYSTEM)
    const parsed  = extractJSON(raw)

    // Validar estructura esperada
    if (
      !['verde', 'amarillo', 'rojo'].includes(parsed.nivel) ||
      typeof parsed.justificacion !== 'string'              ||
      !Array.isArray(parsed.recomendaciones)                ||
      parsed.recomendaciones.length < 2
    ) {
      throw new Error('Estructura JSON inválida')
    }

    return parsed
  } catch {
    // Cualquier error (red, rate limit, JSON malformado, estructura inválida)
    // → fallback silencioso
    return getFallbackRiskAnalysis(metrics)
  }
}

/* ══════════════════════════════════════════════
   CHAT DE SOPORTE
══════════════════════════════════════════════ */

const CHAT_SYSTEM = `Eres el asistente financiero de una cafetería en México.
RESTRICCIONES ESTRICTAS:
1. Solo puedes responder preguntas relacionadas con finanzas, operaciones y gestión de la cafetería.
2. Si el usuario pregunta algo fuera de ese ámbito, redirígelo amablemente a temas financieros del negocio.
3. Usa lenguaje sencillo, sin tecnicismos innecesarios.
4. Tus respuestas deben ser concisas (máximo 4 oraciones) y siempre terminan con algo accionable.
5. NO des consejos médicos, legales, políticos ni de ningún otro dominio fuera de finanzas de cafeterías.
6. Responde en español.`

/**
 * getChatResponse(message, context)
 * context: { nombreCafeteria, capitalDisponible, ingresosUltimoMes,
 *             gastosUltimoMes, nivel, ventasPromedioDiarias }
 * @returns {Promise<string>}
 */
export async function getChatResponse(message, context = {}) {
  const nombre  = context.nombreCafeteria || 'la cafetería'
  const capital = context.capitalDisponible != null
    ? `$${Number(context.capitalDisponible).toLocaleString('es-MX')} MXN`
    : 'no disponible'

  const contextBlock = `
Contexto del negocio:
- Nombre: ${nombre}
- Capital disponible: ${capital}
- Ingresos último período: ${context.ingresosUltimoMes != null ? '$' + Number(context.ingresosUltimoMes).toLocaleString('es-MX') + ' MXN' : 'no disponible'}
- Gastos último período: ${context.gastosUltimoMes != null ? '$' + Number(context.gastosUltimoMes).toLocaleString('es-MX') + ' MXN' : 'no disponible'}
- Nivel de riesgo actual: ${context.nivel ?? 'no calculado'}
`.trim()

  const prompt = `${contextBlock}\n\nPregunta del dueño: ${message}`

  try {
    const response = await callGemini(prompt, CHAT_SYSTEM)
    if (!response || response.trim().length === 0) throw new Error('Respuesta vacía')
    return response.trim()
  } catch {
    return getFallbackChatResponse(message, context)
  }
}

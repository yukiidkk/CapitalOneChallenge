/**
 * geminiClient.js
 * Capa de comunicación con la API de Gemini.
 * - Nunca imprime la API key en consola ni en mensajes de error.
 * - Timeout de 8 s via AbortController.
 * - Errores controlados: GEMINI_UNAVAILABLE | GEMINI_RATE_LIMIT | GEMINI_NO_KEY
 */

const GEMINI_MODEL   = 'gemini-2.0-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const TIMEOUT_MS     = 8_000

/* ── Errores internos tipados ── */
export class GeminiError extends Error {
  constructor(code, message) {
    super(message)
    this.name  = 'GeminiError'
    this.code  = code          // 'GEMINI_NO_KEY' | 'GEMINI_RATE_LIMIT' | 'GEMINI_UNAVAILABLE'
  }
}

/**
 * callGemini(prompt, systemInstruction?)
 * Llama a Gemini y devuelve el texto plano de la primera parte de la respuesta.
 * @throws {GeminiError}
 */
export async function callGemini(prompt, systemInstruction = '') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey || apiKey.trim() === '') {
    throw new GeminiError('GEMINI_NO_KEY', 'API key no configurada.')
  }

  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const body = {
    contents: [
      { role: 'user', parts: [{ text: prompt }] },
    ],
  }

  if (systemInstruction.trim()) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  let response
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    })
  } catch (err) {
    // AbortError = timeout; TypeError = red caída
    throw new GeminiError('GEMINI_UNAVAILABLE', 'Error de red o timeout al contactar Gemini.')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 429) {
    throw new GeminiError('GEMINI_RATE_LIMIT', 'Límite de solicitudes alcanzado (429).')
  }

  if (!response.ok) {
    throw new GeminiError('GEMINI_UNAVAILABLE', `Gemini respondió con error HTTP ${response.status}.`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new GeminiError('GEMINI_UNAVAILABLE', 'Respuesta de Gemini no es JSON válido.')
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new GeminiError('GEMINI_UNAVAILABLE', 'Gemini no devolvió contenido utilizable.')
  }

  return text
}

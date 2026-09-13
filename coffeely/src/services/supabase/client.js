/**
 * client.js — Inicialización del cliente Supabase.
 *
 * Lee las credenciales desde las variables de entorno de Vite:
 *   VITE_SUPABASE_URL      — URL del proyecto  (ej. https://xxxx.supabase.co)
 *   VITE_SUPABASE_ANON_KEY — Clave anon pública (safe para el browser)
 *
 * Tablas disponibles en el proyecto:
 *   - perfiles
 *   - negocios               (columnas camelCase: "nombreCafeteria", "horarioNegocio", etc.)
 *   - registros_diarios      (columnas camelCase: "ingresosTotales", "capitalDisponible", etc.)
 *   - estados_mensuales      (columnas camelCase: "ingresosTotales", "utilidadNeta", etc.)
 *   - conversaciones_chatbot
 *
 * Uso:
 *   import { supabase } from '../services/supabase/client'
 *   const { data, error } = await supabase.from('negocios').select('*')
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas en .env.\n' +
    'El cliente se inicializará pero todas las llamadas a la BD fallarán hasta que ' +
    'agregues las credenciales reales.'
  )
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseKey  ?? 'placeholder-key'
)

/**
 * negociosService.js
 * Capa de acceso a datos para las tablas:
 *   negocios, registros_diarios, estados_mensuales
 *
 * Convención: el código usa camelCase; Supabase usa snake_case.
 * Este archivo hace el mapeo en ambas direcciones.
 */
import { supabase } from './client'

/* ─────────────────────────────────────────────────
   NEGOCIOS
───────────────────────────────────────────────── */

/**
 * Obtiene el negocio activo del usuario autenticado.
 * Retorna el primer negocio encontrado o null.
 */
export async function getNegocio(usuarioId) {
  const { data, error } = await supabase
    .from('negocios')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('fecha_creacion', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? dbToNegocio(data) : null
}

/**
 * Inserta un nuevo negocio.
 * Retorna el negocio creado (con su id).
 */
export async function insertNegocio({ usuarioId, nombreCafeteria, horarioNegocio, tieneHistorialFinanciero }) {
  const { data, error } = await supabase
    .from('negocios')
    .insert({
      usuario_id:        usuarioId,
      nombre_negocio:    nombreCafeteria,
      horario_semana:    horarioNegocio,
      tiene_historial:   tieneHistorialFinanciero,
      tipo_formulario:   tieneHistorialFinanciero ? 'mensual' : 'diario',
    })
    .select()
    .single()

  if (error) throw error
  return dbToNegocio(data)
}

/** Mapeo DB → camelCase */
function dbToNegocio(row) {
  return {
    id:                         row.id,
    usuarioId:                  row.usuario_id,
    nombreCafeteria:            row.nombre_negocio,
    horarioNegocio:             row.horario_semana ?? {},
    tieneHistorialFinanciero:   row.tiene_historial,
    tipoFormulario:             row.tipo_formulario,
    fechaCreacion:              row.fecha_creacion,
    fechaRegistroNegocio:       row.fecha_creacion, // alias para compatibilidad con el contexto
    registroNegocioCompletado:  true,
  }
}

/* ─────────────────────────────────────────────────
   REGISTROS DIARIOS
───────────────────────────────────────────────── */

/**
 * Trae todos los registros diarios del negocio.
 */
export async function getRegistrosDiarios(negocioId) {
  const { data, error } = await supabase
    .from('registros_diarios')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('fecha', { ascending: true })

  if (error) throw error
  return (data ?? []).map(dbToRegistroDiario)
}

/**
 * Upsert de un registro diario (UNIQUE negocio_id + fecha).
 * Si ya existe el registro de ese día lo sobreescribe.
 */
export async function upsertRegistroDiario(negocioId, registro) {
  const { data, error } = await supabase
    .from('registros_diarios')
    .upsert(
      {
        negocio_id:         negocioId,
        fecha:              registro.fecha,
        ingresos_totales:   registro.ingresosTotales,
        capital_disponible: registro.capitalDisponible,
        gastos_fijos:       registro.gastosFijos,
        gastos_variables:   registro.gastosVariables,
        meta_ahorro:        registro.metaAhorro,
        numero_ventas:      registro.numeroVentas ?? null,
      },
      { onConflict: 'negocio_id,fecha' }
    )
    .select()
    .single()

  if (error) throw error
  return dbToRegistroDiario(data)
}

/** Mapeo DB → camelCase */
function dbToRegistroDiario(row) {
  return {
    id:                row.id,
    negocioId:         row.negocio_id,
    fecha:             row.fecha,
    ingresosTotales:   Number(row.ingresos_totales),
    capitalDisponible: Number(row.capital_disponible),
    gastosFijos:       Number(row.gastos_fijos),
    gastosVariables:   Number(row.gastos_variables),
    metaAhorro:        Number(row.meta_ahorro),
    numeroVentas:      row.numero_ventas,
    fechaCaptura:      row.fecha_captura,
  }
}

/* ─────────────────────────────────────────────────
   ESTADOS MENSUALES
───────────────────────────────────────────────── */

/**
 * Trae todos los estados mensuales del negocio.
 */
export async function getEstadosMensuales(negocioId) {
  const { data, error } = await supabase
    .from('estados_mensuales')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('mes', { ascending: true })

  if (error) throw error
  return (data ?? []).map(dbToEstadoMensual)
}

/**
 * Upsert de un estado mensual (UNIQUE negocio_id + mes).
 */
export async function upsertEstadoMensual(negocioId, registro) {
  const { data, error } = await supabase
    .from('estados_mensuales')
    .upsert(
      {
        negocio_id:                 negocioId,
        mes:                        registro.mes,
        ingresos_totales:           registro.ingresosTotales,
        gastos_fijos:               registro.gastosFijos,
        gastos_variables:           registro.gastosVariables,
        utilidad_neta:              registro.utilidadNeta,
        capital_disponible_cierre:  registro.capitalDisponibleCierre,
      },
      { onConflict: 'negocio_id,mes' }
    )
    .select()
    .single()

  if (error) throw error
  return dbToEstadoMensual(data)
}

/** Mapeo DB → camelCase */
function dbToEstadoMensual(row) {
  return {
    id:                      row.id,
    negocioId:               row.negocio_id,
    mes:                     row.mes,
    ingresosTotales:         Number(row.ingresos_totales),
    gastosFijos:             Number(row.gastos_fijos),
    gastosVariables:         Number(row.gastos_variables),
    utilidadNeta:            Number(row.utilidad_neta),
    capitalDisponibleCierre: Number(row.capital_disponible_cierre),
    fechaCaptura:            row.fecha_captura,
  }
}

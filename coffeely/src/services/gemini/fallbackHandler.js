/**
 * fallbackHandler.js — Simulador Inteligente
 * Funciona 100% sin API externa. Aplica reglas de umbral financiero
 * para dar análisis de riesgo y respuestas de chat contextuales.
 */

/* ══════════════════════════════════════════════
   ANÁLISIS DE RIESGO
══════════════════════════════════════════════ */

/**
 * getFallbackRiskAnalysis({ balance, ingresosProyectados, gastosEstimados })
 * Devuelve { nivel, justificacion, recomendaciones }
 */
export function getFallbackRiskAnalysis({ balance = 0, ingresosProyectados = 0, gastosEstimados = 0 }) {
  const ingresos = Number(ingresosProyectados) || 0
  const gastos   = Number(gastosEstimados)     || 0
  const bal      = Number(balance)             || 0

  /* Relación gastos/ingresos */
  const ratio        = ingresos > 0 ? gastos / ingresos : (gastos > 0 ? 2 : 0)
  const margen       = ingresos > 0 ? (ingresos - gastos) / ingresos : 0
  const mesesLiquidez = gastos > 0 ? (bal / (gastos / 30)) : 99

  let nivel, justificacion, recomendaciones

  /* ── ROJO: gastos > 90% de ingresos ── */
  if (ratio >= 0.9 || mesesLiquidez < 0.5) {
    nivel = 'rojo'
    justificacion =
      `Tus gastos representan el ${Math.round(ratio * 100)}% de tus ingresos proyectados, ` +
      `lo que deja un margen de solo ${Math.round(margen * 100)}%. ` +
      `Con el capital disponible actual, tu negocio tiene menos de ${Math.round(mesesLiquidez * 30)} días ` +
      `de operación asegurada sin nuevos ingresos. Es momento de actuar de inmediato para evitar una crisis de liquidez.`
    recomendaciones = [
      'Revisa tus gastos variables esta semana y elimina o pospón los no esenciales (insumos de reposición no urgente, suscripciones).',
      'Activa estrategias de ingreso rápido: promociones de fin de semana, combos con productos de alto margen o prepagos de clientes frecuentes.',
    ]

  /* ── AMARILLO: gastos entre 70% y 90% de ingresos ── */
  } else if (ratio >= 0.7 || mesesLiquidez < 1.5) {
    nivel = 'amarillo'
    justificacion =
      `Tus gastos son el ${Math.round(ratio * 100)}% de tus ingresos proyectados, ` +
      `generando un margen del ${Math.round(margen * 100)}%. ` +
      `Tu capital actual cubre aproximadamente ${Math.round(mesesLiquidez * 30)} días de operación, ` +
      `lo cual es funcional pero no deja mucho colchón ante imprevistos.`
    recomendaciones = [
      `Busca reducir al menos un 10% en gastos variables el próximo mes para llevar tu margen por encima del 30%.`,
      `Construye un fondo de emergencia equivalente a 2 semanas de gastos fijos — deposita una cantidad fija cada semana hasta alcanzarlo.`,
    ]

  /* ── VERDE ── */
  } else {
    nivel = 'verde'
    justificacion =
      `Tus finanzas muestran un margen saludable del ${Math.round(margen * 100)}% ` +
      `(gastos al ${Math.round(ratio * 100)}% de los ingresos). ` +
      `Con tu capital actual tienes aproximadamente ${Math.round(mesesLiquidez)} meses de operación asegurada, ` +
      `lo que indica una posición financiera sólida para tu cafetería.`
    recomendaciones = [
      'Mantén una reserva mínima de 2 meses de gastos fijos como colchón ante estacionalidad o imprevistos.',
      'Considera reinvertir el excedente en mejoras de alta rotación: equipo de preparación más eficiente o ampliar el menú de mayor margen.',
    ]
  }

  return { nivel, justificacion, recomendaciones }
}

/* ══════════════════════════════════════════════
   CHAT DE SOPORTE
══════════════════════════════════════════════ */

const KEYWORDS_FINANCIERAS = [
  'liquidez', 'flujo', 'caja', 'gasto', 'ahorro', 'deuda', 'venta',
  'margen', 'riesgo', 'ingreso', 'capital', 'utilidad', 'ganancia',
  'pérdida', 'presupuesto', 'costo', 'finanza', 'dinero', 'balance',
  'inversión', 'crédito', 'cobro', 'pago', 'precio', 'proveedor',
]

/**
 * getFallbackChatResponse(userMessage, context)
 * context: { nombreCafeteria, ventasPromedioDiarias, capitalDisponible,
 *             ingresosUltimoMes, gastosUltimoMes, nivel }
 */
export function getFallbackChatResponse(userMessage = '', context = {}) {
  const msg        = userMessage.toLowerCase()
  const hasKeyword = KEYWORDS_FINANCIERAS.some(k => msg.includes(k))

  const nombre  = context.nombreCafeteria || 'tu cafetería'
  const capital = context.capitalDisponible != null
    ? `$${Number(context.capitalDisponible).toLocaleString('es-MX')}`
    : null

  /* ── Sin palabras clave financieras ── */
  if (!hasKeyword) {
    return `Soy el asistente financiero de ${nombre} y puedo ayudarte con temas como ` +
      `flujo de caja, control de gastos, márgenes de ganancia, liquidez y planificación financiera. ` +
      `¿Hay algún aspecto financiero de tu negocio en el que quieras profundizar?`
  }

  /* ── Respuestas contextuales según palabra clave ── */
  if (msg.includes('liquidez') || msg.includes('caja') || msg.includes('flujo')) {
    const base = capital
      ? `${nombre} tiene actualmente ${capital} de capital disponible.`
      : `No encontré tu capital disponible registrado — asegúrate de actualizar el registro diario.`
    return `${base} La liquidez saludable para una cafetería es contar con al menos 6 semanas de gastos fijos en reserva. ` +
      `Si quieres mejorarla, el primer paso es separar físicamente esa reserva en una cuenta o caja diferente para no mezclarla con el flujo operativo.`
  }

  if (msg.includes('gasto') || msg.includes('costo')) {
    const gastos = context.gastosUltimoMes
      ? `El último mes registrado fue de $${Number(context.gastosUltimoMes).toLocaleString('es-MX')} en gastos.`
      : ''
    return `${gastos} En cafeterías, los gastos se dividen en fijos (renta, sueldos, servicios) y variables (insumos, materia prima). ` +
      `Para reducir costos sin afectar la calidad, empieza por los variables: negocia volumen con proveedores o consolida pedidos semanales en lugar de diarios.`
  }

  if (msg.includes('venta') || msg.includes('ingreso')) {
    const ing = context.ingresosUltimoMes
      ? `Tu último mes registrado fue de $${Number(context.ingresosUltimoMes).toLocaleString('es-MX')} en ingresos.`
      : ''
    return `${ing} Para aumentar ventas en cafeterías, las estrategias de mayor impacto inmediato son: ` +
      `combos de horario pico (ej. café + pan a precio especial en las mañanas), ` +
      `programa de lealtad simple (la 10ª bebida gratis) y presencia activa en Google Maps con fotos actualizadas.`
  }

  if (msg.includes('margen') || msg.includes('ganancia') || msg.includes('utilidad')) {
    const ing  = Number(context.ingresosUltimoMes)  || 0
    const gast = Number(context.gastosUltimoMes)    || 0
    const margenPct = ing > 0 ? Math.round(((ing - gast) / ing) * 100) : null
    const margenStr = margenPct !== null
      ? `Con tus datos actuales, tu margen es del ${margenPct}%.`
      : ''
    return `${margenStr} El margen saludable para una cafetería oscila entre 25% y 40%. ` +
      `Si estás por debajo, el producto con mayor impacto en margen es el café de especialidad: ` +
      `tiene costo de insumo bajo y precio percibido alto por el cliente.`
  }

  if (msg.includes('ahorro') || msg.includes('reserva')) {
    return `La regla práctica para ${nombre}: separa el 10% de tus ingresos semanales en una cuenta de reserva ` +
      `antes de pagar cualquier gasto. Cuando llegues a 2 meses de gastos fijos, ese fondo es tu colchón de emergencia. ` +
      `A partir de ahí puedes empezar a ahorrar para reinversión o equipamiento.`
  }

  if (msg.includes('deuda') || msg.includes('crédito')) {
    return `Para ${nombre}, la deuda es manejable si el pago mensual no supera el 20% de tus ingresos promedio. ` +
      `Antes de adquirir nuevo crédito, asegúrate de que el uso del dinero genere retorno en menos de 12 meses ` +
      `(ej. una máquina que reduce tiempo de preparación y permite atender más clientes).`
  }

  if (msg.includes('riesgo')) {
    const nivel = context.nivel
    const desc  = nivel === 'rojo'
      ? 'en zona de riesgo alto — requiere atención inmediata.'
      : nivel === 'amarillo'
        ? 'en zona de precaución — hay margen de mejora.'
        : 'en zona saludable — sigue así.'
    return `Según los últimos datos registrados, ${nombre} está ${desc} ` +
      `El semáforo de riesgo considera tu margen de ganancia, la relación gastos/ingresos y tu capital de reserva. ` +
      `¿Quieres que analice alguno de estos factores con más detalle?`
  }

  if (msg.includes('presupuesto') || msg.includes('planifica')) {
    return `Un presupuesto mensual simple para ${nombre} tiene 3 categorías: ` +
      `1) Gastos fijos ineludibles (renta, sueldos, servicios). ` +
      `2) Gastos variables controlables (insumos, materia prima) — ponles un tope máximo. ` +
      `3) Meta de ahorro/reinversión. Todo lo que sobre es tu utilidad real. ¿Quieres que te ayude a estructurar alguna de estas categorías?`
  }

  /* Genérico financiero */
  return `Buena pregunta sobre las finanzas de ${nombre}. ` +
    `Con los datos que has registrado puedo ayudarte a analizar tu flujo de caja, márgenes y nivel de riesgo. ` +
    `¿Quieres que revisemos algún período específico o alguna métrica en particular?`
}

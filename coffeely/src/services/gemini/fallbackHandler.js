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

/*
 * Mapa de sinónimos → tema canónico.
 * Cualquier término del array activa la rama correspondiente.
 * Se normaliza quitando acentos antes de comparar.
 */
const SINONIMOS = {
  gastos: [
    'gasto', 'egreso', 'erogacion', 'costo', 'costos', 'cargos', 'cargo',
    'desembolso', 'salida', 'salidas', 'egresos', 'gasto operativo',
    'gasto fijo', 'gasto variable', 'pago fijo', 'pagos fijos',
  ],
  ingresos: [
    'ingreso', 'ingresos', 'venta', 'ventas', 'recaudacion', 'facturacion',
    'cobro', 'cobros', 'entradas', 'entrada de dinero', 'revenue',
  ],
  liquidez: [
    'liquidez', 'flujo', 'caja', 'flujo de caja', 'efectivo', 'cash flow',
    'capital de trabajo', 'solvencia',
  ],
  margen: [
    'margen', 'ganancia', 'ganancias', 'utilidad', 'utilidades', 'beneficio',
    'beneficios', 'rentabilidad', 'rendimiento',
  ],
  ahorro: [
    'ahorro', 'ahorros', 'reserva', 'fondo', 'fondo de emergencia',
    'guardar', 'apartar', 'colchon',
  ],
  deuda: [
    'deuda', 'deudas', 'credito', 'creditos', 'prestamo', 'prestamos',
    'financiamiento', 'endeudamiento', 'pago de deuda',
  ],
  riesgo: [
    'riesgo', 'semaforo', 'alerta', 'peligro', 'estado financiero',
    'salud financiera', 'nivel de riesgo',
  ],
  presupuesto: [
    'presupuesto', 'planificacion', 'planifica', 'plan financiero',
    'proyeccion', 'proyectar', 'pronostico',
  ],
  ayuda: [
    'ayuda', 'opciones', 'que puedes hacer', 'que puedes', 'como funciona',
    'para que sirve', 'que haces', 'que puedo preguntar', 'que me puedes decir',
    'menu', 'comandos', 'funciones', 'que sabes', 'capacidades',
  ],
  general: [
    'finanza', 'finanzas', 'dinero', 'balance', 'inversion', 'inversiones',
    'proveedor', 'proveedores', 'precio', 'precios', 'capital', 'perdida',
    'perdidas',
  ],
}

/* Quita acentos y normaliza a minúsculas */
function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/* Detecta el tema principal del mensaje */
function detectarTema(msg) {
  const norm = normalizar(msg)
  for (const [tema, terminos] of Object.entries(SINONIMOS)) {
    if (terminos.some(t => norm.includes(normalizar(t)))) return tema
  }
  return null
}

/**
 * getFallbackChatResponse(userMessage, context)
 * context: { nombreCafeteria, ventasPromedioDiarias, capitalDisponible,
 *             ingresosUltimoMes, gastosUltimoMes, nivel }
 */
export function getFallbackChatResponse(userMessage = '', context = {}) {
  const tema   = detectarTema(userMessage)
  const nombre = context.nombreCafeteria || 'tu cafetería'
  const capital = context.capitalDisponible != null
    ? `$${Number(context.capitalDisponible).toLocaleString('es-MX')}`
    : null

  /* ── Sin tema reconocido → redirección amable ── */
  if (!tema) {
    return `Soy el asistente financiero de ${nombre} y puedo ayudarte con temas como ` +
      `flujo de caja, control de gastos y egresos, márgenes de ganancia, liquidez y planificación financiera. ` +
      `¿Hay algún aspecto financiero de tu negocio en el que quieras profundizar?`
  }

  /* ── Ayuda / opciones / ¿qué puedes hacer? ── */
  if (tema === 'ayuda') {
    return `Puedo ayudarte con estos temas sobre ${nombre}:\n` +
      `• Flujo de caja y liquidez\n` +
      `• Análisis de gastos, egresos y costos\n` +
      `• Ingresos y ventas\n` +
      `• Márgenes de ganancia y rentabilidad\n` +
      `• Estrategias de ahorro y reservas\n` +
      `• Deudas y créditos\n` +
      `• Presupuesto y proyecciones\n` +
      `• Interpretación del semáforo de riesgo\n\n` +
      `¿Sobre cuál quieres empezar?`
  }

  /* ── Liquidez / flujo de caja ── */
  if (tema === 'liquidez') {
    const base = capital
      ? `${nombre} tiene actualmente ${capital} de capital disponible.`
      : `No encontré tu capital disponible registrado — asegúrate de actualizar el registro diario.`
    return `${base} La liquidez saludable para una cafetería es contar con al menos 6 semanas de gastos fijos en reserva. ` +
      `Si quieres mejorarla, el primer paso es separar físicamente esa reserva en una cuenta o caja diferente para no mezclarla con el flujo operativo.`
  }

  /* ── Gastos / egresos / costos ── */
  if (tema === 'gastos') {
    const gastos = context.gastosUltimoMes
      ? `El último período registrado muestra $${Number(context.gastosUltimoMes).toLocaleString('es-MX')} en egresos.`
      : ''
    return `${gastos} Los egresos de una cafetería se dividen en fijos (renta, sueldos, servicios — no cambian con las ventas) ` +
      `y variables (insumos, materia prima — suben o bajan según tu volumen). ` +
      `Para reducirlos sin afectar la calidad, empieza por los variables: negocia volumen con proveedores ` +
      `o consolida pedidos semanales en lugar de diarios.`
  }

  /* ── Ingresos / ventas ── */
  if (tema === 'ingresos') {
    const ing = context.ingresosUltimoMes
      ? `Tu último período registrado fue de $${Number(context.ingresosUltimoMes).toLocaleString('es-MX')} en ingresos.`
      : ''
    return `${ing} Para aumentar ingresos en cafeterías, las estrategias de mayor impacto inmediato son: ` +
      `combos de horario pico (café + pan a precio especial en las mañanas), ` +
      `programa de lealtad simple (la décima bebida gratis) y presencia activa en Google Maps con fotos actualizadas.`
  }

  /* ── Margen / ganancia / utilidad ── */
  if (tema === 'margen') {
    const ing  = Number(context.ingresosUltimoMes)  || 0
    const gast = Number(context.gastosUltimoMes)    || 0
    const margenPct = ing > 0 ? Math.round(((ing - gast) / ing) * 100) : null
    const margenStr = margenPct !== null
      ? `Con tus datos actuales, tu margen de ganancia es del ${margenPct}%.`
      : ''
    return `${margenStr} El margen saludable para una cafetería oscila entre 25% y 40%. ` +
      `Si estás por debajo, el producto con mayor impacto en margen es el café de especialidad: ` +
      `tiene costo de insumo bajo y precio percibido alto por el cliente.`
  }

  /* ── Ahorro / reserva ── */
  if (tema === 'ahorro') {
    return `La regla práctica para ${nombre}: separa el 10% de tus ingresos semanales en una cuenta de reserva ` +
      `antes de pagar cualquier egreso. Cuando llegues a 2 meses de gastos fijos, ese fondo es tu colchón de emergencia. ` +
      `A partir de ahí puedes empezar a ahorrar para reinversión o equipamiento.`
  }

  /* ── Deuda / crédito ── */
  if (tema === 'deuda') {
    return `Para ${nombre}, la deuda es manejable si el pago mensual no supera el 20% de tus ingresos promedio. ` +
      `Antes de adquirir nuevo crédito, asegúrate de que el dinero genere retorno en menos de 12 meses ` +
      `(por ejemplo, una máquina que reduce tiempo de preparación y permite atender más clientes).`
  }

  /* ── Riesgo / semáforo ── */
  if (tema === 'riesgo') {
    const nivel = context.nivel
    const desc  = nivel === 'rojo'
      ? 'en zona de riesgo alto — requiere atención inmediata.'
      : nivel === 'amarillo'
        ? 'en zona de precaución — hay margen de mejora.'
        : 'en zona saludable — sigue así.'
    return `Según los últimos datos registrados, ${nombre} está ${desc} ` +
      `El semáforo considera tu margen de ganancia, la relación egresos/ingresos y tu capital de reserva. ` +
      `¿Quieres que analice alguno de estos factores con más detalle?`
  }

  /* ── Presupuesto / planificación ── */
  if (tema === 'presupuesto') {
    return `Un presupuesto mensual simple para ${nombre} tiene 3 categorías: ` +
      `1) Egresos fijos ineludibles (renta, sueldos, servicios). ` +
      `2) Egresos variables controlables (insumos, materia prima) — ponles un tope máximo. ` +
      `3) Meta de ahorro o reinversión. Todo lo que sobre es tu utilidad real. ` +
      `¿Quieres que te ayude a estructurar alguna de estas categorías?`
  }

  /* ── General financiero ── */
  return `Buena pregunta sobre las finanzas de ${nombre}. ` +
    `Con los datos que has registrado puedo ayudarte a analizar tu flujo de caja, márgenes y nivel de riesgo. ` +
    `¿Quieres que revisemos algún período específico o alguna métrica en particular?`
}

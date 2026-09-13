# Capital Coffee

Capital Coffee es una plataforma de inteligencia financiera diseñada para dueños de cafeterías independientes. Resuelve un problema concreto: la mayoría de estos negocios operan sin visibilidad real de su flujo de caja, lo que convierte cada semana en una apuesta sobre si habrá efectivo para nómina, renta y proveedores.

La app convierte los registros diarios de ingresos y gastos en una proyección de liquidez a 30 días, un semáforo de riesgo operativo con explicación en lenguaje sencillo, y un chatbot financiero — todo sin requerir conocimientos contables. El usuario solo necesita ingresar sus números del día; Capital Coffee hace el resto.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 4 |
| Estilos | Tailwind CSS 3 |
| Backend / Auth / DB | Supabase (Auth + PostgreSQL) |
| IA | Gemini API (`gemini-1.5-flash`) con fallback local |
| Gráficas | Recharts 2 |
| Íconos | lucide-react |
| Internacionalización | i18next + react-i18next (ES / EN) |
| Deploy | Vercel |

---

## Arquitectura del proyecto

```
src/
├── components/   # Componentes reutilizables organizados por dominio:
│                 #   dashboard/ (gráfica, semáforo, chatbot, métricas)
│                 #   landing/   (hero, header, footer, SystemBar)
│                 #   layout/    (Navbar post-login)
│                 #   ui/        (FormField, Spinner)
├── pages/        # Una página por ruta. Cada archivo es autónomo y contiene
│                 # su lógica de formulario, validación y llamadas a Supabase.
├── context/      # CoffeeShopContext: fuente de verdad global. Carga el negocio
│                 # y sus registros desde Supabase al iniciar sesión y los expone
│                 # a toda la app. Usa localStorage como caché de última sesión.
├── contexts/     # Contextos ligeros de preferencias: idioma y moneda.
├── hooks/        # Lógica de negocio extraída en hooks reutilizables:
│                 # useAuth, useDashboardData, usePendingEntries, useEntryFrequency.
├── services/     # supabase/: cliente y capa de acceso a datos (negociosService.js)
│                 # con el mapeo snake_case ↔ camelCase en un solo lugar.
├── utils/        # Funciones puras: financialCalculations.js genera el dataset
│                 # de la proyección a 30 días; fallbackHandler.js contiene el
│                 # simulador de IA local.
└── locales/      # Traducciones JSON para ES y EN.
```

---

## Flujo de usuario

El flujo es idéntico independientemente de si el usuario se registra con email/contraseña o con Google OAuth — Supabase maneja ambos y la app los trata de la misma forma.

1. **Landing** — Presentación del producto con preview de métricas y módulos.
2. **Registro / Login** — Cuenta con email+contraseña o Google OAuth. Supabase envía confirmación de email si está habilitada en el proyecto.
3. **Registro de negocio** — Un solo formulario: nombre de la cafetería y horario por día de la semana. Al confirmar, se crea el registro en la tabla `negocios` con `tiene_historial = false` y `tipo_formulario = 'diario'`.
4. **Captura diaria** — El usuario registra ingresos, gastos fijos, gastos variables, capital disponible y meta de ahorro del día. Se guarda en `registros_diarios`.
5. **Dashboard** — Visualización en tiempo real: 4 métricas de proyección, gráfica de flujo de caja a 30 días, semáforo de riesgo financiero y chatbot asistente. El acceso a cargar historial de meses previos está disponible de forma opcional desde el botón "Cargar historial".

---

## Base de datos (Supabase / PostgreSQL)

Todas las tablas tienen **Row Level Security (RLS) activado** — cada usuario solo puede leer y escribir sus propios datos.

| Tabla | Contenido |
|---|---|
| `perfiles` | Datos del usuario (nombre, email). Se llena automáticamente vía trigger al crear la cuenta en Auth. |
| `negocios` | Un registro por negocio: nombre, horario semanal, tipo de formulario y fecha de creación. |
| `registros_diarios` | Snapshot financiero diario: ingresos, gastos fijos, gastos variables, capital disponible y meta de ahorro. UNIQUE por `(negocio_id, fecha)`. |
| `estados_mensuales` | Resumen mensual para negocios con historial previo: ingresos, gastos y capital de cierre. UNIQUE por `(negocio_id, mes)`. |
| `conversaciones_chatbot` | Historial de mensajes del asistente financiero por sesión. |

---

## Estrategia de resiliencia de IA

El semáforo de riesgo y el chatbot usan **Gemini API** (`gemini-1.5-flash`) cuando está disponible. Si la llamada a la API falla por cualquier motivo — clave no configurada, límite de cuota, error de red, o timeout — el sistema cae automáticamente al **Simulador Inteligente local** implementado en `src/utils/fallbackHandler.js`. Este simulador aplica las mismas reglas de diagnóstico financiero de forma determinista, sin dependencia de red. El resultado: la app **nunca se rompe ni muestra pantallas en blanco** por fallos de la IA externa. El usuario recibe un análisis útil en cualquier condición, lo que hace la plataforma viable en entornos con conectividad limitada.

---

## Instalación local

**Requisitos:** Node.js 18 o superior.

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus claves reales (ver sección siguiente)

# 3. Iniciar servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Variables de entorno

```env
VITE_GEMINI_API_KEY=        # Google AI Studio → aistudio.google.com/app/apikey
VITE_GOOGLE_CLIENT_ID=      # Google Cloud Console → APIs → Credenciales → OAuth 2.0
VITE_SUPABASE_URL=          # Supabase dashboard → Settings → API → Project URL
VITE_SUPABASE_ANON_KEY=     # Supabase dashboard → Settings → API → anon public key
```

> Las variables con prefijo `VITE_` son expuestas al cliente por Vite. No incluyas claves con permisos elevados (`service_role`) en el frontend.

---

## Deploy

El proyecto está desplegado en **Vercel**. La configuración tiene `Root Directory` apuntando a `coffeely/` dentro del repositorio. Cualquier push a la rama `main` redeploya automáticamente sin configuración adicional.

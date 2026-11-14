# MASTER PROMPT PARA CODEX — CODER C (EKAITZ LAZKANO)

> **Proyecto:** Earth Case Files — NASA Space Apps Challenge 2026, equipo WOMM  
> **Reto:** *Be An Earth System Trend Detective!*  
> **Rol que debes asumir:** `coder-c` — Ekaitz Lazkano  
> **Objetivo de esta instrucción:** implementar **de verdad, de extremo a extremo y con pruebas**, todo el ámbito de trabajo de Coder C, integrándolo con los contratos del repositorio sin pisar el trabajo de los demás.  
> **Idioma de comunicación conmigo:** español. **Idioma de la interfaz y del código:** el que establezcan el repositorio, `docs/pitch/COPY.md` y las convenciones existentes; no traduzcas arbitrariamente términos de producto.

---

## 0. Orden de ejecución: este es un encargo de implementación, no una consulta

Actúa como un **ingeniero senior full-stack, frontend, data visualization y AI integration**, especializado en Next.js, TypeScript, visualización científica, streaming SSE, accesibilidad y pruebas automatizadas.

**Quiero que escribas el código y completes mi parte**, no que te limites a proponer una arquitectura, resumir documentos, darme consejos, generar pseudocódigo o crear un plan nuevo que sustituya al del equipo.

Tu misión es ejecutar, en orden y respetando las dependencias, las **Tasks 1–9 del plan oficial de Coder C** que ya existe en el repositorio. Si hay tareas parcialmente implementadas, reutiliza y termina lo existente; no rehagas código funcional solo por estilo. Si una dependencia no está lista, construye componentes desacoplados y comprobables sobre los *stubs/fixtures oficiales*, indica el bloqueo y continúa con lo que sí puedas hacer.

No te detengas tras la primera tarea si hay margen para avanzar: continúa autónomamente por el trabajo de Coder C hasta completar lo que permitan el tiempo, el estado real del repositorio, los permisos y el *feature freeze*. **Prioriza software operativo y probado antes que funcionalidades espectaculares pero incompletas.** No afirmes que algo funciona si no lo has ejecutado o comprobado.

Las instrucciones de este archivo son un encargo de usuario. **Las reglas vigentes de `AGENTS.md`, los protocolos de proceso, el ownership, los contratos reales y los planes oficiales del repositorio prevalecen si detectas alguna discrepancia.** Este prompt no autoriza a saltártelos.

---

## 1. Primero inspecciona el repositorio y reanuda tu rol

Trabaja desde la **raíz del repositorio real**, no desde una carpeta nueva o un proyecto de ejemplo. Antes de editar un solo archivo:

1. Ejecuta el procedimiento equivalente a **`resume coder-c`** descrito en `docs/process/resume.md`. Si `resume` no es un comando ejecutable de la shell, **interpreta la frase como instrucción para seguir manualmente ese documento**; no crees un comando ficticio.
2. Lee **primero** `docs/STATUS.md`: fecha/hora de actualización, H actual, milestones, bloqueos y si ya se ha alcanzado H26. Revisa también los handoffs recientes del equipo.
3. Lee `AGENTS.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/TEAM.md`, `docs/roles/coder-c.md` y, **completo y sin omitir tareas**, `docs/superpowers/plans/2026-11-14-partner-panel.md`.
4. Lee `docs/process/OWNERSHIP.md`, `docs/process/MERGING.md`, `docs/process/handoff.md`, y cualquier otro archivo al que remitan. Comprueba los permisos **por ruta exacta**.
5. Antes de redactar un veredicto o un texto estadístico, inspecciona `docs/science/METHODS.md` y `docs/science/VERDICT_TEMPLATES.md`; **Sergio es la autoridad científica**. Para textos visibles, inspecciona `docs/pitch/COPY.md` y `docs/pitch/DEMO_SCRIPT.md`; **Edur es responsable del contenido y del tono**. Para explicaciones físicas, `docs/science/PROCESS_CARDS.md`.
6. Inspecciona los contratos **existentes y actuales**, no los que recuerdes: `api/_models.py`, `api/openapi.json`, `lib/api-types.ts`, `lib/api/types.ts`, `lib/api/client.ts`, `lib/state/`, `app/page.tsx`, `app/tokens.css`, `package.json` y los componentes que el equipo ya haya creado. Es lectura, **no permiso de edición**.
7. Revisa `git status`, rama actual, remotos, cambios ajenos sin guardar, commits recientes y presencia del *scaffold* de Eleder. **Nunca sobrescribas cambios ajenos**.
8. Localiza los casos de demostración finales en `docs/science/DEMO_CASES.md`, el catálogo `docs/DATA_CATALOG.md`, las pruebas/evaluaciones disponibles y los *fixtures* oficiales.

**ATENCIÓN: algunos archivos anteriores están referenciados en los documentos del proyecto pero no estaban entre los `.md` facilitados al crear este prompt.** No presupongas que su contenido es conocido: debes leer su versión real en el repositorio. Si faltan, informa de la ausencia y usa únicamente información respaldada por los documentos disponibles y el contrato ya creado, sin inventar decisiones estadísticas ni APIs.

Después de la inspección, comunica brevemente:

- Qué parte de Coder C está hecha, pendiente o bloqueada.
- Qué dependencias de Eleder, Oier, Sergio y Edur están realmente disponibles.
- En qué task oficial vas a empezar y qué entregable funcional vas a producir.
- Si el repositorio está en *feature freeze*, actúa conforme a la norma: **después de H26, solo correcciones P0**.

**No pidas mi confirmación para tareas normales que ya estén autorizadas en mi área; empieza a implementarlas.** Sí debes detener cualquier modificación que viole ownership, altere una interfaz congelada o necesite una decisión del responsable de esa zona.

---

## 2. Contexto del producto: qué estamos construyendo y para quién

El desafío de NASA consiste en facilitar que el público investigue tendencias en variables terrestres observadas por satélites o modelos científicos, contestando cinco preguntas: **qué variable**, **dónde**, **cuándo**, **cómo cambia** y **si el cambio es estadísticamente significativo**.

**Earth Case Files** es una aplicación web guiada con estética de investigación científica, pero comprensible para estudiantes de secundaria y universidad y personas curiosas con cierto interés por la ciencia. El usuario utiliza un **globo terráqueo 3D**, escoge una variable, una o varias regiones, un intervalo temporal y una estación, inspecciona series temporales y recibe un veredicto científico. Un *Claude partner* ayuda a interpretar la evidencia sin inventar números ni causas físicas.

La dirección de producto aprobada es **híbrida A+B+C**:

1. **Case Files:** recorrido de cinco pasos `Lead → Scene → Timeline → Evidence → Verdict`.
2. **Mirror Earth:** mapa global de tendencias y búsqueda de regiones con tendencia significativa opuesta para la misma variable y periodo.
3. **Signal Scanner:** indicador estimado de *years until significant*; el escaneo de todas las variables de una región es una mejora de menor prioridad.

El lenguaje de producto es vinculante:

| Término | Significado |
|---|---|
| `Case` | Investigación definida por variable + regiones + periodo + estación + nivel de lectura; estado compartible en la URL. |
| `Lead` | Variable ambiental. |
| `Scene` | Región o regiones. |
| `Timeline` | Periodo y estación. |
| `Evidence` | Series, gráficas y estadísticas calculadas. |
| `Verdict` | `Confirmed`, `Not proven yet` o `No case`, conforme a `METHODS.md`. |
| `Yearly series` | Una observación anual o estacional por año, base de los contrastes de tendencia. |
| `Anomaly` | Valor mensual menos la media del mismo mes del año en el periodo; usada para visualización/correlación. |
| `Mirror` | Región del mismo tipo con tendencia estadísticamente significativa y signo opuesto bajo los mismos filtros. |
| `Process card` | Explicación física curada y con citas; única base permitida para afirmaciones causales del asistente. |
| `Explain` | Explicación automática del caso actual. |
| `Partner` | Conversación con herramientas para explorar nuevos casos. |

**Caso de demostración fundamental:** humo y aerosoles (AOD) sobre Wisconsin en verano, con MODIS Aqua y serie desde 2002, el ejemplo propuesto por NASA. **No presupongas el resultado numérico ni que la tendencia sea significativa:** el dato y veredicto deben proceder del motor real y de los casos validados por Sergio. Los otros dos casos salen de `DEMO_CASES.md`, no los inventes.

Los datos provienen principalmente de NASA POWER (MERRA-2/CERES), más series de satélite importadas desde Giovanni. Toda visualización estadística debe identificar su procedencia y sus limitaciones relevantes.

---

## 3. Tu responsabilidad exacta y fronteras entre compañeros

Soy **Ekaitz, Coder C**, encargado de **Impact** y **Creativity**. Mi objetivo no es construir el backend científico ni el globo: es hacer que la experiencia del caso sea fluida, comprensible, interactiva, rigurosa y demostrable.

### Áreas que sí puedes modificar, si `OWNERSHIP.md` confirma la ruta

- `components/panel/**`
- `components/charts/**`
- `components/partner/**`
- `components/tour/**`
- `app/api/partner/**`
- `lib/partner/**`
- `lib/tour/**`
- `lib/copy/case.ts`
- `lib/copy/partner.ts`
- `lib/copy/tour.ts`
- Mis archivos propios de scripts, pruebas unitarias y especificaciones E2E, **únicamente donde el mapa de ownership los autorice**.

Los entregables oficiales asociados a estas áreas son: panel del caso, `PlotFigure`, gráficas y tarjetas de veredicto, cliente y servidor de streaming, validación de números, Explain, Partner con herramientas, correlación/mirror/indicador/predicción cuando estén disponibles, tours y evaluación.

### Áreas que NO debes modificar

| Responsable | No editar ni sustituir |
|---|---|
| **Eleder — Lead** | `app/page.tsx`, `app/layout.tsx`, `app/tokens.css`, shell, globo, `components/ui/**`, `components/shell/**`, `components/globe/**`, `lib/state/**`, `lib/api/client.ts`, `lib/api/types.ts`, configuración Next/Vercel, infraestructura compartida y demás áreas del Lead. |
| **Oier — Coder B** | `api/**` (salvo tu ruta distinta `app/api/partner/**`), motor estadístico, pipeline, datos, contratos Pydantic, tests Python, GeoJSON, `lib/api-types.ts` generado, servicios y respuestas. |
| **Sergio — Methods** | Especificaciones estadísticas, golden cases, process cards fuente, criterios de significación y decisión de validación. |
| **Edur — Story** | `docs/pitch/**`, textos originales y documentos de entrega, voz de marca, copy científico revisado, guion y captions finales. |

**Consumo interfaces congeladas; no las redefino:**

- `useCase()`, `caseToQuery`, `caseFromQuery`, `caseKey`, `normalizeCase`.
- `useUiStore`.
- `api` / `serverApi`.
- `lib/api/types.ts` y `lib/api-types.ts`.
- Variables CSS de `app/tokens.css`.
- Hueco del panel `<CasePanel />` que monta Eleder.
- Contratos de `/api/py/*` definidos por Oier en `api/_models.py`.

**Nunca implementes un segundo sistema de estado o una copia paralela del cliente API.** Si necesitas que Eleder/Oier hagan un cambio, explica exactamente la nueva propiedad/componente/contrato requerido y por qué. Un cambio aditivo exige avisar; uno incompatible necesita acuerdo explícito. Nunca lo soluciones editando su área silenciosamente.

---

## 4. Reglas de colaboración, Git y checkpoints

Trabajamos cinco personas en unas 30 horas. El tablero `docs/STATUS.md` manda sobre el estado del reloj. El plan inicial sitúa:

| Hora | Checkpoint esperado |
|---|---|
| H2 (sábado 14:00) | Scaffold, contrato, panel shell y `PlotFigure`. |
| H8 (sábado 20:00) | Panel/gráficos con API y stubs; ejemplos elegidos. |
| H14 (domingo 02:00) | Caso 1 funcional en producción, Explain integrado; revisión de validez. |
| H18 (domingo 06:00) | Coder C termina mejoras antes de dormir. |
| H18–H22 | Descanso previsto para Eleder y Ekaitz. |
| H22 (domingo 10:00) | Reintegración y evaluación del asistente. |
| H26 (domingo 14:00) | **Feature freeze.** |
| H29 (domingo 17:00) | Entrega objetivo; la hora oficial se verifica en STATUS. |

El orden de integración es **Oier → Eleder → Ekaitz** en H2, H8, H14, H22 y H26. No alteres el orden por comodidad.

Procedimiento de Git:

1. **No abras ramas hasta que Eleder haya publicado su scaffold en `main`**, o hasta que las instrucciones actuales permitan continuar.
2. Usa ramas cortas `ekaitz/<tema>` según `docs/process/MERGING.md`.
3. Haz cambios por task, con commits pequeños y descriptivos y las casillas del plan registradas **solo si esa modificación está permitida por ownership**.
4. Antes de PR, rebase sobre `origin/main` con las precauciones del protocolo; inspecciona conflictos y no elimines trabajo ajeno.
5. Ejecuta `npm run check`, `npx vitest run` y las comprobaciones aplicables del proyecto. También `python -m pytest -q` para integraciones cuando el backend esté disponible, sin editar los tests de Oier.
6. PR de tu área: auto-merge **solo si el protocolo y permisos lo permiten y únicamente afecta a tu ownership**. PR cruzada o modificación de un *seam*: Eleder integra y aprueba.
7. Finaliza cada sesión siguiendo `docs/process/handoff.md` (`handoff coder-c`), dejando un resumen recuperable de lo hecho, pruebas ejecutadas, dependencias y próxima acción. No escribas handoffs fuera del directorio autorizado salvo que el protocolo de ownership lo contemple.
8. **No uses operaciones destructivas** (`git reset --hard`, `git clean -fd`, `push --force` indiscriminado, eliminar cambios no propios), ni cambies configuración global del equipo.

La implementación debe continuar a partir del estado actual; **no es obligatorio hacer todas las tasks en un único commit ni antes de un checkpoint ya superado**. Si el tiempo no permite completar todo, la prioridad oficial es:

**Must:** panel, series/gráficos, veredicto, Explain, demos y tours.  
**Should:** correlación, years meter, mirror, Partner con herramientas, share link, predict-before-reveal.  
**Could:** Signal Scanner, cambios de punto (Pettitt), informe PNG/PDF y área personalizada.

**Orden de recorte aprobado si hay retrasos:** Scanner → Mirror → herramientas del Partner (mantener Explain) → búsqueda de lag de correlación.

---

## 5. Contrato de datos: integra lo que existe; no inventes payloads

El backend es **FastAPI**, hospedado bajo `/api/py/*`, dentro de un proyecto Next.js + FastAPI desplegable en Vercel. Su dueño es Oier. Los siguientes endpoints se documentaron en `ARCHITECTURE.md`, pero **la especificación definitiva es `api/_models.py` y los tipos generados del estado actual**:

| Método | Endpoint | Uso de Coder C |
|---|---|---|
| GET | `/api/py/variables` | Listado de variables y definiciones por nivel. |
| GET | `/api/py/regions` | Regiones, disponibilidad y metadatos. |
| POST | `/api/py/analyze` | Series y estadísticas/veredicto para una investigación. |
| GET | `/api/py/trendmap` | Mapa global; su representación en el globo pertenece a Eleder. |
| POST | `/api/py/correlate` | Correlación y gráfico de dispersión/series cuando exista. |
| POST | `/api/py/mirror` | Regiones con tendencia opuesta. |
| POST | `/api/py/scan` | Escáner, solo si está implementado y entra en alcance. |
| GET | `/api/py/health` | Smoke check, si se necesita durante integración. |

Respuesta de análisis, conceptualmente por región:

- `monthly[]`: serie mensual cruda.
- `anomalies[]`: anomalías mensuales.
- `yearly[]`: serie agregada anual/estacional usada en los contrastes.
- `stats.ols`: pendiente, error, p-valor, intervalo de confianza, R², N efectivo.
- `stats.mk`: Mann-Kendall ajustado según el método aprobado, p-valor y tau.
- `stats.sen`: pendiente e intervalo.
- `stats.phi`, `stats.agree`, `change_per_decade`, `pct_of_mean` cuando estén presentes.
- `verdict.tier` y `years_needed` cuando sean válidos.
- `provenance`: atribución del dato.

**Estos nombres son orientativos de los documentos; usa la estructura exacta tipada que tenga la API.** Maneja campos opcionales y `null` sin asumir tipos. No inventes números ni utilices una regresión client-side para suplir errores del motor.

El `Case` se representa en la URL, con un ejemplo documental:

`?v=T2M&r=US-WI,ESP&from=2002&to=2025&s=JJA&lvl=student`

- `nuqs` es el único origen de verdad de Case.
- Las regiones deben quedar en el orden canónico establecido por el codec.
- El deslizador temporal cambia el caso al **soltar**, usando `history: 'replace'`, no generando decenas de entradas de historial.
- Zustand/`useUiStore` se limita a estados efímeros de interfaz, como hover o chat; no dupliques en él la selección persistida en la URL.
- Usa los hooks, utilidades y cliente API **de Eleder**; solicita adaptaciones cuando algo no esté expuesto.
- Al cambiar un caso, cancela/descarta respuestas anteriores para no mostrar evidencias ni explicaciones de otro caso por una condición de carrera.

**Variables científicas:** puede haber temperatura `T2M`, precipitaciones `PRECTOTCORR`, humedad `RH2M`, viento `WS10M`, humedad del suelo `GWETROOT`, nubosidad `CLOUD_AMT` y otras. El catálogo inicial incluye unas 15 candidatas; **solo muestra las que los metadatos indiquen como disponibles o validadas**. Respeta periodos reales, unidad, geografía y restricciones (por ejemplo, variables solo terrestres no seleccionables en océanos). Una variable marcada `candidate` en un catálogo anterior **no equivale** a variable disponible.

---

## 6. PLAN DE IMPLEMENTACIÓN — ejecuta las Tasks 1–9 oficiales

La fuente de verdad del orden, archivos exactos, pasos, pruebas y *snippets* es **`docs/superpowers/plans/2026-11-14-partner-panel.md`**. Los apartados siguientes establecen el resultado que exijo; no reescriben ni sustituyen el plan oficial. Si los números de task o detalles difieren, cumple el plan y conserva estos criterios funcionales dentro de mi ownership.

### TASK 1 — Panel shell y contenedor de gráficas (`PlotFigure`)

**Objetivo:** entregar cuanto antes a Eleder un panel importable y un wrapper reusable para Observable Plot.

Implementa o completa:

- Un `<CasePanel />` coherente con la interfaz que Eleder consume, preparado para alojar los cinco pasos. Debe compilar y renderizar en la shell real sin requerir cambios en `app/page.tsx` por tu parte.
- Los contenedores y estados visuales principales: pasos, navegación entre ellos, progreso contextual, acciones, sección de datos, errores, estados vacíos y carga.
- `<PlotFigure />` como **único wrapper React reutilizable para Observable Plot**, client-only cuando corresponda:
  - `useRef` para el contenedor y la figura.
  - `useEffect` o mecanismo equivalente para construir y desmontar correctamente el plot.
  - `ResizeObserver` si está disponible, desconectándolo en cleanup.
  - Re-render controlado al cambiar datos, tamaño, tema o modo de representación.
  - Limpieza de nodos y listeners; cero duplicados al montar/desmontar.
  - Colores procedentes de variables de `app/tokens.css`, sin introducir un tema alternativo.
  - Títulos de eje, unidades, leyendas y descripciones accesibles.
- Componentes tipados, claros, mantenibles, con exports acordes a los imports existentes.
- Una prueba básica que detecte regresiones de montaje/render/cleanup donde tenga sentido.

**Aceptación:** Eleder puede integrar `<CasePanel />`; `PlotFigure` soporta redimensionado y desmontaje; TypeScript y los tests propios pasan; no se ha tocado la shell.

### TASK 2 — Flujo de investigación Lead / Scene / Timeline

**Objetivo:** que el usuario configure una investigación real sin inconsistencias de estado.

**Lead — variable:**

- Mostrar las variables reales devueltas por la API con nombre, unidad, definición accesible y fuente.
- Tarjeta de definición en nivel Student/Scientist según el modo del caso.
- Buscar/filtrar variables si el plan lo prevé; mantener selección comprensible.
- Manejar variables no disponibles por región, periodo o tipo de geografía: deshabilitar con una razón visible, **no ofrecer una opción que falle silenciosamente**.

**Scene — región:**

- Leer las regiones seleccionadas desde `useCase()` y sincronizar con las selecciones del globo de Eleder.
- Soportar **hasta cuatro regiones** en una investigación; mostrar sus nombres, permitir retirar y comparar sin duplicados.
- Respetar IDs canónicos (`USA`, `US-WI`, `OCN-*`, `NR-*`, etc.) y disponibilidad por variable.
- No crear un globo, buscador geográfico paralelo o un nuevo store; reutilizar lo que el Lead expone.

**Timeline — tiempo y estación:**

- Intervalo de años válido dentro de la cobertura del dataset.
- Selector/deslizador con límites y orden correctos; confirmar al soltar y escribir en URL con `history: 'replace'` según codec.
- Estaciones `Annual`, `DJF`, `MAM`, `JJA`, `SON` y opción personalizada **si así está soportada por el contrato**.
- Si se elige DJF, respeta la definición anual aprobada en `METHODS.md` (el cliente no debe reinterpretar diciembre).
- Mensajes claros si el intervalo es demasiado corto, contiene faltantes o no permite un análisis fiable; los criterios se derivan del backend/métodos, no de heurísticas inventadas.

**Aceptación:** cambiar Lead/Scene/Timeline actualiza el Case canónico y las secciones dependientes; navegación adelante/atrás consistente; un enlace compartido restablece la investigación.

### TASK 3 — Evidence: visualizaciones científicas y Verdict

**Objetivo:** convertir los datos del motor en evidencia inteligible y un veredicto transparente.

Construye los gráficos requeridos en `components/charts/**`, usando `PlotFigure`:

1. **Serie mensual cruda** por región, con fechas ordenadas, unidad correcta y tratamiento explícito de ausencias.
2. **Anomalías mensuales**, diferenciadas visual y semánticamente de los valores crudos.
3. **Serie `yearly`**: un punto por año o estación/año, claramente identificada como base del contraste.
4. **Línea OLS** y **banda de intervalo de confianza**, respetando exactamente la semántica de la respuesta real; no construyas una banda de predicción confundida con un IC de pendiente.
5. **Línea de pendiente de Sen**, con etiqueta y terminología consistentes.
6. **Comparación de varias regiones (hasta cuatro)**, superposiciones legibles, leyenda estable, colores distinguibles y unidades compatibles.
7. **Procedencia y limitaciones** por figura: variable, unidades, fuente/producto si están disponibles, periodo/estación, advertencias o flags del dataset.

Construye la tarjeta de Verdict:

- Reproduce **exactamente** el nivel devuelto por el motor (`Confirmed`, `Not proven yet`, `No case`) y los textos aprobados por Sergio/Edur.
- Presenta pendiente y tasa por década, p-valor, método estadístico, confianza, consistencia de pruebas y datos disponibles **solo cuando existan** y con precisión/unidades correctas.
- Aclara que **"not significant" no significa "no change"**; no conviertas un p-valor en probabilidad de que la hipótesis sea verdadera.
- Si OLS y Mann-Kendall no concuerdan, no ocultes la discrepancia; presenta la advertencia que establezca `METHODS.md`.
- Evita un falso "Confirmed" por animación, color o copy si el resultado es `Not proven yet`.
- Mantén un veredicto de plantilla independiente de Claude, para que siempre pueda mostrarse aun sin clave, con error de IA o sin streaming.

Estados a cubrir: loading, sin regiones, variable sin datos en región, periodos inválidos, serie insuficiente, fallo de red, valores `null`/no finitos, comparación incompleta, backend sin respuesta, cambio rápido de filtros y respuesta obsoleta.

**Aceptación:** funciona con las fixtures oficiales y luego con `/api/py/analyze` real sin rehacer componentes; no genera interpretaciones ni estadísticas client-side alternativas; el caso #1 se puede mostrar y entender.

### TASK 4 — Infraestructura del partner: SSE, herramientas auxiliares y comprobación de números

**Objetivo:** una capa robusta, verificable y segura para streaming y grounding.

En `lib/partner/**` y la ruta propia de Coder C:

- Implementa helpers SSE con eventos propios del servidor al navegador: **`text`, `tool_result`, `propose_case`, `error`** y cualquier evento terminal que exija el plan oficial.
- Maneja fragmentación de chunks de red, límites de líneas, desconexiones, cancelaciones, errores HTTP, errores de lectura y reconexión solo si el contrato lo contempla.
- Preserva el orden de fragmentos, hace limpieza de recursos y evita renderizar una respuesta vieja en un caso nuevo.
- Implementa un **number check** comprobable y testeado: cualquier cifra factual que Claude comunique sobre los datos debe estar sustentada por los resultados del motor/herramientas usados en ese turno. La política de comparación, precisión y tolerancia la define el plan/`EVAL.md`; **no uses una regex simplista que considere correcto cualquier número, ni cambies un valor estadístico sin justificarlo**.
- Añade test cases con números correctos, incorrectos, unidades, formatos de p-valor, porcentajes, pendientes, rangos y casos sin resultados. Diferencia cuando proceda fechas, índices, identificadores y números explicativos de cifras medidas, conforme a las reglas oficiales.
- En desarrollo, muestra/registrar errores de grounding de forma útil sin filtrar secretos ni datos sensibles. En producción, no emitas estadísticas no contrastadas como hechos.

**Aceptación:** el parser SSE soporta chunks arbitrariamente particionados y cancelación; las afirmaciones cuantitativas sin soporte se detectan; pruebas de número correctas y de error pasan.

### TASK 5 — Claude Explain: explicación automática y streaming

**Objetivo:** que el Case #1 pueda explicarse de extremo a extremo en producción en H14, sin que el producto dependa del uptime de Claude.

- Implementa el endpoint propio **`app/api/partner/route.ts`** para Explain, siguiendo el diseño y contrato exactos del plan; usa Next.js server-side.
- **Modelo acordado por el equipo:** `claude-opus-5-5`, sujeto a la configuración y snippets verificados del plan. Usa `adaptive thinking` y `output_config.effort` cuando así lo dicten el plan y el SDK realmente instalado (`low` para Explain, `medium` para Partner como punto de partida), más el mecanismo de fallback documentado, si está soportado.
- **NO improvises firmas del SDK Anthropic.** Lee primero la habilidad `claude-api` si está instalada y, sobre todo, los fragmentos de `docs/superpowers/plans/2026-11-14-partner-panel.md`. El plan indica código verificado: reutilízalo. Si existe documentación del proyecto sobre `typescript/claude-api/README.md`, `tool-use.md` y `streaming.md`, léela.
- `ANTHROPIC_API_KEY` **exclusivamente en el servidor**, mediante variable de entorno. No la metas en componentes cliente, el bundle, fixtures, console logs, commits ni respuestas de error.
- El cliente envía **los resultados estadísticos JSON que ya tiene** en lugar de forzar una nueva llamada interna al backend; valida los datos de entrada y sus límites.
- El asistente recibe solo números aprobados/resultado de herramientas y explicaciones físicas obtenidas de process cards que correspondan a la variable/región. No inventa causas ni conexiones.
- Debe nombrar el test pertinente e interpretar correctamente significación, tamaño de efecto, estacionalidad, ruido y limitaciones; toda formulación concreta sigue las plantillas de Sergio y Edur.
- Conmutador Student/Scientist conectado al nivel de lectura del Case; explicaciones distintas de verdad en nivel de detalle, no solo longitud.
- Streaming incremental con estado loading, texto progresivo, completar/cancelar, errores y opción de reintentar.
- Pre-generación/caché de **explicaciones de los casos demo oficiales**, usando `lib/partner/demo-explanations.json` y `caseKey` canónico para latencia predecible. No atribuyas a Claude un texto o resultado generado sin el análisis real; necesita aprobación científica.
- Mantén la **plantilla de Verdict** siempre visible como fallback, también si falta API key, hay rechazo, `max_tokens`, rate limit, timeout o error de red.
- Maneja stop reasons `refusal` y `max_tokens`, límites explícitos de tokens, y no pongas en bucle las reintentos.
- Si está previsto en la versión de SDK, aplica caching al sistema/catalogo/process cards; verifica métricas como `cache_read_input_tokens` sin afirmar que hubo caché si no hay datos.
- Protección antiabuso: validar tamaños/entradas, no exponer excepciones internas, no aceptar URLs arbitrarias, y coordinar la regla de rate limit para `/api/partner` **con Eleder**, propietario del firewall de Vercel. Un contador solo en memoria no es una protección fiable en serverless.

**Aceptación:** Explain emite SSE consumible, explica un Case real con cifras fundamentadas, tiene fallback inmediato, no expone API keys y el resultado está testeado. La disponibilidad real de Claude debe verificarse; sin credenciales no se puede afirmar que las llamadas reales funcionan.

### TASKS 6–8 — Partner con herramientas; vistas avanzadas; tours y creatividad

**Objetivo:** completar los elementos `Should` que diferencian el proyecto una vez asegurado el flujo imprescindible.

#### A. Partner chat con tool use

- Chat interactivo en `components/partner/**`, con historial efímero y estados de envío, streaming, cancelación, herramientas en curso, fallos y respuestas.
- Respeta los roles: **no sustituir el motor científico por cálculos del LLM**.
- Integra Tool Runner con `betaZodTool` **si ese es el contrato verificado del SDK/plan** para estas herramientas:
  1. `list_variables`
  2. `analyze_case`
  3. `correlate`
  4. `find_mirror`
  5. `scan_region`
  6. `get_process_card`
  7. `propose_case`
- Las herramientas científicas llaman a la API propia `/api/py/*` mediante URL **absoluta construida desde una configuración de origen confiable del servidor**, nunca desde una URL controlada por el usuario. En previews protegidos, utiliza `x-vercel-protection-bypass` **solo desde el servidor** y si existe el mecanismo de protección/variable correspondiente.
- Valida estrictamente parámetros, IDs y límites; no permitas llamadas a dominios arbitrarios (SSRF) ni ejecución de acciones desde texto libre no verificado.
- `get_process_card` solo recupera tarjetas curadas y citadas; no uses artículos imaginarios ni inferencias causales sin tarjeta aplicable.
- `propose_case` ofrece una propuesta de Case que el usuario puede **aceptar explícitamente**, tras validación mediante los helpers canónicos; no modifiques la URL ni el caso activo por una sugerencia de Claude sin interacción del usuario.
- Tope de iteraciones y tokens de herramientas según plan; manejo de herramientas inexistentes, datos vacíos, refusals, límites y error parcial.
- Cifras en respuestas: de resultados reales. Número no verificable: no mostrarlo como resultado científico.

#### B. Correlación, Mirror, years meter y predict-before-reveal

- **Correlación:** vista con datos de `/api/py/correlate`, anomalías, detrended si disponible, desfase hasta ±6 meses cuando soportado, dispersión interpretada y aviso visible: **"dos variables que aumentan a la vez no implican causalidad"**. No calcules coeficientes adicionales en cliente; etiqueta raw vs detrended correctamente.
- **Mirror:** UI que presenta las regiones opuestas que devuelve `/api/py/mirror` con nombre, variable, signo, magnitud y significación disponibles; no implementes ni cambies el globo ni el algoritmo del backend. Para efectos del globo, coordínate con Eleder por el contrato ya congelado.
- **Years until significant:** si el motor devuelve una estimación válida, muéstrala con lenguaje inequívoco de **estimación condicionada a los supuestos**, nunca como promesa de que la tendencia será significativa en X años. Si el método la considera no estimable, no enseñes un número inventado.
- **Predict-before-reveal:** si está elegido como momento característico del producto y el plan lo contempla, permite que el usuario prediga el signo/resultado antes de descubrir la evidencia, sin manipular la estadística ni bloquear el recorrido normal. Diseño didáctico, no gamificación engañosa.
- **Share link:** usa exclusivamente el codec/URL canónicos para compartir el caso; no crees un sistema propio de persistencia.
- **Scanner:** únicamente si las tareas obligatorias y `Should` de mayor prioridad ya funcionan, existe `/api/py/scan` y no viola H26.

#### C. Tours de los tres casos de demostración

- Usa `docs/science/DEMO_CASES.md` para los tres casos **FINAL** y `docs/pitch/DEMO_SCRIPT.md` para los captions.
- Transforma estos materiales —sin inventar resultados ni atribuciones— a `lib/tour/tours.json`, conforme al esquema documental:

  `Tour { id, title, steps: [{ query, caption, focus?, highlight?, reveal? }] }`

- El recorrido reproduce el flujo **Lead → Scene → Timeline → Evidence → Verdict** con foco visual y captions claros.
- La app tiene un CTA comprensible **"Watch this case"** (o copy aprobado), avance/retroceso, cierre y restauración correcta de interacciones. No secuestres el scroll/foco ni dejes estado residual.
- No inventes los otros dos casos si Edur/Sergio no han aprobado la selección; prepara infraestructura y un fallback claro.
- El producto siempre debe permitir investigar manualmente sin necesidad de ver tours.

**Aceptación:** el usuario puede explorar, preguntar y entender las conclusiones sin que Claude controle datos o estado a espaldas del usuario; los tours muestran casos aprobados; fallos parciales se degradan elegantemente.

### TASK 9 — Finalización, demos, evaluación, E2E y QA

- Convierte los **tres casos aprobados**, con sus stats reales, en explicaciones precalculadas de ambos niveles (`student`, `scientist`) con `caseKey` correcto. **Sergio debe validar las afirmaciones**; no marques una explicación como aprobada si no lo está.
- Ejecuta las **20 preguntas de `docs/science/EVAL.md`** con el verificador de números y la revisión de Sergio. Reporta aciertos/fallos reales; no inventes `20/20`.
- Escribe y ejecuta pruebas unitarias/integración propias y especificaciones E2E **en tus rutas permitidas**, sin editar infraestructura de Playwright del Lead.
- Con Playwright, verifica la experiencia completa: elegir variable, región, periodo y estación; Evidence; Verdict; Explanation; tours; manejo de errores; cases compartidos. Coordina las flags WebGL swiftshader de Eleder para capturas headless y header de preview cuando aplique.
- QA visual y funcional de paneles y gráficas con ventanas desktop representativas: textos no cortados, leyendas, contrastes, foco visible, navegación con teclado, estados de carga/errores y filtros accesibles. Utiliza screenshots reales y no afirmes haberlos revisado si no se generaron.
- Integra el checklist de copy/consistencia que entregue Edur sin modificar sus documentos fuente.
- Verifica ausencia de credenciales en cliente y commits.
- Antes de cada integración: `npm run check`, `npx vitest run` y `python -m pytest -q` según disponibilidad, más E2E si está configurado y es posible.
- Si llega H26, **solo P0**, según protocolo, aunque el resto del plan no esté completo.

**Aceptación:** mi ámbito se integra sin romper el trabajo de los compañeros, el Case #1 puede demostrarse sin intervención manual en backend, los gráficos y cifras están fundamentados, el asistente tiene degradación segura, y el estado final está documentado en un handoff.

---

## 7. Requisitos transversales no negociables

### Rigor estadístico

- El motor de Oier implementa métodos de Sergio. Según el diseño documental: series `yearly` para significación; Hamed–Rao Mann–Kendall y pendiente de Sen como contraste/estimador, junto a OLS con corrección por autocorrelación e IC. **No decidas tú si uno de los tests prevalece**: lee la decisión real en `METHODS.md`.
- No confundas una anomalía mensual con una observación independiente de un test de tendencia.
- No infieras causalidad de correlación ni de coincidencia temporal.
- No uses `p < 0.05` como regla universal nueva si `METHODS.md` establece matices o criterios combinados.
- Diferencia **no detectado / no significativo** de **demostrado inexistente**; no prometas significación futura.
- Cuando haya un dato de reanálisis, no lo presentes como observación satelital directa. Atribuye NASA POWER/MERRA-2, CERES, MODIS Aqua/Giovanni según cada resultado.
- Una región agregada puede esconder variación dentro de ella; conserva las advertencias que proporcione el motor.
- El modelo no puede producir explicaciones físicas propias: únicamente process cards curadas con citas.

### Diseño e interacción

- El diseño visual base pertenece a Eleder y el copy a Edur. Reutiliza componentes, tokens, tipografía y patrones existentes, no importes un kit visual nuevo sin coordinación.
- UI elegante, precisa y sobria: buen contraste, jerarquía clara, etiquetas visibles, leyendas honestas, unidades, indicadores de estado útiles.
- Orientación principal desktop (el equipo decidió **no mobile-first**), pero evita desbordamientos absurdos en ventanas más pequeñas.
- Accesibilidad: controles etiquetados, navegación por teclado, estados de foco, mensajes de error `aria` donde proceda, alternativas textuales para las conclusiones de las gráficas, y respeto a `prefers-reduced-motion`.
- Evita gráficos vistosos pero científicamente confusos, escalas y barras truncadas sin indicar, líneas discontinuas interpretadas como datos presentes o "significancia" comunicada solo por color.
- Textos UI centralizados en `lib/copy/{case,partner,tour}.ts`, desde `docs/pitch/COPY.md`; no disperses literales duplicados.

### Ingeniería y seguridad

- TypeScript tipado, componentes desacoplados y pequeños, manejo explícito de errores, ninguna dependencia nueva pesada si ya hay un equivalente instalado.
- No crees variables de entorno, SDKs o APIs ficticias. Si no hay credenciales, implementa el fallback y declara que no pudiste verificar llamadas reales.
- SSE con cierre, cancelación, timeout razonable y límites; evitar stale state y *race conditions*.
- Ninguna clave en `NEXT_PUBLIC_*`, source maps, logs o respuesta al navegador.
- Valida tool inputs, `Case` y payloads enviados a Claude; evita enviar estructuras gigantes y protege el endpoint de gasto accidental.
- Las herramientas de Claude son solo de consulta y propuesta; ninguna acción arbitraria sobre archivos, base de datos, terceros o permisos.
- Si alguna configuración de Vercel, firewall o variable de entorno exige intervención de Eleder, indícale exactamente los pasos pendientes y deja el código seguro.
- En serverless, no confíes en caché o rate limit exclusivamente en memoria para garantías de seguridad.

---

## 8. Pruebas y definición objetiva de «terminado»

No basta con generar componentes: **cada entrega debe compilar, tener una ruta de integración real y un modo de comprobarse**. Selecciona pruebas según el estado del repo y usa los fixtures del equipo, nunca datos presentados como reales si son simulados.

Matriz mínima deseada:

| Área | Evidencia de aceptación |
|---|---|
| Panel y estado | Componentes montan, Case se lee/escribe mediante `useCase`, límites de región y tiempo respetados. |
| `PlotFigure` | Render, resize, cleanup y actualización sin leak/duplicación. |
| Evidence | Monthly, anomalies, yearly, OLS+CI, Sen y comparación hasta 4 regiones con unidades y procedencia. |
| Verdict | Los tres tiers, significación y discrepancias expresados según METHODS, fallback sin IA. |
| SSE | Chunk boundaries arbitrarios, eventos completos, cancelación, error, stream agotado, respuesta obsoleta. |
| Number check | Detecta valores inventados, respeta cifras/precisión permitidas y no falsea resultados. |
| Explain | Integración server-side, Student/Scientist, streaming, demo precalculada y fallback sin credenciales. |
| Partner | Tools con validación, límite de loops, `propose_case` explícito, proceso físico citado, no SSRF. |
| Funciones Should | Correlación/mirror/years correctamente representadas y ocultas cuando el backend no las soporta. |
| Tours | Tres demos aprobadas o infraestructura preparada con bloqueo declarado; funcionamiento sin tour. |
| Integración | `npm run check` y tests que correspondan, sin cambios fuera de ownership. |

**No maquilles el resultado de los comandos.** Si una suite falla por una causa externa o preexistente, reproduce, aísla y reporta la causa, el propietario y el alcance exacto. Si el fallo está en tu área, corrígelo antes de considerar acabada la task.

---

## 9. Cómo debes comunicarte y qué debes entregar

### Durante el trabajo

- Presenta un estado inicial breve, luego implementa sin solicitar aprobaciones redundantes.
- Cada bloque de avance debe explicar **qué código real cambió, qué prueba corrió y qué queda**. Evita párrafos de narración sin resultado.
- Después de cada task, haz un commit si lo permite el proceso; no crees un commit que incluya archivos ajenos.
- Si falta una dependencia, usa las fixtures oficiales para avanzar con la UI y deja identificado qué integración no puede comprobarse todavía.
- Si detectas una decisión científica no tomada, no inventes el criterio: marca la dependencia con Sergio y usa un texto neutro avalado por el motor hasta recibirlo.
- Si falta `COPY.md`, usa provisionalmente solo los términos del glosario en `PROJECT.md` en tu área y señala el reemplazo pendiente; no crees un nuevo documento fuente de copy.
- Si falla Claude o hay rate limits, conserva la tarjeta de Verdict y continúa con gráficos/tours.

### Al terminar la ejecución, entrega un informe preciso

Estructura tu respuesta final así:

1. **Estado global:** `COMPLETO`, `PARCIAL` o `BLOQUEADO` (sin exagerar).
2. **Tasks 1–9:** terminada/parcial/no iniciada, archivos principales y commits.
3. **Funcionalidades comprobadas:** distinguir fixtures, backend real, llamada real a Claude y producción desplegada.
4. **Pruebas ejecutadas:** comandos y resultado exacto.
5. **Cambios de Git:** rama, commits, PR/merge y estado de worktree; no afirmes push/merge si no sucedió.
6. **Dependencias externas:** qué necesita Eleder, Oier, Sergio o Edur, con ruta/contrato/acción concreta.
7. **Próximo paso ejecutable:** uno o varios pasos concretos para continuar desde el punto alcanzado.
8. **Handoff `coder-c`:** generar o actualizar según `docs/process/handoff.md` si está autorizado, para que otra sesión pueda continuar sin repetir el análisis.

No afirmes que Coder C está 100% terminado si faltan integración, acceso a API, pruebas, revisión científica o entrega de copy. Si la implementación no se ha desplegado, di explícitamente **"implementado localmente, pendiente de despliegue/integración por el Lead"**.

---

## 10. Prioridad inmediata y primera acción

**Empieza ahora mismo.**

1. Sigue `resume coder-c` y lee el plan oficial completo, el estado y el ownership.
2. Determina cuál es la primera task no completada y si el scaffold y las interfaces que consume ya están disponibles.
3. Trabaja esa task creando/modificando **archivos reales de mi área**, ejecutando tests y registrando un commit limpio.
4. Continúa con la siguiente task del plan sin esperarme, siempre que sus dependencias estén disponibles y no contradigas el reloj, las reglas de merge o el feature freeze.
5. Concentra tus esfuerzos en tener, cuanto antes, un **CasePanel + Evidence + Verdict + Explain** plenamente utilizable y verificable; después completa el resto de Coder C por prioridades.

**Recuerda:** estamos en un hackathon, no en una refactorización a largo plazo. La mejor solución es la que llega a una demo coherente, estable, científicamente defendible, fiel al diseño del equipo y **sin romper las contribuciones paralelas**.

**Tu misión está clara: completa la responsabilidad de Coder C (Ekaitz) con código real, pruebas, commits y handoff.**

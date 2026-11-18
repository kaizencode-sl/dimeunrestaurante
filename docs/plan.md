# Plan: hosting, medios y publicación automática desde Instagram

Estado (18/11/2026): **diseño acordado, nada construido todavía.**

Este documento recoge lo que se ha decidido para pasar de la web actual (Astro en GitHub Pages, repo público, imágenes servidas desde el WordPress antiguo) a una web en Cloudflare cuyas reseñas se generan solas a partir de los posts de Instagram de Alberto.

---

## 1. Punto de partida

- **Contenido:** 728 reseñas en `src/data/reviews.json` (~4 MB), cargadas con el content layer de Astro (`file()` en `src/content.config.ts`) y validadas con Zod. Se generan como páginas estáticas.
- **Hosting:** GitHub Pages mediante `.github/workflows/pages.yml`. El repo tiene que ser público para que la web lo sea.
- **Redirecciones:** las URLs del WordPress antiguo están en `src/data/redirects.json`. En un build estático, Astro las genera como páginas con `meta refresh`, no como 301 reales.
- **Imágenes:** **7.256 imágenes de reseñas se cargan desde el WordPress antiguo** (`https://dimeunrestaurante.com/wordpress/wp-content/uploads/...`). Si el dominio apunta a la web nueva sin moverlas antes, todas dan 404.
- Las fotos de Instagram ya están en `public/img/ig`, con copias de 800 px generadas por `scripts/photos.mjs` (sharp). La asociación de cada plato con su foto está en `src/data/dish-photos.json`.

---

## 2. Decisiones

### 2.1 Datos: JSON en git, sin base de datos

- **No usamos Supabase ni ninguna base de datos.** Con ~400 reseñas nuevas al año (unas 1.130 en total, ~6,5 MB) el JSON sobra. Una base de datos haría depender el build de un servicio externo, sacaría el contenido de git (sin historial ni diffs) y no mejoraría el rendimiento de un sitio estático.
- **Dividir `reviews.json` en un archivo por reseña** (`src/content/reviews/<id>.json`) y cambiar `file()` por `glob()`. Así cada reseña nueva es un archivo nuevo y las PRs quedan limpias.
- Una base de datos o un CMS solo tendrían sentido si alguien sin conocimientos técnicos tuviera que editar desde un panel, si hubiera contenido dinámico (comentarios, votos) o si llegáramos a decenas de miles de reseñas.

### 2.2 Hosting: Cloudflare

| Opción | ¿Repo privado gratis? | Motivo del descarte o de la elección |
|---|---|---|
| **Cloudflare (Workers static assets / Pages)** | Sí | **Elegida.** Tráfico estático ilimitado gratis, CDN, DNS en el mismo sitio y 301 reales con `_redirects`. |
| Netlify | Sí | Plan gratuito por créditos y con límite de ancho de banda. |
| Vercel | Sí | El plan Hobby es solo para uso no comercial. |
| GitHub Pages + Pro | No (~4 $/mes) | Pagas solo por tener el repo privado y sigues sin 301. |

- Build: `pnpm build`; salida: `dist`.
- Generar **`_redirects` desde `redirects.json`** para servir 301 reales y conservar el SEO de las URLs antiguas.
- Sobran `BASE_PATH`, `SITE_URL` y `PUBLIC_PREVIEW`, y el workflow `pages.yml` se elimina.
- No hace falta SSR, VPS ni Docker.

### 2.3 Dominio

Pasos, en este orden:

1. **Migrar antes las imágenes del WordPress** (ver 2.4) y hacer una copia de seguridad del WordPress.
2. Desplegar en Cloudflare y comprobar la web en la URL `*.workers.dev`.
3. Añadir el dominio en Cloudflare, que importa los registros DNS.
4. **Revisar los registros de correo (MX, SPF, DKIM)**, si el dominio tiene email.
5. Cambiar los nameservers en el registrador. Opcionalmente, transferir después el dominio a Cloudflare.
6. Añadir `dimeunrestaurante.com` y `www` como dominios personalizados del proyecto. El SSL se configura solo. Dejar una única versión canónica (con o sin `www`) y redirigir la otra.
7. Enviar el sitemap nuevo en Google Search Console.

### 2.4 Medios: Cloudflare R2

- **Bucket R2** servido desde un subdominio, por ejemplo `media.dimeunrestaurante.com`, con caché de la CDN. Es gratis hasta 10 GB y no cobra por tráfico de salida.
- **Imágenes:** las versiones se generan antes de subirlas, con `sharp` (lo mismo que hace ya `scripts/photos.mjs`): 800 y 1600 px, en AVIF y WebP. Descartamos Cloudflare Images (redimensionado al vuelo) porque no aporta nada si ya generamos las versiones.
- **Vídeos:** `ffmpeg` a MP4 H.264 de 720p o 1080p con `faststart`, más un póster en WebP, todo en R2. Si los vídeos se alargan o hay mucho tráfico, pasar a **Cloudflare Stream** (HLS adaptativo; 5 $ por cada 1.000 min almacenados y 1 $ por cada 1.000 min reproducidos).
- Se migran al mismo bucket las 7.256 imágenes del WordPress y las de `public/img/ig`. No se meten en el repo, porque con vídeos crecería varios GB.

---

## 3. Pipeline de publicación automática

### 3.1 Visión general

```
Workflow 1: ingesta (cron cada 4 h)
│
├─ [0] Clasificador          (regla @handle + Jev, dentro del script)
│       ¿es una reseña? ── no ──► se marca como procesado y se ignora
│                       ── dudoso ──► issue "¿Esto es una reseña?"
│
├─ [1] Ingesta               (script determinista, sin IA)
│       descargar → comprimir → subir a R2
│
├─ [1b] Descriptor           (1 llamada con visión, dentro del script)
│       describe cada foto/vídeo y lo asocia a su plato → posts.json
│
└─ [2] Agente escritor       (solo texto; solo si hay reseñas nuevas)
        escribe/actualiza la reseña → pnpm build → abre PR

Workflow 2: revisión (al abrir o actualizar la PR)
│
├─ [3] Checks deterministas
│
├─ [4] Agente revisor
│       ¿OK? ── sí ──► aprueba → auto-merge → Cloudflare publica
│            ── no ──► comenta correcciones al escritor → push → vuelve a [3]
│            ── 3 rondas sin aprobar ──► etiqueta needs-human
│
└─ Notificación de cada merge (email/Slack) con enlace a la reseña
```

Principio de diseño: **la IA solo hace lo que requiere entender** (clasificar, describir y asociar fotos y platos, redactar, revisar). **Todo lo que es mover archivos lo hace código determinista**: es más fiable, más barato y más fácil de depurar.

### 3.2 Lectura de Instagram

- **API oficial de Instagram** (Instagram API with Instagram Login). **No usamos scraping**: incumple los términos, se rompe y pueden bloquear la cuenta.
- **Requisitos que tiene que cumplir Alberto:** cuenta profesional (Creador o Empresa) y una app en Meta para obtener el token de larga duración. El token se renueva cada 60 días y se puede renovar en el mismo job.
- La API no avisa cuando la propia cuenta publica, así que se consulta **por cron, cada 4 horas**.
- Las URLs de los medios que da la API caducan, así que hay que descargarlos en la misma ejecución.

### 3.3 Paso 0: clasificador

No todos los posts de Alberto son reseñas, así que se clasifica **antes de descargar nada**.

1. **Pista determinista, gratis:** las reseñas empiezan con `NOMBRE @restaurante` en la primera línea (`scripts/import-reviews.mjs` ya extrae el `handle` así). No se usa sola para descartar.
2. **[Jev](https://openrouter.ai/blog/insights/what-is-jev/)** (`typesafe/jev-1.14`, vía OpenRouter), un **modelo de decisión** que no genera texto: devuelve una opción de una lista cerrada junto con su probabilidad.
   - Se le hace **una pregunta de tipo Choice** con las opciones `opinion | dishes | drinks | not_review` sobre el caption y la pista determinista. La probabilidad que devuelve hace de `confidence`.
   - **Primero solo con el caption.** La miniatura de la primera foto se añade solo si la probabilidad sale baja, porque con imágenes Jev pasa a un modo de contexto largo, más lento y menos preciso. Jev solo acepta PNG y JPEG: sirve la miniatura JPEG de Instagram tal cual, pero no nuestras versiones en WebP o AVIF.
   - Jev no extrae datos. El `handle` sale de la regla de la primera línea y el nombre del restaurante lo escribe el agente escritor.
   - Coste: 0,042 $ por millón de tokens de entrada, y la salida es gratis. **Menos de una centésima de céntimo por post.**
   - **Riesgos:** está en acceso anticipado (endpoint `POST /api/alpha/decisions`) y el soporte de imágenes es reciente. Hay que fijar la versión (`jev-1.14`, no `~typesafe/jev-latest`) y la probabilidad indica lo concentradas que están las respuestas, no si acierta, así que el umbral se calibra en la prueba comparativa.
   - **Plan B:** una llamada con salida estructurada a un modelo generativo barato (Gemini 3.1 Flash-Lite, gpt-6-luna o Claude Haiku 5.5, menos de 0,001 $ por post), que además puede extraer el nombre y el `handle`:

     ```json
     { "kind": "opinion" | "dishes" | "drinks" | "not_review",
       "restaurant": "Casa Lista", "handle": "casalista",
       "confidence": 0.95, "reason": "Empieza con nombre y @, da nota y precio" }
     ```
3. **Qué se hace con cada resultado:**
   - `not_review`: se marca como procesado y no se descarga ni se sube nada.
   - `confidence` < 0,8: se abre un issue con el enlace al post. **Ningún post se descarta sin dejar rastro.**
   - `opinion`, `dishes` o `drinks`: se agrupan por `handle` dentro de una ventana de unos días, porque una reseña puede venir repartida en varios posts (por ejemplo, Yakiniku Rikyu tiene un post de opinión y otro de platos del mismo día). Un post `dishes` que llega sin su opinión espera a la siguiente ejecución.
4. **Estado:** se guardan los IDs de todos los posts procesados, también los descartados. Puede ir en un archivo del repo o deducirse de `instagram.posts` de las reseñas, más una lista de los ignorados.

### 3.4 Paso 1: ingesta determinista (`scripts/instagram.mjs`)

Es un paso propio del workflow y **el único que tiene las credenciales de Instagram y R2**. El agente no puede verlas. Este paso también ejecuta el clasificador (paso 0), así que necesita además la clave de OpenRouter.

1. Descarga las fotos y vídeos de los posts que son reseñas.
2. Optimiza:
   - Fotos: `sharp` a 800 y 1600 px, en AVIF y WebP.
   - Vídeos: `ffmpeg` a MP4 con póster, más **3 o 4 fotogramas en JPEG** repartidos por el vídeo (por ejemplo `casa-lista-v1-f2.jpg`). Los usan el descriptor (si no admite vídeo nativo), el revisor y el check con Jev, que solo acepta PNG y JPEG.
3. Sube todo a R2, **fotogramas incluidos**, para que el workflow del revisor pueda descargarlos sin volver a procesar el vídeo.
4. Ejecuta el descriptor (paso 1b) y escribe `posts.json` con el caption, la fecha, el permalink, el `kind`, el `handle` y la lista `media[]` que devuelve el descriptor.
5. Indica si hay reseñas nuevas, para que el paso del agente solo se ejecute cuando haga falta.

Se puede probar en local sin agente: `node scripts/instagram.mjs` y revisar `posts.json`.

### 3.4b Paso 1b: descriptor de imágenes y vídeos

**Un modelo con visión describe los medios y los asocia a los platos; el escritor ya solo trabaja con texto.** Es **una sola llamada con salida estructurada por post, no un agente**, y va dentro del script de ingesta, igual que el clasificador (`DESCRIBER_MODEL`).

- **Recibe el caption y la lista de platos que menciona**, además de todas las fotos (versión de 800 px). Sin el caption solo podría decir «carne a la brasa en tiras» y el escritor tendría que adivinar el plato. Con él, **la asociación foto–plato la hace el modelo que ve las fotos.**
- **Vídeos:** si el modelo acepta vídeo de forma nativa (Gemini), recibe el MP4 completo; si no, los 3 o 4 fotogramas. Hay que comprobar si OpenRouter admite vídeo como entrada para Gemini.
- Devuelve, para cada medio:

  ```json
  { "file": "casa-lista-13.webp", "url": "https://media…/casa-lista-13.webp",
    "type": "image",
    "dish": "chuleta de rubia", "dish_confidence": 0.9,
    "description": "Chuleta cortada en tiras sobre tabla, con sal en escamas",
    "alt": "Chuleta de rubia gallega cortada, con sal en escamas",
    "cover_candidate": true }
  ```

  `dish` es `null` si el medio no corresponde a ningún plato del caption (el local, la carta, un vino...).

**Por qué separarlo del escritor:**
- **El escritor no necesita visión.** Se puede elegir cualquier modelo de texto (incluidos algunos sin visión, como DeepSeek) y desaparece la duda de si OpenCode pasa las imágenes al modelo.
- **Las imágenes se procesan una sola vez.** En cada ronda de corrección el escritor trabaja solo con texto, sin volver a cargar las fotos.
- **Cada parte se evalúa y se corrige por separado.** Si una foto sale mal asignada, se ve enseguida si falló la descripción o la redacción.
- **Mejor comprensión de los vídeos**, si se puede usar vídeo nativo.

**Coste:** las imágenes (~15.000 tokens por post) se pagan una sola vez. El ahorro frente a un escritor con visión son céntimos al mes; la ventaja real es la calidad y la libertad para elegir modelos.

**Riesgo:** un error del descriptor llega al escritor sin que este pueda detectarlo, porque no ve las imágenes. Por eso **el revisor sigue viendo las imágenes** (ver 3.6).

### 3.5 Paso 2: agente escritor

Se ejecuta como **un agente de código dentro de la Action** (opción B; ver 3.8), **solo con texto**. Recibe `posts.json` (caption y `media[]` con descripciones, platos asignados, `alt` y candidatas a portada) y:

- Decide si es una reseña nueva o la actualización de una existente (`instagram.kind: "new" | "update"`), buscando entre las reseñas del repo.
- Escribe el JSON de la reseña según el esquema de `content.config.ts` y el tono de las reseñas existentes, con las URLs de R2.
- Rellena `dish-photos.json` con las asociaciones del descriptor, elige la portada entre las candidatas y usa los `alt` del descriptor.
- Ejecuta `pnpm build` y corrige sus propios errores.
- Abre la PR, con una tabla de qué foto se ha asignado a cada plato (con su `dish_confidence`) para que se revise de un vistazo.

### 3.6 Pasos 3 y 4: revisión automática, sin revisión humana

**Paso 3, checks deterministas** (sin IA, antes del revisor):
- `pnpm build`, que valida el esquema.
- Todas las URLs de imágenes y vídeos devuelven 200.
- Cada plato de `dish-photos.json` aparece en el texto de la reseña.
- Branch protection en `main`: no se puede fusionar nada que no pase estos checks.

*Experimento, que ya usa IA:* **Jev con preguntas de tipo Noul** (sí/no con probabilidad) para cada pareja foto–plato, por ejemplo «¿esta foto muestra una chuleta de rubia?». Es un check casi gratis que detectaría fotos mal asignadas antes de que llegue el revisor. Como Jev solo acepta PNG y JPEG, hay que convertir antes la versión de 800 px de las fotos; los fotogramas de los vídeos ya están en JPEG, así que el check también cubre los vídeos. Se mide en la prueba comparativa y solo se activa si es fiable.

**Paso 4, agente revisor:** un segundo workflow que se dispara al abrir o actualizar la PR (`pull_request: opened, synchronize`).
- **Es independiente:** solo recibe el caption original, el diff y las imágenes, nunca el razonamiento del escritor. A ser posible, usa **un modelo de otra familia**, porque detecta mejor los errores que uno igual al escritor.
- Comprueba:
  - Que los datos salen del caption, que es la fuente de verdad. Ni la nota ni el precio ni la ciudad ni los platos pueden ser inventados.
  - Que cada foto **y cada vídeo** corresponde a su plato. Para eso, su workflow descarga primero desde R2 las versiones de 800 px de las fotos y **los fotogramas JPEG de los vídeos**, y **los mira él mismo**: no se fía de las descripciones del descriptor, porque es la única comprobación independiente de esa asociación. Por eso el revisor sí necesita un modelo con visión, que lea las imágenes del disco del runner.
  - El revisor no ve vídeo (OpenCode abre imágenes, no MP4) y, al ser de otra familia que el descriptor, no será Gemini con vídeo nativo. Ve menos que el descriptor, pero unos fotogramas repartidos bastan para comprobar si el vídeo es el plato asignado. **Si con los fotogramas no puede confirmar la asociación de un vídeo, no la rechaza: marca la PR `needs-human`.**
  - Que la distinción entre reseña nueva y actualización es correcta, que el tono se parece al de Alberto y que los `alt` son buenos.
  - Que se respetan las lecciones de `docs/agent-lessons.md`.
- Si todo está bien, **aprueba y activa el auto-merge**. Si no, deja un comentario con las correcciones concretas que empieza por la mención que activa al escritor (`/opencode`). El escritor corrige y hace push, y ese push vuelve a lanzar este workflow (`synchronize`).
- **Como máximo 3 rondas**, contadas por los comentarios del revisor en la PR. Después se pone la etiqueta `needs-human` y el flujo se para.

**Detalles técnicos:**
- Los eventos generados con el `GITHUB_TOKEN` por defecto **no disparan otros workflows**. Los agentes tienen que usar el token de una GitHub App.
- El escritor tiene que permitir explícitamente los comentarios del bot revisor; por defecto, algunas Actions ignoran los comentarios de bots.

**Salvaguardas, porque no hay revisión humana:**
- Notificación de cada merge, con enlace a la reseña. Revertir es un clic.
- `needs-human` automático si la nota no aparece de forma explícita en el caption, si el post es negativo con el restaurante o si el revisor no puede confirmar con los fotogramas a qué plato corresponde un vídeo.

### 3.7 Memoria de lecciones

- En CI no hay memoria entre ejecuciones, así que la memoria es un **archivo versionado**: `docs/agent-lessons.md`. Las instrucciones de los dos agentes dicen que lo lean antes de empezar; no hay que depender de que cada herramienta cargue `CLAUDE.md` o `AGENTS.md` por su cuenta.
- Cuando el escritor aplica una corrección, **añade la lección en la misma PR**. Por ejemplo: «Si el caption dice "menú degustación", `price` es el precio del menú, no el precio medio».
- El revisor también revisa las lecciones, que solo se quedan si la PR se fusiona.
- Reglas: solo lecciones generalizables, una línea cada una y sin duplicados. Cada cierto tiempo se consolida el archivo.

### 3.8 Cómo se integra el agente en GitHub Actions

| Opción | Qué es | Veredicto |
|---|---|---|
| A. Script + una llamada a la API | El paso del caption es una sola llamada con salida estructurada | La más barata y predecible, pero no se adapta a casos que no hayas previsto. Sirve de alternativa si queremos simplificar. |
| **B. Agente de código en la Action** | Claude Code (`claude-code-action`), Codex (`openai/codex-action`), Gemini CLI (`run-gemini-cli`) u OpenCode | **Elegida.** Se adapta, valida su trabajo con el build y responde a comentarios en la PR. |
| C. Managed Agents de Anthropic | Anthropic aloja el agente y el cron | Descartada: beta, coste por tiempo de sesión y otra plataforma más, sin ventajas aquí. |

- **Decisión: OpenRouter para todos los modelos y OpenCode para los agentes.**
  - **[OpenRouter](https://openrouter.ai/)**: una sola clave (`OPENROUTER_API_KEY`) y una sola factura para todos los modelos. Cobra el mismo precio que el proveedor y se queda una comisión del ~5,5 % al comprar créditos (son céntimos con este volumen; confirmar en su web).
  - **OpenCode** (`anomalyco/opencode/github`) admite cualquier proveedor (`provider/model`), entre ellos OpenRouter. Se lanza por cron y responde a menciones en la PR (`/opencode`). `claude-code-action`, `codex-action` y `run-gemini-cli` están atadas a un proveedor y no usan OpenRouter.
  - El clasificador (Jev) y el descriptor los llama directamente el script de ingesta.
  - **Un modelo fijo por paso**, guardado en variables de GitHub Actions (`CLASSIFIER_MODEL`, `DESCRIBER_MODEL`, `WRITER_MODEL`, `REVIEWER_MODEL`), para cambiar de modelo sin tocar código. El escritor y el revisor, de familias distintas; el descriptor y el revisor, también, para que el revisor no repita los errores de visión del descriptor.
  - **Por comprobar:** que OpenCode pasa al modelo del revisor las imágenes que abre del disco.
  - **No usamos el router automático** (`openrouter/auto`): no se puede evaluar, porque el modelo cambia en cada petición; puede elegir uno sin visión; y no garantiza que escritor y revisor sean de familias distintas.
  - Inconvenientes asumidos: los datos (captions y fotos, que son públicos) pasan por un intermediario más, y algunas funciones propias de cada proveedor (caché de prompts, detalles de la salida estructurada) pueden comportarse distinto a través de OpenRouter. Se comprueba en la prueba comparativa.
- Ejemplo de estructura del workflow (los nombres exactos de los inputs hay que comprobarlos en la documentación de cada Action):

  ```yaml
  on:
    schedule: [{ cron: "0 */4 * * *" }]
  jobs:
    ingest:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - id: ingest
          run: node scripts/instagram.mjs # clasifica, procesa y escribe posts.json
          env:
            IG_TOKEN: ${{ secrets.IG_TOKEN }}
            R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
            R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
            OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
            CLASSIFIER_MODEL: ${{ vars.CLASSIFIER_MODEL }}
            DESCRIBER_MODEL: ${{ vars.DESCRIBER_MODEL }}
        - if: steps.ingest.outputs.new == 'true'
          uses: anomalyco/opencode/github@<versión fijada>
          env:
            OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          with:
            model: ${{ vars.WRITER_MODEL }}
            prompt: Lee docs/agent-lessons.md y posts.json, y crea o actualiza las reseñas...
  ```

---

## 4. Modelos

**Sin decidir.** Con unos 9 posts al mes, cualquier candidato cuesta unos pocos euros al mes o menos, así que lo que decide es la **calidad**, y hay que medirla.

Estimación por post: unos 150.000 tokens de entrada y 10.000 de salida, sumando escritor y revisor en una ronda y contando las imágenes. Con el descriptor separado, el reparto cambia (las imágenes las pagan el descriptor y el revisor, y el escritor solo texto), pero el total queda en el mismo orden de magnitud. Los precios son de noviembre de 2026; los de OpenAI y Google, de sus páginas oficiales.

| Modelo | Entrada / salida (por millón de tokens) | Por post | Al mes |
|---|---|---|---|
| Claude Opus 5.5 | $4 / $20 | ~$0,80 | ~$7 |
| Claude Sonnet 5.5 | $2 / $10 | ~$0,40 | ~$3,60 |
| OpenAI gpt-6.2-sol | $2 / $10 | ~$0,40 | ~$3,60 |
| Gemini 4 Hydrogen | $1,50 / $7,50 | ~$0,30 | ~$2,70 |
| OpenAI gpt-6.1-terra | $1 / $5 | ~$0,20 | ~$1,80 |
| Gemini 3.8 Flash (⚠️ el doble desde el 1/1/2027) | $0,75 / $3,75 | ~$0,15 | ~$1,35 |
| Gemini 3.1 Flash-Lite | $0,25 / $1,50 | ~$0,05 | ~$0,45 |
| Qwen 3.8 Flash (precio de agregadores) | ~$0,15 / $0,47 | ~$0,03 | ~$0,25 |
| OpenAI gpt-6-luna | $0,10 / $0,50 | ~$0,02 | ~$0,20 |
| Claude Haiku 5.5 | $0,10 / $0,50 | ~$0,02 | ~$0,20 |

- DeepSeek no tiene visión, así que no sirve para el descriptor ni para el revisor. **Sí puede ser candidato a escritor**, que ahora solo trabaja con texto (DeepSeek V4 Flash, unos 0,22 $ / 0,66 $ por millón de tokens fuera de hora punta según agregadores; confirmar en su web).
- Pendiente: confirmar qué modelos de OpenAI aceptan imágenes.
- **Descriptor:** un modelo con buena visión; si es posible, Gemini con vídeo nativo. Candidatos: Gemini 4 Hydrogen, Gemini 3.1 Flash-Lite y algún modelo de visión de OpenAI.
- **Clasificador:** **Jev** (`typesafe/jev-1.14`, 0,042 $ por millón de tokens de entrada, salida gratis). Plan B: un modelo de gama baja (Haiku 5.5, gpt-6-luna o Flash-Lite).
- **Hipótesis por validar:** un descriptor de visión, un escritor de gama media solo de texto (gpt-6.1-terra o DeepSeek) y un revisor con visión de otra familia que el descriptor, con OpenCode sobre OpenRouter, por unos 2–4 € al mes.
- Todos los candidatos se llaman a través de OpenRouter, así que la prueba comparativa recorre los modelos con una sola clave.

### Prueba comparativa antes de elegir

Ya tenemos los datos para hacerla: las reseñas generadas a partir de posts de Instagram, con su caption, su `instagram.posts[].kind` y su `dish-photos.json`.

1. **Arquitectura:** comparar un escritor con visión que lo hace todo frente a descriptor más escritor de solo texto, con los mismos posts.
2. **Descriptor:** medir la asociación foto–plato contra `dish-photos.json` y la calidad de los `alt`. En los posts con vídeo, comparar vídeo nativo (Gemini) frente a fotogramas.
3. **Escritor y revisor:** pasar el mismo post de unas 10 reseñas existentes a 4 o 5 candidatos (gpt-6.1-terra, DeepSeek como escritor de texto, Gemini 4 Hydrogen, gpt-6-luna y Claude Sonnet 5.5 como referencia).
4. **Puntuar:** campos correctos (nota, precio, ciudad, cocina), aciertos al asignar foto y plato, datos inventados y fidelidad al tono de Alberto.
5. **Clasificador:** añadir unos 20 posts que no sean reseñas (personales, colaboraciones, viajes) y comparar Jev, solo con el caption y con caption más miniatura, frente al plan B. Calibrar el umbral de probabilidad. Lo importante es que **no se cuele ningún post que no sea reseña** y que se pierdan muy pocas reseñas.
6. **Check foto–plato con Jev (Noul):** medir con las parejas de `dish-photos.json` si detecta las fotos mal asignadas, mezclando parejas correctas con otras intercambiadas a propósito.

Coste estimado de la prueba: unos pocos dólares.

---

## 5. Costes recurrentes estimados

| Concepto | Coste |
|---|---|
| Hosting Cloudflare (estático) | 0 € |
| R2 (hasta 10 GB, sin coste por tráfico de salida) | 0 € al principio |
| GitHub Actions, repo privado (~2.000 min o 12 $ de cómputo al mes en el plan Free) | 0 €: unos 200–250 min al mes de cron, más unos pocos minutos de checks y revisión por cada ronda de una PR. Muy por debajo del cupo. |
| Modelos de IA, vía OpenRouter | ~0,20–7 € al mes según el modelo (ver 4), más ~5,5 % de comisión sobre los créditos. El clasificador con Jev es prácticamente gratis. |
| Cloudflare Stream (solo si hace falta) | 5 $ por cada 1.000 min almacenados, 1 $ por cada 1.000 min reproducidos |

---

## 6. Orden de ejecución

1. **Imágenes del WordPress a R2.** Medir cuánto ocupan, crear el bucket y el subdominio, y hacer un script que descargue, optimice con `sharp`, suba y reescriba las URLs de `reviews.json`. También migrar `public/img/ig`. *Es lo que bloquea el cambio de dominio.*
2. **Desplegar en Cloudflare** con `_redirects` generado desde `redirects.json`, comprobar en `*.workers.dev`, cambiar el DNS y eliminar `pages.yml`. Pasar el repo a privado.
3. **Dividir `reviews.json`** en un archivo por reseña (`glob()`).
4. **Prueba comparativa de modelos** a través de OpenRouter: arquitectura (escritor con visión frente a descriptor más escritor de texto), descriptor, escritor, revisor, clasificador (Jev frente al plan B) y el check foto–plato con Jev.
5. **Job de Instagram:** `scripts/instagram.mjs` (clasificador, ingesta y descriptor) y el workflow con el agente escritor.
6. **Agente revisor:** checks deterministas, branch protection, auto-merge, límite de rondas, `docs/agent-lessons.md` y notificaciones.

## 7. Lo que necesitamos antes de empezar

- [ ] Cuenta de Cloudflare, bucket R2 y token de API con permisos de R2.
- [ ] Acceso al registrador del dominio y lista de los registros DNS actuales, sobre todo los de correo.
- [ ] Copia de seguridad del WordPress.
- [ ] Cuenta de Instagram de Alberto como profesional (Creador o Empresa).
- [ ] App en Meta y token de larga duración de la API de Instagram.
- [ ] Cuenta de OpenRouter con créditos y `OPENROUTER_API_KEY` (sustituye a las claves de cada proveedor).
- [ ] Una GitHub App (la de OpenCode o una propia) para que los agentes comenten y disparen workflows.
- [ ] Secretos y variables en GitHub: `IG_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `OPENROUTER_API_KEY` como secretos; `CLASSIFIER_MODEL`, `DESCRIBER_MODEL`, `WRITER_MODEL` y `REVIEWER_MODEL` como variables.
- [ ] Canal de notificaciones de los merges (email o Slack).

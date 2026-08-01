# Weluk — Documento de Contexto del Proyecto

> **Nombre del producto: Weluk** (de "we look" — deformación ortográfica intencional,
> patrón de naming similar a Tumblr/Flickr). Nombre definitivo tras un proceso extenso
> de exploración con el directorio — se descartaron previamente Emivo (sonaba infantil,
> "amivoo", para un contexto de pitch de startup), Massiva (colisión directa con
> Massiva S.A., empresa chilena de OOH/DOOH de 30+ años), Wesee (colisión con al menos
> dos startups de tech activas del mismo nombre), Clevo (colisión con fabricante de
> laptops), y otras variaciones (Klento, Cleve, Plyed, Sygnal, Glance, Mírelo, etc.).
> Dominio y disponibilidad de marca verificados como libres.
>
> Proyecto desarrollado por Octalink SpA (Concepción, Chile) — Weluk es el nombre de
> marca del producto, no reemplaza a Octalink como empresa.
>
> **Pendiente:** definir tagline final (los explorados para Emivo ya no aplican
> directamente, se pueden adaptar al nuevo nombre más adelante).

> Este documento es la fuente de verdad compartida entre los 4 repositorios del producto
> (landing, panel, apk, visor-web). Ninguna decisión aquí está escrita en piedra — es la
> base de trabajo actual, sujeta a revisión a medida que avanza el desarrollo y el piloto.
>
> Cada repo debe incluir este archivo (o un link a él) para que cualquier sesión de
> Claude Code / IDE tenga contexto completo del producto, aunque solo esté trabajando
> en una parte específica.

---

## 1. Qué es esto

**Weluk** es la plataforma de digital signage (cartelería digital) desarrollada por
**Octalink SpA** (Concepción, Chile). Permite administrar listas de reproducción (imágenes/video) y
programarlas por horario en pantallas remotas (TVs con Android box, o Smart TVs vía
navegador).

**Motivación de negocio:** no es solo un SaaS self-serve. El modelo core es un
**servicio administrado + plataforma**, dirigido a clientes que no quieren tocar nada
("hazlo todo tú"), con un tier adicional self-serve para clientes que sí quieren
administrar su propio contenido. Ver sección 8 para el modelo comercial completo.

**Por qué se construye en vez de usar un competidor (Juuno, Yodeck, Anthias, etc.):**

1. Es parte de un producto más grande — se integra con el modelo de servicios
   administrados de Octalink (diseño de slides + administración + soporte), no solo
   licenciamiento de software.
2. Objetivo explícito de aprendizaje técnico del equipo — costo de oportunidad aceptado
   conscientemente, no oculto en el business case.

---

## 2. Arquitectura general — 4 repos separados

Repos **independientes**, no monorepo (salvo que en el futuro se detecte repetición real
de tipos/interfaces entre panel y visor-web, ahí evaluar pnpm workspaces — no antes).

| Repo        | Stack                              | Deploy                        | Responsabilidad                                          |
| ----------- | ---------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `landing`   | Astro                              | Vercel                        | Marketing, SEO, estático                                 |
| `panel`     | Vue.js                             | Vercel                        | Admin: pantallas, playlists, schedules, pairing, publish |
| `apk`       | React Native                       | Play Store / sideload directo | Visor para Android TV box (ej. "onn")                    |
| `visor-web` | Vue.js (confirmado, ver sección 3) | Vercel                        | Visor para navegador de Smart TV                         |

**Futuro (no en v1):** apps nativas Tizen (Samsung) / LG webOS — el equipo ya tiene
experiencia previa en esto de proyectos para canales de TV. Se posterga hasta validar
tracción, porque implica pasar por revisión de store de cada fabricante.

---

## 3. Decisión de stack — visor web: Vue, no vanilla JS

**Decisión revisada durante el proceso.** La hipótesis inicial era usar JS puro para el
visor web, asumiendo que un framework reactivo sería demasiado pesado para el motor
Chromium/WebKit desactualizado de un Smart TV corriendo 24/7.

**Se descartó esa hipótesis** tras inspeccionar en producción el visor de Juuno
(`d.juuno.co`), un competidor validado a escala con cientos de Smart TVs en el mundo real.
Su network tab confirma stack Vue completo (`vue-runtime`, VeeValidate, arquitectura de
paquetes compartidos tipo monorepo, bundler Vite). Esto es evidencia de que **Vue sí
funciona bien en este contexto**, y valida usar el mismo framework que ya domina el
equipo (consistencia con el panel, reutilización de lógica).

**Precaución que se mantiene igual:** monitorear memoria en sesiones largas (24h+) al
probar en hardware real — no por Vue específicamente, sino por cualquier riesgo de
memory leak en un proceso que nunca se recarga.

**Paso previo obligatorio antes de comprometerse del todo:** probar en el navegador real
del Onn (u otro box Android genérico) y en el navegador integrado de al menos una Smart
TV real, qué versión de Chromium corre debajo, y si el `localStorage`/almacenamiento
persiste entre reinicios y actualizaciones de firmware.

**Hallazgo de la primera prueba en hardware real (26 julio 2026):** un Smart TV Samsung
más viejo mostraba pantalla en blanco con el build normal de Vite — el navegador es tan
antiguo que ni siquiera soporta `<script type="module">` nativo, así que el JS nunca
llegaba a correr (el navegador ignora el tag silenciosamente, sin error visible). Dato
de contexto útil: en ese mismo TV, `d.juuno.co` (el competidor validado) tampoco cargó
(quedó en negro) — confirma que es un techo real de hardware/navegador, no un bug propio.

**Fix aplicado:** se agregó `@vitejs/plugin-legacy` en `vite.config.js` del repo
`visor-web`, con `targets: ['chrome >= 38', 'safari >= 9']`. Esto genera un bundle
adicional transpilado a ES5 + polyfills + loader SystemJS, servido vía `<script
nomodule>` como fallback. Tras esto el visor cargó correctamente en el TV viejo.

- **Ojo con la versión del plugin:** la última versión de `@vitejs/plugin-legacy` (8.x)
  pide Vite 8 como peer — como el proyecto corre Vite 5.x, hay que fijar la versión del
  plugin a la misma serie mayor que Vite (`@vitejs/plugin-legacy@5.4.3` en este caso),
  no instalar "latest" a ciegas.
- **El fallback legacy solo existe en el build de producción** (`vite build`), nunca en
  el dev server (`vite dev`). Para probar en hardware real (TV/Onn) siempre hay que usar
  `pnpm build && pnpm preview --host`, o el deploy real en Vercel (que ya corre `vite
build` automáticamente) — nunca el dev server directo.
- Pendiente: repetir esta misma validación en el box Onn.

**Segundo hallazgo, al implementar pairing (26 julio 2026):** pantalla en blanco al
probar el visor por IP de LAN en HTTP plano (ej. `http://192.168.1.x:5173`) — funcionaba
bien en `localhost` pero no por IP. Causa: `crypto.randomUUID()` (usado para generar el
`device_uuid` persistente) **solo existe en contextos seguros** (HTTPS, o el caso
especial de `localhost`); por HTTP plano en una IP simplemente no está disponible y la
app revenaba al montar, antes de renderizar nada. Muy probablemente la misma causa de
que el visor se cayera en el TV real (que accedía por IP, no por una URL HTTPS).

- **Fix aplicado:** `src/lib/device.js` ahora hace fallback a un generador de UUID
  manual (`Math.random()`, sin necesidad de Web Crypto) cuando `crypto.randomUUID` no
  existe. No cambia nada cuando sí está disponible.
- **No afecta producción:** el deploy real es vía Vercel, que sirve todo por HTTPS
  (contexto seguro) — este bug solo aparece probando por IP de LAN en HTTP plano durante
  desarrollo, o si alguna vez se prueba en el TV apuntando directo a una IP en vez de una
  URL HTTPS real.

### Matriz de compatibilidad de hardware real (validado 27-28 julio 2026)

Tres Smart TVs distintas probadas contra el deploy real de Vercel (nunca por IP de LAN,
ver regla operativa en sección 7). Los datos de "cuota" salen de `navigator.storage.estimate()`
leído desde el overlay — cuando el navegador no lo soporta, se descubre por bisección
(el `QuotaExceededError` de `cache.put` aparece o no según el tamaño del archivo).

| Dispositivo     | Navegador             | `blob:` en `<video>`                                  | Cache API (disco)                                                          | Cuota observada          |
| --------------- | --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------ |
| Samsung (viejo) | Tizen 4.0, Chrome 56  | ❌ No reproduce — falla en silencio, sin `MediaError` | ✅ Existe, pero insuficiente para un video de 11 MB (`QuotaExceededError`) | Muy baja (rechaza 11 MB) |
| LG              | NetCast, Chrome 79    | ✅                                                    | ✅                                                                         | 315.2 MiB                |
| Samsung (nuevo) | Tizen 6.0, Chrome 120 | ✅                                                    | ✅                                                                         | 80.0 MiB                 |

**Hallazgo crítico del Samsung viejo:** el video nunca se reproduce y **no lanza ningún
error observable** (ni evento `error`, ni rechazo de `play()`) — el reproductor nativo de
Tizen 4 no entiende `blob:` URLs y falla mudo. Sin el watchdog de reproducción (sección 7)
esa pantalla se queda en negro para siempre sin que nadie se entere. Confirmado además que
`d.juuno.co` (competidor validado) tampoco carga en este mismo TV — es un techo real de
hardware, no algo que se pueda arreglar por software. **Decisión: ese modelo queda fuera
del piso soportado por navegador; el camino para clientes con ese hardware es box/stick
Android + APK, no el visor web.**

**`performance.memory` no es confiable en estos navegadores.** Tanto el LG como el Samsung
nuevo reportaron memoria "usada/total" idéntica y estática durante horas (en un caso,
usada > total, matemáticamente imposible). Tratar ese campo del overlay como orientativo,
nunca como señal dura de memory leak en este tipo de hardware.

**La cuota de disco varía muchísimo entre dispositivos** (80 MiB a 315 MiB, y prácticamente
cero en el Samsung viejo) — el diseño de caché no puede asumir que el contenido siempre
cabrá en disco; el fallback a memoria (sección 7) es lo que sostiene la reproducción cuando
no cabe, no un caso extremo raro.

---

## 4. Backend / Datos

- **Base de datos:** Supabase (Postgres). Elegido sobre Firebase porque el modelo es
  relacional (pantallas, playlists, schedules, clientes) y porque el equipo ya lo usa en
  otros proyectos (RHL, QForest, plataforma nutricional).
- **Storage:** Supabase Storage, para imágenes/video de las playlists.
- **Sync en tiempo real:** Supabase Realtime (websocket sobre Postgres WAL) — **no
  polling**. Ver sección 6.
- **Deploy:** Vercel para landing, panel, y visor-web.

### Plan Supabase — Free tier (verificado julio 2026)

| Recurso                          | Límite Free                        |
| -------------------------------- | ---------------------------------- |
| Base de datos                    | 500 MB                             |
| File storage                     | 1 GB total, 50 MB máx por archivo  |
| Egress                           | 5 GB/mes                           |
| Conexiones Realtime concurrentes | 200                                |
| Mensajes Realtime/mes            | 2,000,000 (máx 256 KB por mensaje) |
| Proyectos activos                | 2                                  |

**Riesgo real identificado para el piloto:** no es egress ni conexiones (ampliamente
suficiente para 1-5 pantallas con cambios ocasionales) — es el **límite de 1 GB de
storage total** y **50 MB máx por archivo**. Definir desde el día uno:

- Pipeline de compresión de video antes de subir (H.264 bien comprimido).
- Política de limpieza de contenido/versiones viejas no usadas.

**Riesgo operativo:** proyectos free se pausan tras 7 días sin actividad de API. No
debería ocurrir con Realtime corriendo 24/7 en las TVs, pero cuidado si las TVs de
prueba quedan desconectadas por un período largo entre pruebas del piloto.

**Gotcha de RLS descubierto (27 julio 2026, al implementar el disconnect del
visor):** un `UPDATE` de un rol sin policy que lo permita **no da error** — PostgREST
responde `204 No Content` afectando **0 filas**, como si hubiera funcionado. El bug
real: la policy de `UPDATE` para `anon` en `screens` estaba en `weluk-schema.sql` pero
nunca se había corrido contra el proyecto real, y esto quedó oculto durante horas
porque el disconnect por SQL directo (rol `postgres`, sin RLS) sí funcionaba.

- **Cómo evitarlo:** cualquier escritura de `anon`/`authenticated` vía supabase-js debe
  encadenar `.select()` y verificar `data.length > 0` — si es 0, RLS bloqueó la
  escritura en silencio, tratarlo como error.
- Una policy de `UPDATE` necesita `with check (...)` además de `using (...)` — sin
  `with check`, la fila nueva puede rechazarse en silencio.
- No asumir que lo que está en `weluk-schema.sql` ya está aplicado en el proyecto
  Supabase real — confirmar con `select policyname, cmd, roles, qual, with_check from
pg_policies where tablename = '<tabla>';`.
- **Directamente relevante para `panel`**: todas sus escrituras de `authenticated`
  tienen el mismo riesgo.

---

## 5. Modelo de datos — esquema final consolidado

Decisión clave tomada tras revisar el flujo real de Juuno: **sin historial de versiones,
sin workspaces de agencia, sin tabla de sucursales**. El modelo se simplificó
deliberadamente para el MVP. Reglas de negocio ya resueltas:

- **Una pantalla = una sola playlist activa a la vez.** `screens.current_playlist_id`
  se sobrescribe directamente al asignar una nueva — no hay versiones ni historial.
- **Draft vs. publicado sin duplicar datos.** `playlist_items` es la única fuente de
  verdad del contenido. La tabla `playlists` tiene `updated_at` (cambia con cualquier
  edición normal) y `published_at` (SOLO cambia al apretar "Publicar"). El visor
  escucha únicamente cambios en `published_at`, nunca en `updated_at` — así una edición
  a medio hacer nunca llega a la pantalla en vivo.
- **Auth:** `auth.users` de Supabase solo para login/password. Toda la lógica de
  negocio (rol, empresa asociada) vive en la tabla `profiles`, no en metadata de Auth.
- **Roles:** `superadmin` (equipo Octalink, `company_id = null`, ve todas las
  companies — cubre el modelo full-managed) y `company_admin` (administra solo su
  propia company, tier self-serve).
- **Sin tabla de sucursales/locations.** Si se necesita en el futuro, empezar por un
  campo de texto libre en `screens`, no una tabla nueva — mismo enfoque simple que usa
  Juuno (que tampoco modela sucursales como entidad separada).

### Fuente de verdad del esquema

> **El archivo `weluk-schema.sql` (en la raíz de este repo / carpeta de infraestructura)
> es la única fuente autoritativa del esquema real** — tablas, columnas, índices, RLS,
> policies de `anon`, y configuración de Realtime. Este documento solo resume el
> propósito de cada tabla en alto nivel; ante cualquier duda de columnas exactas, tipos
> de dato, constraints o policies, **revisar el `.sql`, no este resumen.** Si el esquema
> cambia, se actualiza únicamente el `.sql` — este resumen se actualiza después, como
> reflejo, no como fuente.

Resumen de tablas (propósito, no estructura exacta — ver `.sql` para columnas reales):

```
companies       — cada cliente (RHL, Lomo Alemán, gym, etc.)
profiles        — id = auth.users.id, role, company_id
media           — archivos subidos (imagen/video)
playlists       — name, updated_at (draft), published_at (lo que ve el visor)
playlist_items  — orden y duración por ítem dentro de una playlist
screens         — device_uuid, current_playlist_id, last_seen_at
pairing_codes   — code, device_uuid, status, expires_at
```

**Configuración del proyecto Supabase aplicada (no solo el `.sql`):**

- "Automatically expose new tables" → activado (decisión consciente para simplificar
  el MVP; Supabase ya no lo deja activado por defecto en proyectos nuevos desde 2026,
  hay que seguir activándolo a mano). Revisar/ajustar en Project Settings → Data API.
- "Enable automatic RLS" → desactivado (el `.sql` ya controla RLS explícitamente).
- Región del proyecto: Americas.

### Storage (Supabase Storage)

- **Bucket:** `media` — público (`Public bucket = true`), ya que el visor lee sin
  sesión de usuario (rol `anon`).
- **Restricciones aplicadas al bucket:** tamaño máximo 50 MB por archivo (coincide con
  el límite global del plan free), MIME types permitidos: `image/jpeg, image/png,
image/webp, video/mp4`.
- **Estructura de carpetas:** `media/{company_id}/{nombre_archivo}` — un folder por
  company, evita mezclar contenido entre clientes. El campo `media.storage_path` en la
  BD guarda esta ruta relativa (no la URL completa).
- **Pendiente:** policies de Storage para limitar quién puede subir/borrar (hoy solo
  se sube manual desde el dashboard como owner del proyecto; falta definir el flujo de
  upload desde el panel una vez construido).

### Datos de prueba sembrados (ambiente de desarrollo)

Datos base en el proyecto Supabase para desarrollar/probar sin depender del `panel`
(que todavía no existe):

- `companies`: 1 fila, "Gym Test" (`id = 11111111-1111-1111-1111-111111111111`)
- `media`: archivos de prueba (imagen/video) en
  `media/11111111-1111-1111-1111-111111111111/` en el bucket de Storage
- `playlists`: "Playlist Gym" y "Playlist Test 2", ambas con `published_at` seteado
- `screens` / `pairing_codes`: **vacías por defecto** — el flujo real de pairing
  (sección 6) ya está implementado y es la única forma de crear una fila en `screens`;
  ya no se usa un `device_uuid` hardcodeado. Para reclamar un código a mano (mientras
  no existe el `panel`), ver el patrón de SQL en la sección 6.

### Detección de pantalla conectada/desconectada

Se usa **Supabase Realtime Presence**, no solo heartbeats manuales.

**✅ Implementado y validado end-to-end (30 julio 2026)** — cerró la brecha que estuvo
documentada en la sección 13:

- El visor hace `channel.track(...)` **una sola vez**, apenas su `.subscribe()` sobre el
  canal `screen-${device_uuid}` (el mismo que ya mantiene abierto 24/7 para sync de
  playlist — no es un canal nuevo) confirma estado `SUBSCRIBED`. No es periódico ni en
  loop. Supabase detecta automáticamente cuando esa conexión se cae, sin que el visor
  tenga que avisar explícitamente al desconectarse.
- El panel (`weluk-panel`, `src/modules/screens/composables/useScreenPresence.ts`)
  escucha `presence.sync` sobre ese mismo canal, por cada pantalla visible, y muestra el
  estado en vivo en `ScreensView` (columna "Conexión", punto verde/gris) — sin polling,
  reusando la conexión que ya existía (no suma conexiones concurrentes nuevas).
- **Costo verificado, no solo estimado:** contra el dashboard real de Supabase, con el
  patrón de "track una sola vez" el tráfico de mensajes es despreciable (confirmado:
  119/2,000,000 mensajes usados en el proyecto real tras todas las pruebas de esta
  sesión). Realtime se factura por cantidad de mensajes, no por GB — no tiene relación
  con el incidente de egress de la sección 7.
- **Sigue pendiente:** `screens.last_seen_at` como respaldo histórico (para reportes
  tipo "esta pantalla lleva 3 días sin conectarse") — Presence resuelve el estado "ahora
  mismo" pero no guarda historial, y no se implementó ningún `UPDATE` periódico de esta
  columna.
- Funciona igual en cualquier hardware (visor-web, APK) porque es una función del
  cliente JS de Supabase, no depende del tipo de dispositivo.

---

## 6. Flujo de pairing (vinculación de pantalla)

Inspirado en el patrón estándar de la industria (mismo concepto que OAuth 2.0 Device
Authorization Grant, RFC 8628 — código corto + claim desde otro dispositivo con teclado),
y confirmado en producción observando el flujo real de Juuno.

1. Visor arranca → genera/recupera su `device_uuid` interno persistente.
2. Visor solicita un código corto (4-6 caracteres, alfabeto sin ambigüedad visual:
   evitar 0/O, 1/I/L) → se verifica que no exista ya un código igual en estado
   `pending` → se inserta en `pairing_codes` con expiración (10-15 min).
3. Visor muestra pantalla de espera: código grande, una sola instrucción simple
   ("Desde un navegador, ve a [URL] para activar esta pantalla"), sin ruido técnico.
   Referencia visual: pantalla de espera de Juuno (fondo oscuro, código centrado,
   instrucción de una línea).
4. Visor abre y mantiene vivo un canal Supabase Realtime escuchando cambios sobre
   ese código/pantalla **desde este mismo momento** (no esperar a que se reclame para
   conectar el websocket — la percepción de "instantáneo" depende de esto).
5. Usuario entra al panel, escribe el código, asigna nombre a la pantalla y
   playlist/schedule inicial → confirma.
6. Backend valida código (pending, no expirado) → lo marca `claimed`, crea/actualiza
   el registro en `screens`.
7. El visor recibe el evento vía el websocket ya abierto (latencia esperada: cientos
   de milisegundos) → deja de mostrar el código, empieza a preparar/descargar el
   primer contenido, y pasa a modo reproducción.

**Códigos NO necesitan ser globalmente únicos para siempre** — solo únicos mientras
están en estado `pending`. Se pueden reutilizar libremente una vez expirados/reclamados.

**Función de "Disconnect this screen"**: debe existir (tanto en panel como posiblemente
en el propio visor) para desvincular una pantalla sin reinstalar la app — vuelve al
estado de pantalla de espera con código nuevo.

**✅ Implementado y validado en `visor-web` (26-27 julio 2026):**

- Código de **5 caracteres**, alfabeto `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (sin 0/O/1/I/L),
  expiración de 15 min.
- `device_uuid` persistente en `localStorage` (`src/lib/device.js`), con fallback manual
  de generación de UUID cuando `crypto.randomUUID` no está disponible (ver sección 3).
- El código pendiente actual también se guarda en `localStorage` junto a su
  `expires_at` (`src/lib/pairingCode.js`) — un refresh mientras sigue vigente lo reusa
  en vez de generar uno nuevo (evita filas basura en `pairing_codes`); cuando expira,
  un timer genera uno nuevo automáticamente, sin intervención manual.
- "Disconnect this screen" implementado en el overlay de diagnóstico (`Overlay.vue`):
  hace `UPDATE screens SET status='disconnected'`, y el visor vuelve a pairing en vivo
  sin recargar la página (requiere la policy de UPDATE de `anon` — ver gotcha de RLS
  en sección 4).
- **Validado con 3 dispositivos reales simultáneos** (2 Smart TVs + notebook): cada uno
  con su propia identidad, sin interferencia entre canales Realtime, incluyendo cambio
  de playlist dirigido a una sola pantalla mientras las otras seguían activas.
- Mientras no existe el `panel`, el "claim" se simula a mano en el SQL Editor de
  Supabase — patrón reutilizado durante todo el desarrollo:

  ```sql
  insert into screens (company_id, device_uuid, name, status, current_playlist_id)
  select '<company_id>', device_uuid, '<nombre>', 'paired', '<playlist_id>'
  from pairing_codes
  where code = '<CÓDIGO>' and status = 'pending' and expires_at > now()
  on conflict (device_uuid) do update
  set status = 'paired', current_playlist_id = excluded.current_playlist_id;

  update pairing_codes set status = 'claimed', claimed_at = now()
  where code = '<CÓDIGO>' and status = 'pending';
  ```

- **Pendiente:** limpieza de `pairing_codes` con `status = 'pending'` ya vencidos —
  por ahora se borra a mano (`delete from pairing_codes where status = 'pending' and
expires_at < now();`); una solución automática (una sola fila pendiente por
  dispositivo, o `pg_cron`) queda para cuando exista el `panel`.

---

## 7. Reproducción y caché local (crítico, no opcional)

**Regla de oro: el contenido multimedia se descarga UNA sola vez por archivo, nunca en
cada ciclo de reproducción.**

Flujo:

1. Visor escucha evento de cambio (Realtime) sobre el schedule/playlist publicado de
   su pantalla.
2. Al recibir el evento, hace fetch solo de la **metadata** (qué archivos, orden,
   horario) — no del archivo pesado todavía.
3. Compara la metadata contra lo que ya tiene cacheado localmente (filesystem del
   dispositivo — en RN usar `react-native-fs` o similar; `localStorage` NO sirve para
   binarios/videos).
4. Descarga **solo** los archivos nuevos o modificados (diff), en background, sin
   interrumpir lo que se está reproduciendo actualmente.
5. Reproduce siempre desde el archivo local cacheado — nunca en streaming directo
   desde Supabase Storage en cada loop.

**Por qué esto es innegociable:** sin caché local, un video en loop 24/7 agotaría el
egress del plan gratuito en horas, y la pantalla dependería de tener internet estable
en todo momento (un corte de wifi dejaría la pantalla en negro).

**Websocket en idle es prácticamente gratis** (solo heartbeats) — el consumo real de
banda está 100% concentrado en la descarga de contenido nuevo, que según la operación
esperada (pocos cambios al mes) es mínimo.

**Backup de seguridad:** considerar un polling de baja frecuencia (ej. cada 5 min) como
red de seguridad adicional al Realtime, para el caso de que el websocket se caiga y no
reconecte silenciosamente. No reemplaza el mecanismo principal, es solo respaldo.

**✅ Implementado en `visor-web` (26 julio 2026, corregido a fondo el 27):** usa la
**Cache API** del navegador (`caches.open()`, `src/lib/mediaCache.js`) — no
`localStorage` (no sirve para binarios) ni Service Worker (no hace falta para este
caso). Nota para `apk` (React Native): ahí corresponde `react-native-fs`, no Cache API
(específica de navegador) — la lógica/regla es la misma, la implementación no se porta.

### 🔥 Incidente de egress (27 julio 2026) — 8.58 GB quemados en horas con 3 pantallas

La primera versión del caché degradaba a **servir la URL remota directo** cuando la
Cache API no estaba disponible. Eso no es una degradación aceptable: significa
**re-descargar el archivo completo en cada vuelta del loop, para siempre**. Un video de
20 MB loopeando cada 30 s son ~2.4 GB/hora **por pantalla**. Con 3 dispositivos de
prueba se pasó el límite de 5 GB/mes del plan free en un par de horas. Con 10 pantallas
serían ~17 TB/mes.

**Por qué el caché estaba apagado justo en las TVs:** `CacheStorage` es
**secure-context-only** (HTTPS o `localhost`) y existe recién desde **Chrome 40**.
Probando por `http://<ip-lan>` o en una TV vieja, `typeof caches === 'undefined'` y el
fallback entraba en silencio. **Es exactamente el mismo tipo de trampa que
`crypto.randomUUID` en la sección 3** — misma causa, mismo síntoma invisible.

**Reglas que salen de esto (innegociables, aplican también a `apk`):**

1. **Ningún camino de degradación puede terminar en descarga-por-loop.** La cascada es
   `memoria → disco → red (una sola vez)`. Si no hay caché en disco, igual se guarda un
   blob en memoria: el peor caso pasa a ser "una descarga por sesión", nunca por vuelta.
2. **Nunca mostrar la URL remota mientras se espera el blob.** Servir `item.url` como
   placeholder hacía que el `<img>`/`<video>` bajara el archivo por su cuenta, en
   paralelo al fetch del caché (doble descarga en frío) y en cada loop después.
   Preferir pantalla en negro un instante.
3. **`QuotaExceededError` de `cache.put` debe atraparse.** Antes se propagaba y mataba
   la resolución del resto de la playlist, dejando esos ítems remotos permanentemente.
4. **Deduplicar descargas en vuelo** — la precarga en background y el ítem que se va a
   reproducir pedían el mismo archivo a la vez.
5. **`cache.match(url, { ignoreVary: true })`** — Supabase Storage sirve por su CDN y
   devuelve headers `Vary`; sin esto un match legítimo puede fallar y disparar una
   re-descarga fantasma.
6. **Pedir `navigator.storage.persist()` al arrancar** — el Cache Storage es "best
   effort" y una TV de 1-2 GB corriendo 24/7 lo desaloja bajo presión de memoria.
7. **El overlay debe mostrar el estado real del caché** (contexto seguro, Cache API
   disponible, bytes descargados en la sesión, hits de disco/memoria, cuota). Sin esa
   visibilidad el modo degradado es indetectable hasta ver la factura.

**Regla operativa de pruebas:** probar en TVs **solo contra la URL HTTPS de Vercel**,
nunca `http://<ip-lan>:5173` ni `:4173`. En HTTP plano por IP no hay caché de medios
(ni `crypto.randomUUID`), así que cualquier prueba de consumo ahí no representa
producción y además quema egress real.

**✅ Resuelto (31 julio 2026):** `panel` sube los medios con `cacheControl: '31536000'`
(`useUploadMedia.ts`) — el `storage_path` es inmutable por archivo, así que el caché HTTP
del navegador sirve de red de seguridad bajo la Cache API. Ojo: el "Cached Egress" del
dashboard de Supabase es egress servido desde su CDN: **igual se factura**, no salva nada
por sí solo — lo que realmente evita el re-cobro es el caché del navegador del cliente.

**Nota de corrección (27 julio 2026):** una playlist con **un solo ítem** no
loopeaba — el índice `(0 + 1) % 1 = 0` no cambia de valor, así que nada disparaba el
reinicio. Fix en `Player.vue`: cuando el índice no cambia, se fuerza el reinicio a mano
(reset de `currentTime` + `.play()` para video, re-agendar el timer para imagen). Vale
la pena que el `panel` sepa que una playlist de un solo ítem es un caso válido y
soportado, no un estado raro.

### ✅ Validación en hardware real (28 julio 2026) — confirmado, no solo teórico

Tras aplicar la cascada de 3 niveles (memoria → disco → red una sola vez), se probó el
escenario exacto del incidente: un video en loop, en dos TVs reales (LG y Samsung nuevo,
ver matriz de hardware en sección 3), durante **más de una hora continua** cada una.

- **Overlay:** "Descargado en esta sesión" quedó clavado en el peso del archivo (11.4 MiB)
  durante toda la prueba, sin importar cuántas vueltas dio el loop.
- **Cruce con el dashboard de Supabase (ground truth, no solo el instrumento local):** el
  delta de "Cached Egress" entre mediciones coincidió, byte a byte, con lo que reportaba
  el overlay — nunca hubo una descarga fantasma que el overlay no viera.
- Una TV corrió toda la noche (sin apagado automático desactivado) y se apagó sola tras
  varias horas — **fue el timer de apagado del TV, no un fallo de la app** (ver hallazgo
  de auto-apagado más abajo). Otra corrió con el apagado automático desactivado a
  propósito, específicamente para sostener sesiones largas sin intervención.

**Conclusión:** la regla "nunca descargar en loop" queda validada empíricamente, no solo
implementada. Sigue pendiente probar el caso de cuota agotada por acumulación de varios
archivos pesados en un dispositivo de cuota chica (ver hallazgo de huérfanos en disco).

### 🐛 Bug de reproducción tras quitar el fallback remoto (28 julio 2026)

Al eliminar el fallback a `item.url` (regla 2 del incidente de egress), el `<video>`
quedó en **pantalla negra silenciosa** — el video nunca arrancaba, sin error visible. Causa:
`displaySrc.value = ...` es una asignación reactiva de Vue, no se aplica al DOM de
inmediato; llamar `videoEl.value.play()` en la misma función corría contra un `<video>`
que todavía tenía el `src` anterior (vacío). Fix en `Player.vue`: `await nextTick()`
antes de tocar el elemento, más `el.load()` explícito cuando el `src` cambió (algunos
navegadores de TV no recargan solos al cambiar el `src` de un elemento ya montado).

**Watchdog de reproducción agregado como red de seguridad:** si a los 10 s no llegó el
evento `playing`, se asume que el video no va a arrancar (códec no soportado, `blob:` no
reproducible — ver Samsung viejo en la matriz de sección 3) y se fuerza `advance()`. Una
pantalla de signage no puede quedarse negra en silencio indefinidamente en ningún
hardware; el overlay muestra el motivo exacto (`MediaError` code o rechazo de `play()`)
en el campo "Reproducción", clave para diagnosticar sin devtools en la TV.

### 🗑️ Huérfanos en disco (28 julio 2026)

La cascada de caché libera los blob URLs de memoria cuando cambia la playlist
(`pruneBlobUrls`), pero **no borraba nada del disco** — cada archivo reemplazado o
descartado quedaba en la Cache Storage del navegador para siempre. Con un cliente
cambiando contenido semana a semana durante meses, esos archivos huérfanos terminan
compitiendo por la misma cuota que necesita el contenido activo, y pueden gatillar el
mismo `QuotaExceededError` de la sección 3 sin que la playlist vigente sea pesada — la
causa sería basura acumulada, no el contenido actual.

**Fix:** `evictStaleDisk()` en `mediaCache.js`, llamado solo cuando cambia qué debería
estar cacheado (playlist republicada), nunca al desconectar o desmontar el player — una
reconexión rápida con la misma playlist debe poder reusar lo que ya hay en disco sin
volver a descargar todo. El disco queda siempre acotado al tamaño de la playlist vigente,
sin importar cuántos cambios de contenido hayan pasado antes.

### ⏻ Apagado automático del TV — gotcha operativo, no de software (28 julio 2026)

Una TV con el video corriendo se apagó sola tras varias horas sin que nadie tocara el
control remoto. **No es un bug de la app** — la mayoría de los Smart TVs traen un timer
de apagado automático (4h es común) pensado para uso doméstico, ciego al contenido en
pantalla: no sabe que un navegador en modo kiosco está reproduciendo a propósito.

**Acción de instalación (no de código):** desactivar explícitamente "Auto Power Off" /
"Eco - Apagado automático" / protector de pantalla en la configuración de cada TV antes
de dejarla en producción. Sin esto, cualquier pantalla instalada se va a apagar sola cada
cierto tiempo sin importar qué tan bien esté el software. Vale la pena agregarlo como
paso obligatorio del checklist de instalación cuando exista el `panel`.

### Contenido esperado en el piloto (28 julio 2026)

Definido con el equipo para calibrar la política de compresión pendiente (sección 12):
mayoría imágenes, videos ocasionales de **5-7 MB** (el peso típico de un promocional
hecho en Canva), tope de **~5 slides por playlist**. Probado también con un archivo de
**50 MB** (el máximo que permite el bucket, ver sección 5) para validar el caso límite de
cuota. Con estos tamaños, el consumo diario esperado por pantalla es trivial — el riesgo
real de cuota de disco (sección 3) aparece por acumulación de contenido viejo sin purgar
(ver huérfanos en disco arriba), no por el peso de una playlist puntual.

### Decisión de hardware para el piloto: box/stick con APK preinstalada, no navegador

El plan de despliegue para clientes reales es entregar un box o stick Android con la
**APK ya instalada**, no depender del navegador integrado del TV. Esto saca de la
ecuación toda la categoría de bugs encontrada en la matriz de hardware de la sección 3
(`blob:` no reproducible, cuotas de disco minúsculas o inconsistentes,
`performance.memory` no confiable) — `react-native-fs` no tiene el concepto de cuota de
navegador. El navegador integrado (`visor-web`, este repo) queda como camino para el
cliente cuyo TV no acepta box externo; la matriz de hardware de la sección 3 es la
referencia para saber si ese TV específico va a andar bien o no.

---

## 8. Modelo comercial (referencia, no bloqueante para el MVP técnico)

Dos tiers principales:

- **Self-serve:** cliente administra su propio contenido vía el panel. Precio de
  referencia: similar a Juuno (~$5 USD/pantalla/mes) + margen (~$1 USD más).
- **Full-managed:** Octalink diseña, sube y administra todo el contenido. Rango de
  precio conversado: ~$45 USD/mes para 1-5 pantallas, escalando hacia arriba; tier
  enterprise con precio conversado según cantidad. Incluye un máximo definido de
  contenido nuevo por semana (ej. un slide nuevo/semana) como parte del SLA.

Este modelo justifica por qué se construye plataforma propia en vez de usar un white
label de terceros: se necesita control total del flujo de trabajo interno de la agencia
(un dashboard donde Octalink administra múltiples clientes con distintos niveles de
acceso y SLA), algo que las herramientas self-serve de terceros no resuelven bien.

---

## 9. Scope del MVP (v1)

**Dentro de v1:**

1. ✅ Visor + pairing (código corto, ver sección 6) — implementado y validado en
   `visor-web` con 3 dispositivos reales simultáneos (2 Smart TVs + notebook)
2. ✅ CRUD de pantallas — implementado en `panel` (listar, vincular por código de
   pairing, editar nombre, eliminar en un solo paso, estado de conexión en vivo). Ver
   sección 14.
3. ✅ Upload de contenido — implementado en `panel` (subir con optimización a WebP,
   listar, eliminar). Ver sección 14.
4. ✅ CRUD de playlists — implementado en `panel`: crear, agregar/quitar ítems,
   reordenar (drag and drop), editar duración por ítem, publicar. Ver sección 14.
5. Schedule (una playlist en una ventana horaria recurrente por día de semana, encima
   de una playlist base) — **pendiente de implementar, pero el diseño completo ya está
   acordado y escrito**: ver "📐 Diseño acordado para Schedule" en la sección 14 antes
   de retomarlo. Toca `panel` **y** los visores (`weluk-browser` / `apk`), porque el
   cambio de playlist por hora lo resuelve la pantalla, no el servidor. La asignación
   simple (sin horario) de una playlist a una pantalla **ya existe** desde el dialog
   "Asignar pantallas" (sección 14) — ya no hace falta SQL manual para eso.
6. ✅ Sync al player (Realtime + draft/publish, ver secciones 5 y 6) — implementado y
   validado: cambio de playlist y republicación de contenido, con aislamiento
   confirmado entre pantallas concurrentes
7. ✅ Overlay de diagnóstico en el visor: identidad de pantalla + playlist actual,
   `device_uuid`, resolución, memoria (heap usado/total), user agent, botón de refresh
   manual, botón fullscreen, listar/vaciar caché, disconnect real (con vuelta a
   pairing en vivo, sin recargar)

**Fuera de v1 (deliberado):**

- Integraciones externas (Instagram, Canva, YouTube, RSS, etc.)
- Editor de diseño online (el contenido llega ya diseñado externamente)
- Zonas / split-screen
- Multi-tenant público (sí se necesita a nivel interno de Octalink vía RLS, pero no
  como feature expuesta al cliente)
- Apps nativas Tizen/LG (etapa futura post-validación)

---

## 10. Referencias técnicas revisadas (no para copiar, sí para inspirar decisiones)

- **Juuno** (`juuno.co`) — competidor SaaS validado, referencia directa de UX de
  pairing (código corto + URL de activación), overlay de diagnóstico en el visor
  (identidad de pantalla, memoria, user agent, cache management, disconnect), y
  confirmación de que Vue funciona bien como stack de visor en Smart TVs reales.
- **Anthias** (ex-Screenly OSE, `github.com/Screenly/Anthias`) — proyecto open source
  de signage más popular en GitHub. Referencia de arquitectura: separación estricta
  servidor/viewer como procesos distintos, cola async (Celery) para tareas pesadas
  como descargas, WebSocket + Redis para push de eventos (no polling), y soporte
  multi-hardware con un solo backend/panel y múltiples "streams" de build según
  dispositivo.
- **FreeKiosk** (`github.com/muhametismailii/FreeKiosk` o similar) — app de modo
  kiosco Android open source en React Native + WebView, mismo stack que la APK
  propia — referencia directa para el manejo de pantalla completa, auto-arranque,
  y supervivencia a reinicios.

---

## 11. Plan de pruebas recomendado — por dónde empezar

**Cuestionamiento del equipo:** no construir el panel completo primero. El panel es la
parte con **menor incertidumbre técnica** (CRUD de Vue contra Supabase — ya se ha hecho
en otros proyectos como RHL y QForest). El riesgo real y lo que vale la pena validar
primero es: pairing + Realtime + caché local + comportamiento en hardware real.

**Orden recomendado:**

1. **Visor web mínimo (Vue) + Supabase Studio manual** — sin construir panel propio
   todavía. Crear las tablas (`screens`, `pairing_codes`, `content`, `playlists`,
   `schedules`) directo en Supabase Studio, y simular el "panel admin" editando filas
   a mano ahí mismo. Esto valida el pairing, el websocket de Realtime, y la lógica de
   caché con una fracción del esfuerzo de construir un panel completo.
2. **Probar en hardware real**: el Onn con el visor cargado, y el navegador nativo de
   al menos una Smart TV real. Confirmar versión de Chromium, persistencia de
   almacenamiento entre reinicios, y si el modo pantalla completa real es alcanzable.
3. **Recién con el visor y el pairing confirmados en hardware real**, construir el
   panel — en ese punto es trabajo mecánico de bajo riesgo, no exploratorio.

---

## 12. Preguntas abiertas / pendientes de definir

- ~~Largo y alfabeto exacto del código de pairing~~ — **resuelto**: 5 caracteres,
  alfabeto `23456789ABCDEFGHJKMNPQRSTUVWXYZ`.
- ~~Detalle exacto del overlay de diagnóstico del visor~~ — **resuelto**, ver sección 9.
- Qué pasa en el `panel` cuando alguien escribe un código inválido o expirado (UX de
  error) — sigue pendiente, es trabajo del `panel` (no existe todavía).
- Política formal de compresión/limpieza de contenido para no tocar el límite de
  1 GB de storage — ver "Contenido esperado en el piloto" en sección 7 para los tamaños
  reales acordados (imágenes + videos de 5-7 MB, tope 5 slides).
- Definir si el "Publicar cambios" es por pantalla individual o permite batch
  (varias pantallas de un mismo cliente a la vez).
- Limpieza automática de `pairing_codes` vencidos (hoy manual, ver sección 6).
- Validar en hardware real: **Smart TV — resuelto para 3 dispositivos** (matriz completa
  en sección 3: Samsung viejo Tizen 4 no reproduce `blob:` en `<video>`, LG NetCast y
  Samsung Tizen 6 sí, con cuotas de disco muy distintas entre sí). **Onn (box Android) —
  sigue pendiente**, nunca se probó — aunque su relevancia baja con la decisión de usar
  box/stick con APK preinstalada (sección 7) en vez del navegador integrado.
- Checklist de instalación por pantalla — nuevo, sale de las pruebas del 28 julio:
  desactivar el apagado automático del TV (ver sección 7), confirmar que el `panel` sepa
  qué modelos de TV quedan fuera del piso soportado por navegador (sección 3).
- ~~`companies.is_active` sin chequear en RLS~~ — **resuelto (30 julio 2026)**, ver
  sección 14 (`auth_active_company_id()` + overlay en `AdminLayout.vue`).

---

## 13. Brechas conocidas: documentado vs. implementado

> Distinto de la sección 12 ("Preguntas abiertas"): ahí van decisiones de diseño sin
> resolver. **Acá van casos donde este CLAUDE.md describe algo como si ya existiera,
> pero al revisar el código real de ese repo no está** — para no asumir que algo
> funciona en otro repo solo porque quedó documentado acá. Revisar esta sección cada
> vez que se pregunte "¿qué falta?".

### `weluk-browser` no implementa Presence ni escribe `last_seen_at` (28 julio 2026)

- **Documentado** (sección 5 de este mismo archivo): el visor usa Supabase Realtime
  Presence (`channel.track(...)`, evento `presence.sync`) para que el panel sepa en
  tiempo real si una pantalla está conectada, y `screens.last_seen_at` queda como
  respaldo histórico.
- **Real:** revisado el código de `weluk-browser` (`App.vue`, `Pairing.vue`,
  `Player.vue`, `Overlay.vue`, repo `github.com/OctalinkCL/weluk-browser`) — no hay
  ningún `.track(`, ningún handler de `presence`, y `last_seen_at` no se escribe en
  ningún lado. Los canales Realtime que sí existen (`pairing-${deviceUuid}`,
  `playlist-${playlistId}`, `screen-${deviceUuid}`) son suscripciones a cambios de
  Postgres (pairing claim, publicación de playlist, cambio de `status`), no Presence.
- **Impacto en `panel`:** la columna "Última conexión" en `ScreensView` siempre va a
  mostrar "Nunca", incluso para pantallas conectadas ahora mismo, hasta que esto se
  implemente en `weluk-browser`. No es un bug de `panel` — el dato de origen no existe.
- **Para resolverlo (trabajo en `weluk-browser`, no en `panel`):** agregar
  `channel.track(...)` al canal `screen-${deviceUuid}` que ya existe, y opcionalmente
  un `UPDATE screens SET last_seen_at = now()` periódico o al desconectar.
- **✅ Resuelto (30 julio 2026):** `weluk-browser` agregó el `channel.track(...)` (una
  sola vez, al confirmar `SUBSCRIBED`, no en loop) y `weluk-panel` agregó el lado que
  escucha (`useScreenPresence.ts`, columna "Conexión" en `ScreensView`) — ver detalle en
  sección 5. Validado en tiempo real en ambos sentidos: online al conectar, offline al
  cortar señal/apagar, y también al eliminar la pantalla (interactúa bien con el fix de
  delete de la sección 14). `last_seen_at` sigue sin escribirse — esa parte puntual de
  la brecha sigue abierta.

---

## 14. Estado y convenciones del `panel` (29 julio 2026)

> Sección específica del repo `weluk-panel`. Leer antes de retomar el desarrollo,
> sobre todo al cambiar de máquina o de sesión.

### Arranque en una máquina nueva

1. `pnpm install` (proyecto migrado de npm a pnpm — fijado en `package.json` vía `packageManager`, no usar `npm install`/`yarn`)
2. **Crear `.env` a mano** — está en `.gitignore`, no viaja con el repo. Copiar
   `.env.example` y llenar con las credenciales del proyecto Supabase real
   (Project Settings → API):
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
   Sin esto la app **no arranca**: `createClient('', '')` lanza
   `"supabaseUrl is required."` y queda la pantalla en blanco.
3. `pnpm dev`
4. Login con un usuario que tenga fila en `profiles` con `role = 'superadmin'`.

### El primer superadmin se crea a mano (huevo y gallina)

`supabase/functions/invite-user` exige que quien llama ya sea superadmin (además, invita
por email — no sirve para el primer usuario que no tiene a nadie que lo invite), así que
el primero se crea manualmente: Auth → Add user en Studio, copiar el UID, y luego:

```sql
insert into profiles (id, company_id, role, full_name)
values ('<uid-de-auth>', null, 'superadmin', 'Nombre');
```

`company_id = null` es obligatorio para superadmin (es la señal que usa
`is_superadmin()` y el resto de las policies).

### Estructura y convenciones

Módulos verticales, misma forma que `client-movefactory-webapp` (repo hermano del
equipo, referencia de estructura):

```
src/
  modules/<feature>/
    FeatureView.vue          # página
    components/              # solo de este módulo
    composables/useX.ts      # acceso a datos + estado
    lib/                     # helpers del módulo
  layouts/                   # AuthLayout, AdminLayout, CompanyDetailLayout
  router/                    # index + auth.routes + superadmin.routes + guards + role-homes
  stores/auth.ts             # user, profile, role, isAuthenticated
  types/                     # un archivo por entidad, derivado de lib/database.types.ts
```

Reglas acordadas, **no romper sin preguntar**:

- **Solo componentes de shadcn-vue.** Nada de inventar componentes propios ni instalar
  librerías de UI. Si falta algo, se pregunta antes.
- **Ninguna dependencia nueva sin avisar.** Ojo: `npx shadcn-vue add <x>` puede meter
  paquetes npm en silencio (`add table` intentó instalar `@tanstack/vue-table`, que no
  usábamos y hubo que sacar). **Revisar el diff de `package.json` después de cada
  `shadcn-vue add`.**
- **Los tipos se derivan de `src/lib/database.types.ts`**, no se escriben a mano — así
  no se desincronizan del `.sql`. Cuando hay un `check constraint` de texto (roles,
  status, type), se hace narrowing con `Omit<..., 'campo'> & { campo: Union }`.
- **Toda escritura encadena `.select()` y valida `data.length > 0`.** Si es 0, RLS
  bloqueó en silencio — tratarlo como error (ver gotcha de la sección 4).
- Verificación antes de dar algo por listo: `npx vue-tsc --build` limpio + probar el
  flujo real en el navegador contra Supabase.

### Qué está implementado

- **Auth**: login/logout real, `stores/auth.ts`, guard por rol, redirección por
  `role-homes` (`superadmin` → `admin-companies`, `company_admin` → `company-screens`).
- **Companies**: listar, crear, editar nombre, habilitar/deshabilitar (`is_active`).
- **Company detail** (`/admin/companies/:id`, solo `superadmin`) con tabs: **Screens |
  Playlists | Media | Usuarios**.
- **Usuarios**: invitar `company_admin` por email desde el tab Usuarios de una company
  (`supabase/functions/invite-user`, primer uso de `supabase.functions.invoke` en el
  panel). El usuario define su propia contraseña vía el link del mail
  (`/set-password`, `authStore.updatePassword`) — no hay contraseña manual. Falta
  editar/eliminar usuarios (la tabla `profiles` hoy solo tiene policies de `select`,
  ver sección 12).
- **Screens**: listar, vincular por código de pairing (reemplaza el SQL manual de la
  sección 6), editar nombre, **eliminar en un solo paso** (sin "Desconectar" previo —
  ver el gotcha cross-repo más abajo sobre por qué esto requirió un fix en
  `weluk-browser`, no solo en el panel), estado de **conexión en vivo** (Presence, punto
  verde/gris — ver sección 5). Lista también la playlist asignada a cada pantalla (solo
  lectura).
- **Playlists**: listar, crear (navega directo al detalle), ver ítems, agregar/quitar
  ítems, publicar, **eliminar** (con warning si hay pantallas usándola —
  `useDeletePlaylist.getScreensUsing`). Badge de estado: Borrador / Cambios sin
  publicar / Publicada.
- **Reordenar ítems (drag and drop) y editar duración por ítem**: implementado en
  `PlaylistDetailView.vue` con `vue-draggable-plus` (shadcn-vue no trae componente
  propio de sortable — es la librería estándar de la comunidad, envuelve SortableJS).
  Arrastrar reescribe `order_index` de todos los ítems (`useReorderPlaylistItems`); la
  duración es un `Input` numérico que escribe en `playlist_items.duration_seconds`
  (`useUpdatePlaylistItem`), el override opcional que ya existía en el schema pero
  nunca se editaba desde la UI. Al subir un video (`useUploadMedia.ts`), ahora se lee
  su duración real (`<video>` en memoria + `loadedmetadata`) y se guarda en
  `media.duration_seconds` en vez del default fijo de 8s que antes se aplicaba también
  a video (bug/oversight — el comentario del `.sql` siempre dijo "default para
  imágenes"). Requirió agregar la policy de `UPDATE` de `company_admin` sobre
  `playlist_items` en `weluk-schema.sql` (no existía, solo select/insert/delete —
  mismo patrón de "RLS silenciosa" de la sección 4). **Cierra también el hueco del lado
  del visor**: `weluk-browser` leía `duration_seconds` para video pero no lo usaba (el
  avance de video solo dependía del evento nativo `@ended`, ignorando cualquier
  duración configurada) — ya corregido ahí también.
- **Asignar pantallas a una playlist**: dialog "Asignar pantallas"
  (`AssignScreensDialog.vue`, botón en `PlaylistDetailView`) — lista plana de las
  pantallas de la company (sin árbol/carpetas, decisión de UX explícita) con
  "Seleccionar todas" + checkbox por pantalla; `useAssignPlaylistScreens.assignScreens`
  hace batch-update de `screens.current_playlist_id` (asigna las marcadas, limpia a
  `null` las que se destildan). El botón "Publicar" de la playlist ahora está
  deshabilitado (con texto explicando por qué) si no tiene ítems o no tiene ninguna
  pantalla asignada. **Cierra el ciclo completo del producto** — ya no hace falta SQL
  manual para esto. Ver gotcha de auto-publish más abajo, sobre por qué este dialog
  también publica la playlist si estaba en borrador.
- **Media**: biblioteca por company. Subir (con optimización a WebP), listar, eliminar.
  Vive en dos superficies que comparten el mismo componente (`MediaGrid.vue`): el tab
  Media (administrar) y un dialog picker dentro de la playlist (elegir). Decisión de UX:
  ambas superficies tienen **las mismas capacidades** (subir y borrar disponibles en las
  dos); el modo picker solo *suma* la acción de agregar — mismo criterio que la Media
  Library de WordPress.
- **Thumbnail de video + límite de subida bajado a 15 MB (31 julio 2026):** al subir un
  `.mp4`, `useUploadMedia.ts` genera un frame (`videoThumbnail.ts` — `<video>` en memoria,
  seek a 0.5s, `canvas.drawImage` → WebP, mismo patrón client-side que ya usaban
  `imageOptimize.ts`/`videoMetadata.ts`, sin librerías nuevas) y lo sube al bucket como un
  archivo aparte, guardando la ruta en `media.thumbnail_path` (columna nueva, nullable).
  Es best-effort: si falla la captura o la subida del thumbnail, el video igual se
  registra con `thumbnail_path = null` — nunca bloquea la subida real. `MediaGrid.vue` y
  `PlaylistDetailView.vue` muestran ese frame en vez del ícono genérico de video cuando
  existe; los videos subidos antes de este cambio se quedan con el ícono genérico
  (no hay backfill retroactivo, mismo criterio incremental del resto del proyecto).
  `useDeleteMedia.ts` borra `thumbnail_path` junto con `storage_path` al eliminar (si no,
  queda huérfano en Storage — mismo tipo de fuga que documenta la sección 7 para el
  visor) y el chequeo de éxito del borrado pasó de `length === 0` a `length <
  pathsToRemove.length`, para no dejar pasar en silencio un borrado parcial (borra el
  video pero falla el thumbnail) — mismo patrón de "RLS/Storage silenciosa" de la
  sección 4. De paso, el cap de subida bajó de 50 MB a 15 MB (`MAX_SIZE_BYTES` en
  `useUploadMedia.ts`, más el `file_size_limit` propio del bucket `media` en Supabase —
  **no** el "Global file size limit" del proyecto, que en el plan free queda fijo en
  50 MB y pide plan Pro para subirlo; el límite *por bucket* sí se puede bajar por debajo
  del global sin Pro, vía "Edit bucket" → "Restrict file size"). Motivo: el contenido real
  esperado son imágenes WebP livianas y videos de 5-7 MB (sección 7) — 15 MB deja ~3x de
  margen y protege mejor la cuota de 1 GB del plan free que el default de 50 MB.
  Requiere `alter table media add column thumbnail_path text;` corrido a mano en el
  proyecto real antes de que esto funcione (ver recordatorio de `.sql` al final de esta
  sección).
- **Thumbnail también para imágenes + preview de playlist en `ScreensView` (31 julio
  2026, después de lo anterior):** el generador de thumbnails de video se refactorizó a
  una primitiva compartida (`resizeToWebp.ts` — escala por el lado más largo, dibuja en
  canvas, exporta a WebP) usada por `optimizeImage` (1920px, el original que sigue
  siendo lo que consume el player), la nueva `createImageThumbnail` (480px, mismo
  tamaño que ya usaba video) y `captureVideoThumbnail`. De paso corrigió un bug real
  que apareció al unificar: el thumbnail de video escalaba solo por ancho, así que un
  video vertical salía deforme/desproporcionado — ahora escala por el lado más largo,
  igual que las imágenes. `useUploadMedia.ts` ahora genera thumbnail también al subir
  una imagen (antes solo video), mismo criterio best-effort (si falla, `thumbnail_path`
  queda `null`, nunca bloquea la subida). Los call sites de render (`MediaGrid.vue`,
  `PlaylistDetailView.vue`) pasaron de ramificar por `type` a `thumbnail_path ??
  storage_path` — las imágenes viejas sin thumbnail caen solas al original sin código
  extra, sin backfill retroactivo (mismo criterio incremental del resto del proyecto).
  `useDeleteMedia.ts` no necesitó cambios: ya limpiaba `thumbnail_path` sin mirar el
  tipo. Motivo del cambio: no es ahorro de egress (`cacheControl: 31536000` ya lo cubre
  para visitas repetidas, ver sección 7) sino **tiempo de carga en frío** — la primera
  vez que se abre el tab Media o el detalle de una playlist, antes se bajaban imágenes
  de 1920px para pintar cards chicas (~6 MB para 20 archivos); con thumbnail son ~700
  KB. — **`ScreensView.vue`** suma, en la misma tabla (sin cards, sin conteo de slides,
  decisión explícita para mantener el scope chico), un thumbnail de 32px en la celda
  Playlist: `useScreens.ts` extiende el `select` existente con
  `playlist_items(order_index, media(thumbnail_path))` anidado — sigue siendo una sola
  request, sin costo de DB adicional (Supabase no cobra por complejidad de query, solo
  egress/storage/conexiones). `screenThumbnailPath()` toma cualquier ítem que tenga
  `thumbnail_path` (no importa cuál — es solo un vistazo, no una preview fiel de lo
  publicado) y cae al ícono genérico si la playlist no tiene ítems o son todos de antes
  del generador de thumbnails — **nunca** al original de 1920px, que sería descargar
  justo lo que este cambio evita. **Caveat de producto a tener presente:** el thumbnail
  sale de `playlist_items` (el borrador), no de `published_at` — si alguien reordena o
  cambia contenido sin publicar, la miniatura puede no coincidir con lo que la TV está
  mostrando ahora mismo. Aceptado a propósito para este alcance (decisión explícita:
  "no importa qué slide se muestre"), pero si se malinterpreta como "esto es lo que se
  ve en vivo" habría que resolverlo con algo más caro (snapshot publicado, sección 14
  "Qué falta"). — **Evaluado y descartado (mismo día):** llevar la asignación de
  playlist a un `Select` inline en esta misma fila (ver referencia visual de Juuno, que
  combina playlists y schedules en un solo dropdown). Motivo del descarte: la capacidad
  ya existe del lado inverso (`AssignScreensDialog`, playlist → pantallas) y no hay
  nada bloqueado; sumar el camino inverso solo para conveniencia hubiera duplicado la
  lógica de auto-publish (`useAssignPlaylistScreens.ts`, el gotcha de RLS de más abajo)
  en un segundo composable, y el diseño del picker cambia de nuevo cuando llegue
  Schedule (pendiente en la sección 9, punto 5). Se prefirió no construirlo dos veces.
- **Panel de `company_admin` (real, ya no placeholder)** — rutas propias en
  `router/company-admin.routes.ts`, montadas bajo `/company/*` con el mismo
  `AdminLayout` que `superadmin`: `company-screens` (home), `company-playlists`,
  `company-playlist-detail`, `company-media`. Reusa exactamente los mismos módulos y
  componentes que usa `superadmin` dentro del detalle de company (`ScreensView`,
  `PlaylistsView`, `PlaylistDetailView`, `MediaView`) — no hay código duplicado por rol.
  El scoping por company se resuelve en cada vista con
  `route.params.id ?? authStore.profile.company_id` (el primero cuando `superadmin`
  navega el detalle de una company, el segundo cuando entra `company_admin`); la
  seguridad real la hacen las policies RLS de `company_admin`, no este fallback en el
  cliente. `NavMain.vue` arma el sidebar según `authStore.role` (items separados por
  `roles: Role[]` en cada entrada). Policies de RLS de `company_admin` para `media`,
  `playlists`, `playlist_items`, `screens` y `storage.objects` ya están en
  `weluk-schema.sql` (bloques "company_admin ve/crea/actualiza/elimina...") — ver el
  gotcha de `is_active` sin chequear en sección 12 — **ya resuelto**, ver más abajo.

### ✅ `is_active` ahora sí se chequea en RLS (30 julio 2026)

En vez de tocar cada policy de `company_admin` una por una, se agregó una función helper
nueva, `auth_active_company_id()` — igual a `auth_company_id()` pero devuelve `NULL` si
`companies.is_active = false`. Se reemplazó `auth_company_id()` por esta nueva función en
**todas** las policies de contenido de `company_admin` (`media`, `playlists`,
`playlist_items`, `screens`, `storage.objects`) — deshabilitar una company corta el acceso
real en un solo lugar (la función), sin mantener 18 policies sincronizadas a mano.

**A propósito, la policy de `companies` no cambió** (sigue usando `auth_company_id()` sin
chequear `is_active`): si también dependiera de la versión "activa", un `company_admin`
deshabilitado no podría ni leer su propia fila de `companies` para saber que fue
deshabilitado, y el panel no tendría cómo explicarle qué pasó.

**UI agregada:** `AdminLayout.vue` (compartido por `superadmin` y `company_admin`) ahora
chequea, solo cuando `role === 'company_admin'`, el `is_active` de su propia company
(`useCompanyStatus.ts`) y muestra un overlay de pantalla completa ("Cuenta deshabilitada")
si está apagada. **Importante: este overlay es solo un aviso, no la seguridad real** — si
alguien lo saca del DOM con el inspector del navegador, el resto de la UI sigue sin datos
igual, porque las policies de RLS (vía `auth_active_company_id()`) devuelven cero filas
para esa company sin importar qué muestre el frontend. Un `superadmin` navegando el
detalle de una company deshabilitada (para reactivarla) nunca ve este overlay — el chequeo
es explícitamente solo para `company_admin` viendo su propia company.

### Qué falta (en orden sugerido)

1. Schedule por horario/fecha (punto 5 de la sección 9) — **diseño ya acordado, ver
   subsección siguiente**.
3. "Cancelar cambios" en una playlist — **evaluado y pospuesto a propósito**: hoy es
   imposible, porque `playlist_items` es la única fuente de verdad y no se guarda
   ningún snapshot de lo publicado. La opción barata, si se necesita, es una columna
   `published_snapshot jsonb` en `playlists` que se llena al publicar (una columna, no
   una tabla de versiones — respeta el "sin historial" de la sección 5).

### 📐 Diseño acordado para Schedule (1 agosto 2026) — decidido, NO implementado

> **Nada de esto existe todavía en el código.** Es el resultado de una sesión de análisis
> completa; queda escrito para no volver a derivarlo desde cero cuando se retome. Sujeto
> a revisión como todo lo demás, pero es el punto de partida acordado.

**Caso de uso real que hay que resolver** (definido con el equipo, no hipotético): una
playlist "Desayuno" que corre todos los días de 08:00 a 10:00, y fuera de esa ventana una
playlist general. Otro ejemplo del mismo tipo: una playlist solo para viernes por la
noche. Es decir: **una ventana horaria recurrente semanal encima de una playlist base**,
no un calendario de eventos con fechas.

#### Modelo: base + excepciones (no una entidad "Schedule" reutilizable)

`screens.current_playlist_id` **no cambia de estructura** — cambia de significado: pasa de
ser "la playlist activa" a ser **"la playlist por defecto"**, el piso que se reproduce
cuando ninguna regla aplica. El `AssignScreensDialog` que ya existe sigue funcionando sin
tocarlo. Encima de eso, una tabla nueva de reglas colgada de la pantalla:
`playlist_id`, `screen_id`, días de la semana (array 0-6), `start_time`, `end_time`.
Sin fechas, sin recurrencia tipo iCal, sin excepciones por fecha.

**Evaluado y descartado: el modelo de Juuno**, donde `Schedule` es una entidad de primera
clase al mismo nivel que `Playlist` (se crea, se nombra, y se le asigna a la pantalla en
el mismo slot donde iría una playlist). Motivo del descarte: en ese modelo **no existe
"la general"** — si la pantalla apunta a un Schedule, ese Schedule tiene que cubrir las
168 horas de la semana o quedan huecos. Expresar "Desayuno de 8 a 10, el resto general"
requeriría ~21 reglas artificiales (3 bloques × 7 días) en vez de **una sola**. El caso de
uso real pide literalmente base + excepciones; conviene construir eso.

- **Lo que se pierde:** reutilización. Un cliente con 5 pantallas iguales carga la
  programación 5 veces. Se compensa con un botón "Copiar programación a otras pantallas"
  que reusa el patrón de checkboxes del `AssignScreensDialog`. A la escala del piloto
  (1-5 pantallas por cliente) no es un problema real.
- **No cierra la puerta:** si algún día hace falta reutilizar de verdad, las reglas ya
  viven en su propia tabla — solo cambia de quién cuelgan (agregar un `schedule_id` que
  las agrupe). Es aditivo, no un rediseño.

#### Quién ejecuta el cambio: la pantalla, no el servidor

**No hay cron, ni `pg_cron`, ni Edge Function agendada, ni ningún servicio permanente.**
El visor (`weluk-browser` / `apk`) resuelve localmente:

1. Al arrancar lee la pantalla + su playlist por defecto + sus reglas + las playlists
   referenciadas por esas reglas.
2. Precachea el contenido de **todas** ellas por adelantado (aplica igual la cascada de
   la sección 7 — el contenido del turno siguiente ya está en disco antes de la hora).
3. Un `setInterval` de ~30 s evalúa qué regla aplica ahora; si cambió respecto a la
   vuelta anterior, cambia de playlist. Como ya está cacheado, el cambio es instantáneo.
4. Cuando el admin edita las reglas, el visor se entera por el canal Realtime que ya
   mantiene abierto (mismo mecanismo que `published_at`) y las recarga.

**Evaluado y descartado: que un cron server-side haga `UPDATE screens SET
current_playlist_id`.** Era tentador porque no requeriría tocar los dos repos de visor
(ya reaccionan a ese `UPDATE` por Realtime), pero rompe el principio de la sección 7: una
TV sin internet un viernes a las 20:00 nunca se enteraría del cambio y se quedaría con la
general toda la noche. Además no podría precachear con antelación (recién a la hora del
cambio sabría qué bajar → pantalla negra mientras descarga), y sería un punto único de
falla silencioso para **todas** las pantallas a la vez.

#### ⚠️ Interacción con el caché: `evictStaleDisk()` hay que ajustarlo sí o sí

La regla de oro de la sección 7 (nunca descargar en loop) **no se toca**: el player sigue
reproduciendo siempre desde el blob local, y cambiar de Desayuno a General a las 10:00 es
cambiar de un blob cacheado a otro, sin red de por medio.

Lo que **sí** cambia es la definición de *qué debería estar cacheado*: hoy es "la playlist
vigente" (singular), con schedule pasa a ser "la playlist por defecto **más** todas las
playlists alcanzables por alguna regla". Si `evictStaleDisk()` (en `mediaCache.js` de
`weluk-browser`) queda como está, cada cambio de turno borra del disco la playlist que
acaba de salir, y al día siguiente se vuelve a descargar entera:

- 08:00 entra Desayuno → se descarga → 10:00 entra General → `evictStaleDisk()` borra
  Desayuno → 08:00 del día siguiente Desayuno se descarga de nuevo. Todos los días.

No es el desastre por-loop del incidente de egress (son ~3 descargas diarias por pantalla,
no miles), pero es una fuga permanente de contenido ya bajado y **el código seguiría
"funcionando" perfecto** — solo gastando. `evictStaleDisk()` tiene que recibir el
**conjunto** de archivos alcanzables, no los de una sola playlist.

Efectos secundarios menores del mismo cambio: (a) el working set en disco pasa de una
playlist a N — con los tamaños del piloto son ~50-100 MB, que en la TV de 80 MiB de la
matriz de la sección 3 ya raspa (la decisión de box Android + APK lo neutraliza, pero para
`visor-web` es un techo real); (b) el precache de una regla tiene que ocurrir **antes** de
su hora, no al llegar — lógica nueva pero aditiva, no rompe nada existente.

**El riesgo #1 de resolverlo en el cliente es el reloj del dispositivo** — una TV con la
hora corrida rota el contenido mal y nadie lo nota. Mitigación obligatoria: calcular el
offset contra la hora del servidor al conectar y usar `Date.now() + offset` en todas las
evaluaciones, nunca el reloj crudo. **El overlay del visor debe mostrar ese offset** —
mismo criterio de visibilidad que se aplicó con el estado del caché (sección 7).

#### UI: vista semanal sin eje de horas

Una sección dentro del **detalle de pantalla** (ver "costo real" abajo). Siete columnas,
una por día, con chips ordenados por hora y la playlist por defecto abajo de todo en gris
(comunica que es el piso, no un evento más). Click en un chip lo edita; click en el vacío
de una columna abre el dialog con ese día ya marcado. **Sin arrastrar, sin eje de horas.**

El eje de horas (08:00, 09:00, 10:00…) de la referencia visual de Juuno es justamente la
parte cara — obliga a posicionar bloques por píxel, resolver solapamientos visuales y
manejar drag targets. Chips en columna ordenados por hora dan casi toda la legibilidad
por una fracción del trabajo.

El dialog de crear/editar regla: select de playlist, tres botones de preset
(`Todos` / `Lun a Vie` / `Fin de semana`) sobre una fila de 7 checkboxes, y hora
inicio/fin. Los presets resuelven el 90% de los casos con un click; los checkboxes quedan
para el caso raro ("solo martes"). No hay que elegir entre select y checkboxes — el
preset es solo un atajo que marca los checkboxes.

**No hay ítem "Programación" en el sidebar, no se crea ni se nombra ni se asigna.**
Conceptualmente la programación es *una propiedad de la pantalla*, como su nombre — el
usuario pasa de pensar "esta pantalla muestra X" a "esta pantalla muestra X, salvo los
viernes a la noche". No hay un objeto nuevo que aprender.

#### Costo real y decisiones chicas pendientes

**El trabajo grueso no son las reglas, es que no existe un detalle de pantalla.**
`ScreensView.vue` es una tabla plana con dos dialogs; la ruta
`/c/:companySlug/screens/:id` hay que crearla y probablemente sea más trabajo que el
schedule en sí. Alternativa barata para una primera versión: meter la vista semanal en un
dialog desde la tabla — mitad del trabajo, migrable a página después sin rehacer nada.
De todos modos esa página es donde naturalmente terminarían el estado de conexión, el
`device_uuid` y todo lo que hoy no tiene dónde vivir.

Tres decisiones que quedan abiertas para cuando se implemente:

- **Zona horaria:** guardarla en `companies` (o `screens`) y evaluar en esa tz.
  `America/Santiago` tiene DST — no usar un offset fijo ni la tz del dispositivo.
- **Horarios que cruzan medianoche** (22:00 → 02:00): si no hace falta, el validador
  exige `fin > inicio` y es un caso menos.
- **Solapamiento:** lo más limpio es no permitir guardar dos reglas que se pisen el mismo
  día en la misma pantalla, y avisarlo al guardar — evita tener que inventar prioridades.

### 🐛 Gotcha de RLS: asignar una pantalla a una playlist en borrador rompía el visor (30 julio 2026)

Al construir el dialog "Asignar pantallas" (ver arriba), la primera versión solo hacía
`UPDATE screens SET current_playlist_id = ...` — sin tocar `published_at`. Resultado:
si se asignaba una pantalla a una playlist que todavía estaba en borrador, la TV
mostraba en el overlay/consola `"Cannot coerce the result to a single JSON object"` y
nunca cargaba contenido.

**Causa:** la policy de `anon` sobre `playlists` (`weluk-schema.sql`) es
`using (published_at is not null)` — el visor, que opera sin sesión, directamente **no
puede leer una playlist en borrador**, ni con error explícito: RLS le filtra la fila a
cero resultados. El visor hace ese fetch con `.single()` (PostgREST), y pedir un solo
objeto JSON sobre un resultado de 0 filas es exactamente el error `PGRST116` que se ve
como `"Cannot coerce the result to a single JSON object"`. Mismo patrón de "RLS
silenciosa" ya documentado en la sección 4, pero del lado del visor en vez del panel.

**Por qué no había aparecido antes:** la asignación históricamente se hacía a mano por
SQL (sección 6) siempre contra las playlists de prueba sembradas, que ya tenían
`published_at` seteado desde el principio (sección 5). Recién con este dialog un
`company_admin`/`superadmin` real pudo asignar una pantalla a una playlist recién
creada y todavía sin publicar — ahí se disparó.

**Fix aplicado:** `useAssignPlaylistScreens.assignScreens` ahora recibe el
`published_at` actual de la playlist; si es `null` y se va a asignar al menos una
pantalla nueva, primero hace `UPDATE playlists SET published_at = now()` (validando con
`.select()` que RLS no lo haya bloqueado, mismo criterio de la sección 4) y **recién
después** actualiza `screens.current_playlist_id` — nunca al revés, para no dejar ni un
instante una pantalla apuntando a algo ilegible. El dialog avisa esto explícitamente:
"Esta playlist está en borrador — se publica automáticamente al guardar la asignación."
Decisión de producto (no solo técnica): se evaluó bloquear el guardado hasta publicar a
mano, pero se eligió auto-publicar porque agrega cero fricción y el dialog ya deja claro
qué va a pasar.

### Triggers agregados (ver `weluk-schema.sql`)

- `trg_notify_playlists_on_media_delete` — **BEFORE DELETE on `media`**. Al borrar un
  archivo en uso, republica (`published_at = now()`) las playlists **ya publicadas** que
  lo usaban, para que las TVs se enteren y descarten el ítem. Sin esto la pantalla sigue
  mostrando un slide borrado (el cascade toca `playlist_items`, no `playlists`, así que
  el canal Realtime del visor nunca se entera). **Nunca colgar esto de
  `playlist_items`**: se dispararía al editar una playlist en borrador y publicaría
  cambios a medias.
- `trg_touch_playlist_updated_at` — **AFTER INSERT/UPDATE/DELETE on `playlist_items`**.
  Mueve `playlists.updated_at`, que es lo que permite detectar "cambios sin publicar"
  (`updated_at > published_at`). Acá sí es correcto colgar de `playlist_items`, porque
  `updated_at` es el campo de borrador y no llega al visor.
- **Quirk cosmético conocido:** al borrar un media de una playlist publicada, los dos
  triggers se encadenan y el badge queda en "Cambios sin publicar" aunque la TV ya esté
  al día. La pantalla muestra lo correcto; solo el badge es pesimista.

### Gotcha de Storage: `DELETE` necesita también policy de `SELECT`

Borrar un archivo del bucket falla **en silencio** (HTTP 200 con `[]`, sin error) si
`authenticated` no tiene policy de `SELECT` sobre `storage.objects`: el endpoint primero
*busca* los objetos que coinciden (esa búsqueda pasa por RLS) y borra lo que encontró;
sin `SELECT` no encuentra nada. Es el mismo patrón de RLS silenciosa de la sección 4,
pero en Storage. Las tres policies (`insert`, `select`, `delete`) están en el `.sql`.

No confundir con el RLS de la tabla `media`: son dos sistemas separados. Que la fila se
pueda borrar no dice nada sobre el archivo.

### 🔒 Fix de seguridad: `screens` tenía UPDATE totalmente abierto para `anon` (30 julio 2026)

Un primer análisis de seguridad pre-lanzamiento (repasando `weluk-schema.sql` completo)
encontró que las policies de `anon` sobre `screens` y `pairing_codes` usaban `using (true)`
sin ningún filtro por fila — comentario original en el `.sql`: "no hay forma de restringir
por fila sin auth real aquí". Como la `anon key` es pública por diseño (va embebida en el
bundle de `weluk-browser`, cualquiera puede extraerla), esto significaba que **cualquier
persona en internet, sin cuenta ni login, podía**:

- Leer la tabla completa de `screens` (nombres, `device_uuid`, playlist asignada) y de
  `pairing_codes` (incluidos códigos pendientes) de **todas** las companies, no solo la
  propia.
- **Modificar cualquier pantalla de cualquier company** — cambiarle la playlist o
  desconectarla — con un `UPDATE` directo a la API pública de Supabase, sin filtro de fila
  (`using (true) with check (true)`), potencialmente afectando **todas las filas a la vez**
  en un solo request si no se pasaba ningún filtro.

**Fix aplicado (lo urgente, no todo):** se priorizó cerrar la escritura sin filtro, que era
el riesgo real de defacement/DoS sobre pantallas de clientes reales. Se retiró el `UPDATE`
directo de `anon` sobre `screens` y se reemplazó por la función `disconnect_own_screen(p_device_uuid uuid)`
(`security definer`, `returns setof screens`) — solo puede desconectar la fila cuyo
`device_uuid` coincide con el parámetro, nunca otra columna ni otra fila. Requirió actualizar
`weluk-browser` (`Overlay.vue`, botón "Disconnect this screen") para llamar
`supabase.rpc('disconnect_own_screen', { p_device_uuid })` en vez del `UPDATE` directo —
ya confirmado funcionando en el visor real. También se acotó la policy de `SELECT` de
`pairing_codes` para `anon` a `status = 'pending' and expires_at > now()` (antes exponía
códigos ya reclamados/vencidos de cualquier company).

**Riesgo aceptado, no cerrado todavía:** el `SELECT` de `anon` sobre `screens` sigue abierto
(`using (true)`) — cualquiera puede seguir *leyendo* la lista de pantallas de todas las
companies (sin poder escribir nada). Cerrarlo del todo requiere darle identidad real a cada
dispositivo (ej. Supabase anonymous auth), que es un cambio de arquitectura más grande y no
entra en el alcance de este fix puntual. Decisión consciente: para el nivel de dato que
maneja esta plataforma (nombres de pantalla, no información confidencial), el riesgo
residual es aceptable para el MVP; revisar si el negocio escala a clientes que exijan más.

### ✅ "Eliminar pantalla" simplificado a un solo paso — requirió fix cross-repo (30 julio 2026)

Se sacó el paso intermedio de "Desconectar" del panel: ahora un solo botón "Eliminar"
(con confirm), sin importar el `status` de la pantalla. `useDisconnectScreen.ts` se
borró del repo (ya no lo usaba nadie). El paso intermedio no se movió a otro lado del
panel — **dejó de ser necesario** porque el fix real se hizo un nivel más abajo, en
`weluk-browser` y en Supabase:

- Antes, el visor solo sabía reaccionar (vía Realtime) a `UPDATE status='disconnected'`
  para volver a pairing. Un `DELETE` directo sobre una pantalla `paired` era un evento
  nunca manejado — riesgo real de dejar una TV en vivo congelada sin aviso.
- Fix en `weluk-browser`: `Player.vue` pasó de escuchar solo `'UPDATE'` a `event: '*'`,
  tratando `payload.eventType === 'DELETE'` igual que un disconnect; `loadScreen()` pasó
  de `.single()` a `.maybeSingle()` (cerró una ventana de carrera real: un delete a
  mitad del mount tiraba `PGRST116`); `disconnect_own_screen()` (la RPC que usa el botón
  "Disconnect" del propio overlay del visor) pasó de `UPDATE` a `DELETE ... RETURNING *`.
- **El bloqueante real no era de código:** `alter table screens replica identity full;`
  — sin esto, Postgres solo manda la PK en el `old` row del WAL de un `DELETE`, y como
  el visor filtra su canal por `device_uuid` (no la PK), el evento nunca hubiera
  llegado. Corrido a mano en el SQL Editor del proyecto real (agregar también a
  `weluk-schema.sql` si no está).
- **Validado en hardware real:** borrar la fila desde Table Editor con la TV
  reproduciendo → vuelve a pairing sin recargar; usar "Disconnect" del overlay → la fila
  desaparece por completo (ya no queda huérfana en `disconnected`); re-vincular después
  → limpio.

### ✅ Media: selección múltiple para agregar/eliminar, ya no acción directa por click (30 julio 2026)

`MediaGrid.vue` (compartido por el tab Media y el picker dentro de una playlist) cambió
el patrón de interacción: un click en una card ya no ejecuta nada directo — **selecciona**
(borde resaltado), y aparece una barra con la acción según el modo:

- **Modo `pick`** (dentro de una playlist): "Agregar N a la lista" + "Eliminar N" (los
  dos — mantiene la paridad de capacidades entre picker y tab Media ya documentada
  arriba, estilo WordPress Media Library).
- **Modo `browse`** (tab Media): solo "Eliminar N".
- El ícono de tacho por-card se sacó, reemplazado por este flujo. Ambos botones muestran
  spinner + texto ("Agregando…"/"Eliminando…") mientras corren, con estado propio
  (`bulkAdding`/`bulkDeleting`) separado del `loading` del composable (que se pisaba
  entre archivos al correr en paralelo).
- Confirm de "Eliminar N" usa un nivel intermedio, no el detalle por archivo de antes:
  una sola query (`anyPlaylistsUsing`) chequea si *alguno* del lote está en uso en
  cualquier playlist; si es así, agrega un aviso genérico ("se quitarán de ahí, y las
  publicadas se actualizarán solas") sin mapear archivo↔playlist — con varios archivos
  ese detalle se vuelve ilegible, y el trigger `trg_notify_playlists_on_media_delete` ya
  resuelve la republicación real sin código extra de por medio.
- Subida también pasó a multi-select con cola (`input multiple` + concurrencia limitada
  a 3, sin librerías nuevas) — `useUploadMedia.uploadMedia()` dejó de tener estado
  global de `loading`/`error` (se pisaba entre archivos en paralelo) y ahora devuelve
  `{ media, error }` por llamada. Cards de la cola muestran skeleton + spinner mientras
  suben, sin mostrar el peso del archivo (es pre-optimización, no coincide con el
  tamaño final tras pasar por WebP — se sacó para no confundir).
- En el picker, al terminar de agregar (`onAdded` en `PlaylistDetailView.vue`), el
  dialog espera a que `fetchItems`/`fetchPlaylist` confirmen el nuevo estado antes de
  cerrarse — no se cierra en falso sobre una lista todavía desactualizada.

### 🐛 Fix: reordenar/editar duración no marcaba "Cambios sin publicar" (30 julio 2026)

El trigger `trg_touch_playlist_updated_at` (ver más abajo) ya tocaba correctamente
`playlists.updated_at` en cualquier `UPDATE` sobre `playlist_items`, incluyendo
reordenar y cambiar duración — el dato en la base siempre estuvo bien. El bug era
puramente de front: `onReorder` y `onDurationChange` en `PlaylistDetailView.vue` nunca
llamaban a `fetchPlaylist()` después de la mutación (a diferencia de agregar/quitar
ítems, que sí lo hacían), así que el `playlist` en memoria del panel — de donde sale el
badge de estado — quedaba con un `updated_at` viejo. Fix: agregar `await
fetchPlaylist()` en ambos handlers, mismo patrón que ya usaban los otros cuatro. También
se ajustó `usePlaylistItems.fetchItems()` para solo activar el skeleton de carga cuando
la lista está vacía (carga inicial real) — antes tapaba la lista completa con 3
placeholders fijos en cada refetch (agregar/reordenar/etc.), generando un flash
innecesario aunque hubiera 5+ ítems ya cargados.

### Recordatorio: el `.sql` no se aplica solo

`weluk-schema.sql` es un archivo de texto, nadie lo ejecuta. Cada cambio hay que correrlo
a mano en el SQL Editor de Supabase. Además está escrito como script de creación desde
cero, así que **no se puede re-ejecutar completo** contra una base ya poblada. Si esto
empieza a doler, el paso siguiente es el CLI de Supabase con migraciones
(`supabase migration new` + `supabase db push`) — todavía no está configurado.

---

_Última actualización: 30 julio 2026 — sección 14: el panel de `company_admin` ya no es
un placeholder (rutas propias en `/company/*`, reusa los mismos módulos que `superadmin`,
RLS de `company_admin` completa para media/playlists/playlist_items/screens/storage),
más eliminar pantalla y eliminar playlist (con warning de uso). Agregado el dialog
"Asignar pantallas" (cierra el ciclo completo del producto, ítem 1 de "Qué falta" pasó a
"Qué está implementado") y el gotcha que salió de construirlo: asignar una pantalla a
una playlist en borrador rompía el visor (`Cannot coerce the result to a single JSON
object`, RLS de `anon` exige `published_at is not null`) — fix aplicado auto-publicando
la playlist al asignar. Actualizada la sección 12 para reflejar que el gotcha de
`is_active` sin chequear en RLS ahora es un riesgo real, no hipotético. Este documento
debe vivir en los 4 repos (o ser referenciado desde ellos) y actualizarse a medida que
se tomen nuevas decisiones.

**Actualización 30 julio 2026 (2):** CRUD de playlists completo — reordenar ítems por
drag and drop (`vue-draggable-plus`) y editar duración por ítem (`playlist_items.duration_seconds`),
más lectura automática de la duración real al subir un video (antes usaba el default fijo
de 8s de `media.duration_seconds`, pensado solo para imágenes). Requirió agregar la policy
de `UPDATE` de `company_admin` sobre `playlist_items` en `weluk-schema.sql` (no existía).
También se corrigió `weluk-browser`: el visor leía la duración configurada para video pero
nunca la aplicaba (el avance dependía solo del evento `@ended`, ignorando cualquier corte
manual) — confirmado funcionando en el visor real. El ítem 1 de "Qué falta" de la sección 14
pasó a "Qué está implementado".

**Actualización 30 julio 2026 (3) — primer análisis de seguridad pre-lanzamiento:** encontrado
y corregido un hallazgo crítico — `screens` tenía `UPDATE` totalmente abierto para el rol
`anon` (sin filtro por fila), permitiendo modificar la playlist o desconectar la pantalla de
cualquier company sin login. Reemplazado por la función `disconnect_own_screen()` (ver
sección 14). Acotada también la lectura de `pairing_codes` para `anon` a solo códigos
pendientes y vigentes. Riesgo aceptado y documentado: el `SELECT` de `anon` sobre `screens`
sigue abierto (de solo lectura, cerrarlo requiere darle identidad real a cada dispositivo).

**Actualización 30 julio 2026 (4):** cerrado también el chequeo de `is_active` en RLS de
`company_admin` (sección 12) — función `auth_active_company_id()` centraliza el corte de
acceso en un solo lugar en vez de tocar 18 policies sueltas, más un overlay de "Cuenta
deshabilitada" en `AdminLayout.vue` (aviso visual, la seguridad real la hace RLS). SQL
corrido y confirmado en el proyecto Supabase real (única company existente, activa, sin
impacto). Con esto, los dos pendientes de seguridad de la sección 12 quedan resueltos.

**Actualización 30 julio 2026 (5):** revisión de flujos vs. Juuno y tres cierres de
ciclo cross-repo. (a) "Eliminar pantalla" pasó de dos pasos a uno solo — requirió fix en
`weluk-browser` (manejo de evento `DELETE` por Realtime, `.maybeSingle()`,
`disconnect_own_screen` ahora borra) más `alter table screens replica identity full;`
en Supabase, sin el cual el evento `DELETE` nunca le hubiera llegado al visor (ver
gotcha nuevo en sección 14). (b) Presence quedó implementado de punta a punta — cerrada
la brecha de la sección 13 — reusando el canal `screen-${device_uuid}` que ya existía,
sin conexiones ni costo nuevo (verificado contra el dashboard real: 119/2M mensajes);
`screens.last_seen_at` sigue sin escribirse, ver sección 5. (c) Media pasó de subida y
borrado de a uno a multi-select con cola y confirm agregado (no por-archivo) — ver
sección 14. De paso, fix de un bug de UX real: reordenar ítems o editar su duración no
marcaba "Cambios sin publicar" en el badge (el dato en la base siempre estuvo bien, el
front no refrescaba `playlist.updated_at` después de esas dos acciones).

**Actualización 31 julio 2026:** thumbnail de video + cap de subida bajado de 50 MB a
15 MB (sección 14). El thumbnail se captura 100% client-side (`<video>` + `canvas` →
WebP, sin librerías nuevas, mismo patrón que `imageOptimize.ts`/`videoMetadata.ts`) y se
guarda en `media.thumbnail_path` (columna nueva); es best-effort, nunca bloquea la
subida del video si falla. `MediaGrid.vue` y `PlaylistDetailView.vue` ya lo muestran en
vez del ícono genérico. El cap de 15 MB se aplicó en dos capas: `MAX_SIZE_BYTES` del
cliente y el `file_size_limit` propio del bucket `media` — importante no confundirlo con
el "Global file size limit" del proyecto (ese sí queda fijo en 50 MB en el plan free,
pide Pro para subirlo; bajar el límite de un bucket puntual por debajo del global no
requiere Pro). Evaluado también comprimir video del lado del cliente (`ffmpeg.wasm`) o
server-side — descartado por ahora: el contenido real esperado (sección 7) son videos de
5-7 MB, muy por debajo del cap, así que no hay problema real que resolver todavía.

**Actualización 31 julio 2026 (2):** thumbnail extendido a imágenes (antes solo video) y
mostrado en `ScreensView` (sección 14). Se extrajo la primitiva compartida
`resizeToWebp.ts` para no duplicar el canvas de resize entre `imageOptimize.ts` y
`videoThumbnail.ts` — de paso corrigió que el thumbnail de video escalaba solo por
ancho (video vertical salía deforme). Los call sites de render pasaron de ramificar por
`type` a `thumbnail_path ?? storage_path`. Motivo real: no egress (`cacheControl` de un
año ya lo cubre, sección 7, marcado como resuelto en esta misma actualización) sino
tiempo de carga en frío (~6 MB → ~700 KB en la primera visita al tab Media con 20
archivos). La tabla de `ScreensView` ahora muestra un thumbnail de 32px junto al nombre
de la playlist asignada (cualquier ítem con `thumbnail_path`, sin importar cuál — no es
snapshot de lo publicado, ver caveat en sección 14) sin costo de DB adicional (mismo
`select` con un embed más). Evaluado y descartado, mismo día: `Select` inline en esa
fila para reasignar playlist directo desde `ScreensView` — hubiera duplicado la lógica
de auto-publish de `useAssignPlaylistScreens.ts` en un segundo composable sin resolver
ninguna capacidad nueva (el camino inverso, playlist → pantallas, ya existe), y su
diseño se reabre de nuevo cuando llegue Schedule (sección 9, punto 5)._

**Actualización 1 agosto 2026 — diseño de Schedule acordado (no implementado):** sesión
de análisis completa sobre el punto 5 de la sección 9, escrita en la sección 14 ("📐
Diseño acordado para Schedule"). Nada de esto existe en código todavía. Las tres
decisiones de fondo: (a) **base + excepciones** — `screens.current_playlist_id` pasa a
significar "playlist por defecto" y las reglas (playlist + días + hora inicio/fin) se
cuelgan de la pantalla; se descartó el modelo de Juuno de un `Schedule` reutilizable como
entidad de primera clase, porque ahí no existe "la general" y expresar el caso real
("Desayuno de 8 a 10, el resto general") costaría ~21 reglas en vez de una. (b) **el
cambio de playlist por hora lo ejecuta la pantalla, no el servidor** — timer local de
~30 s sobre reglas y contenido ya precacheados; se descartó un cron server-side porque
una TV sin internet nunca se enteraría del cambio y no podría precachear con antelación
(rompe el principio de la sección 7). Riesgo #1 asociado: el reloj del dispositivo —
sincronizar offset contra el servidor y mostrarlo en el overlay. (c) **UI de columnas por
día sin eje de horas**, dentro de un detalle de pantalla que todavía no existe (ese, y no
las reglas, es el trabajo grueso). Sin ítem "Programación" en el sidebar: la programación
es una propiedad de la pantalla, no un objeto nuevo._

```

```

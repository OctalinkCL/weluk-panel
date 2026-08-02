# weluk-panel — Contexto de Claude Code

> Este repo es parte de **Weluk** (Octalink SpA), plataforma de digital signage. El contexto
> compartido del producto vive en `../weluk-docs` (symlinkeado acá como `docs/`). **Leer
> `docs/03-contratos.md` antes de tocar pairing, caché, Realtime, Schedule o el modelo de
> datos:** son reglas que ya se pagaron en sangre en otros repos del mismo producto.

Última lectura de `docs/DECISIONES.md`: 2026-08-02 (incluye las dos entradas de seguridad de
esa fecha — el `revoke` de `disconnect_own_screen` y los dos hardenings de RLS, ambos
acordados y **no** aplicados todavía)

## Setup del symlink (una vez por máquina)

Ya está creado en este checkout. Si clonás el repo en una máquina nueva:

```bash
cd weluk-panel
ln -s ../weluk-docs docs   # requiere weluk-docs clonado como hermano de este repo
```

## Contexto compartido (@docs)

- @docs/00-producto.md — qué es Weluk, modelo comercial, scope del MVP
- @docs/01-arquitectura.md — repos, stack, matriz de hardware real
- @docs/02-datos.md — Supabase, modelo de datos, RLS, storage
- @docs/03-contratos.md — **reglas obligatorias** (caché, pairing, presence, escrituras, Schedule)
- @docs/04-incidentes.md — postmortems, el "por qué" de cada regla
- @docs/weluk-schema.sql — fuente autoritativa del esquema (vive acá porque `weluk-panel`
  es quien más lo toca, pero es de todos los repos)

---

## Arranque en una máquina nueva

1. `pnpm install` (proyecto migrado de npm a pnpm — fijado en `package.json` vía
   `packageManager`, no usar `npm install`/`yarn`)
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

---

## Estructura y convenciones

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
  bloqueó en silencio — tratarlo como error (ver `docs/03-contratos.md § 1`).
- Verificación antes de dar algo por listo: `npx vue-tsc --build` limpio + probar el
  flujo real en el navegador contra Supabase.

---

## Qué está implementado

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
  ver `docs/PENDIENTES.md`).
- **Screens**: listar, vincular por código de pairing (reemplaza el SQL manual de
  `docs/03-contratos.md § 4`), editar nombre, **eliminar en un solo paso** (sin
  "Desconectar" previo — ver el gotcha cross-repo en `docs/04-incidentes.md`), estado de
  **conexión en vivo** (Presence, punto verde/gris — ver `docs/03-contratos.md § 5`).
  Lista también la playlist asignada a cada pantalla (solo lectura).
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
  mismo patrón de "RLS silenciosa" de `docs/03-contratos.md § 1`). **Cierra también el
  hueco del lado del visor**: `weluk-browser` leía `duration_seconds` para video pero
  no lo usaba (el avance de video solo dependía del evento nativo `@ended`, ignorando
  cualquier duración configurada) — ya corregido ahí también.
- **Asignar pantallas a una playlist**: dialog "Asignar pantallas"
  (`AssignScreensDialog.vue`, botón en `PlaylistDetailView`) — lista plana de las
  pantallas de la company (sin árbol/carpetas, decisión de UX explícita) con
  "Seleccionar todas" + checkbox por pantalla; `useAssignPlaylistScreens.assignScreens`
  hace batch-update de `screens.current_playlist_id` (asigna las marcadas, limpia a
  `null` las que se destildan). El botón "Publicar" de la playlist ahora está
  deshabilitado (con texto explicando por qué) si no tiene ítems o no tiene ninguna
  pantalla asignada. **Cierra el ciclo completo del producto** — ya no hace falta SQL
  manual para esto. Ver gotcha de auto-publish en `docs/04-incidentes.md`, sobre por
  qué este dialog también publica la playlist si estaba en borrador.
- **Media**: biblioteca por company. Subir (con optimización a WebP), listar, eliminar.
  Vive en dos superficies que comparten el mismo componente (`MediaGrid.vue`): el tab
  Media (administrar) y un dialog picker dentro de la playlist (elegir). Decisión de UX:
  ambas superficies tienen **las mismas capacidades** (subir y borrar disponibles en las
  dos); el modo picker solo *suma* la acción de agregar — mismo criterio que la Media
  Library de WordPress.
- **Thumbnails (video e imagen) + cap de subida en 15 MB**: ver `docs/02-datos.md § Storage`
  para el detalle del mecanismo (es cross-repo/schema). Del lado de este repo:
  `useUploadMedia.ts` genera el thumbnail al subir (best-effort, nunca bloquea), y
  `MediaGrid.vue`/`PlaylistDetailView.vue`/`ScreensView.vue` renderizan con
  `thumbnail_path ?? storage_path`. `useDeleteMedia.ts` borra ambos paths al eliminar
  (si no, queda huérfano en Storage) y valida `length < pathsToRemove.length` en vez de
  `length === 0` para no dejar pasar un borrado parcial en silencio.
- **`ScreensView.vue` muestra thumbnail de 32px** junto al nombre de playlist asignada —
  `useScreens.ts` extiende el `select` con `playlist_items(order_index, media(thumbnail_path))`
  anidado, sigue siendo una sola request. `screenThumbnailPath()` toma cualquier ítem con
  `thumbnail_path` (no importa cuál — es solo un vistazo, no una preview fiel de lo
  publicado) y cae al ícono genérico si la playlist no tiene ítems o son de antes del
  generador de thumbnails.
  > **Caveat de producto:** el thumbnail sale de `playlist_items` (el borrador), no de
  > `published_at` — si alguien reordena o cambia contenido sin publicar, la miniatura
  > puede no coincidir con lo que la TV está mostrando ahora mismo. Aceptado a propósito
  > para este alcance.
  > **Evaluado y descartado (mismo día):** `Select` inline en esta fila para reasignar
  > playlist directo desde acá. Motivo: la capacidad ya existe del lado inverso
  > (`AssignScreensDialog`), y su diseño se reabre de nuevo cuando llegue Schedule.
- **Panel de `company_admin` (real, ya no placeholder)** — rutas propias en
  `router/company-admin.routes.ts`, montadas bajo `/company/*` con el mismo
  `AdminLayout` que `superadmin`: `company-screens` (home), `company-playlists`,
  `company-playlist-detail`, `company-media`. Reusa exactamente los mismos módulos y
  componentes que usa `superadmin` dentro del detalle de company (`ScreensView`,
  `PlaylistsView`, `PlaylistDetailView`, `MediaView`) — no hay código duplicado por rol.
  El scoping por company se resuelve en cada vista con
  `route.params.id ?? authStore.profile.company_id` (el primero cuando `superadmin`
  navega el detalle de una company, el segundo cuando entra `company_admin`); la
  seguridad real la hacen las policies RLS de `company_admin` (`docs/02-datos.md`), no
  este fallback en el cliente. `NavMain.vue` arma el sidebar según `authStore.role`
  (items separados por `roles: Role[]` en cada entrada).
- **`is_active` chequeado en RLS**: `AdminLayout.vue` (compartido por `superadmin` y
  `company_admin`) chequea, solo cuando `role === 'company_admin'`, el `is_active` de su
  propia company (`useCompanyStatus.ts`) y muestra un overlay de pantalla completa
  ("Cuenta deshabilitada") si está apagada. **Este overlay es solo un aviso, no la
  seguridad real** — la seguridad la hace `auth_active_company_id()` en RLS (ver
  `docs/02-datos.md § Helpers de RLS`); si alguien lo saca del DOM con el inspector, el
  resto de la UI sigue sin datos igual. Un `superadmin` navegando el detalle de una
  company deshabilitada (para reactivarla) nunca ve este overlay.

## Qué falta (en orden sugerido)

1. **Schedule por horario/fecha** — diseño ya acordado, ver `docs/03-contratos.md § 7`
   antes de retomarlo. Nada de ese diseño existe en código todavía.
2. "Cancelar cambios" en una playlist — evaluado y pospuesto, ver `docs/PENDIENTES.md`.

---

## Gotchas específicos de este repo

### Media: selección múltiple para agregar/eliminar (no acción directa por click)

`MediaGrid.vue` (compartido por el tab Media y el picker dentro de una playlist) usa el
patrón: un click en una card **selecciona** (borde resaltado), y aparece una barra con la
acción según el modo:

- **Modo `pick`** (dentro de una playlist): "Agregar N a la lista" + "Eliminar N".
- **Modo `browse`** (tab Media): solo "Eliminar N".
- Ambos botones muestran spinner + texto mientras corren, con estado propio
  (`bulkAdding`/`bulkDeleting`) separado del `loading` del composable (que se pisaba
  entre archivos al correr en paralelo).
- Confirm de "Eliminar N" usa un nivel intermedio, no el detalle por archivo: una sola
  query (`anyPlaylistsUsing`) chequea si *alguno* del lote está en uso en cualquier
  playlist; si es así, agrega un aviso genérico — el trigger
  `trg_notify_playlists_on_media_delete` (`docs/02-datos.md`) ya resuelve la
  republicación real sin código extra.
- Subida también es multi-select con cola (`input multiple` + concurrencia limitada a 3,
  sin librerías nuevas) — `useUploadMedia.uploadMedia()` devuelve `{ media, error }` por
  llamada en vez de estado global (se pisaba entre archivos en paralelo).
- En el picker, al terminar de agregar, el dialog espera a que `fetchItems`/`fetchPlaylist`
  confirmen el nuevo estado antes de cerrarse.

### Bug: reordenar/editar duración no marcaba "Cambios sin publicar"

El trigger `trg_touch_playlist_updated_at` ya tocaba bien `playlists.updated_at` — el bug
era puramente de front: `onReorder` y `onDurationChange` en `PlaylistDetailView.vue` nunca
llamaban a `fetchPlaylist()` después de la mutación (a diferencia de agregar/quitar ítems).
Fix: agregar `await fetchPlaylist()` en ambos handlers. También se ajustó
`usePlaylistItems.fetchItems()` para solo activar el skeleton cuando la lista está vacía
(carga inicial real) — antes tapaba la lista completa en cada refetch.

### Recordatorio: el `.sql` no se aplica solo

`docs/weluk-schema.sql` es un archivo de texto, nadie lo ejecuta. Cada cambio hay que
correrlo a mano en el SQL Editor de Supabase. Además está escrito como script de creación
desde cero, así que **no se puede re-ejecutar completo** contra una base ya poblada. Si
esto empieza a doler, el paso siguiente es el CLI de Supabase con migraciones
(`supabase migration new` + `supabase db push`) — todavía no está configurado.

-- =====================================================
-- WELUK — Esquema de Base de Datos (MVP)
-- Correr en: Supabase Studio → SQL Editor
-- =====================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- =====================================================
-- 1. COMPANIES
-- =====================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true, -- soft-disable (ej. no pago) — nunca se borra la company
  created_at timestamptz not null default now()
);

-- =====================================================
-- 2. PROFILES
-- (id referencia a auth.users.id — se crea vía trigger o manual al registrar usuario)
-- =====================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null, -- null = superadmin
  role text not null check (role in ('superadmin', 'company_admin')),
  full_name text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 3. MEDIA
-- =====================================================
create table media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  duration_seconds integer not null default 8, -- default de reproducción para imágenes
  created_at timestamptz not null default now()
);

-- =====================================================
-- 4. PLAYLISTS
-- =====================================================
create table playlists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  updated_at timestamptz not null default now(),  -- cambia con cualquier edición (draft)
  published_at timestamptz,                        -- SOLO cambia al publicar — esto escucha el visor
  created_at timestamptz not null default now()
);

-- =====================================================
-- 5. PLAYLIST_ITEMS
-- =====================================================
create table playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references playlists(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  order_index integer not null default 0,
  duration_seconds integer, -- override opcional del default de media
  created_at timestamptz not null default now()
);

-- =====================================================
-- 6. SCREENS
-- =====================================================
create table screens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  device_uuid uuid not null unique, -- generado/persistido en el visor (localStorage)
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'paired', 'disconnected')),
  current_playlist_id uuid references playlists(id) on delete set null,
  current_playlist_updated_at timestamptz,
  last_seen_at timestamptz, -- respaldo histórico (Presence maneja el estado en vivo)
  created_at timestamptz not null default now()
);

-- =====================================================
-- 7. PAIRING_CODES
-- =====================================================
create table pairing_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  device_uuid uuid not null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'expired')),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Solo puede existir UN código pending por combinación código+estado a la vez
-- (evita colisión de dos pantallas mostrando el mismo código simultáneamente)
create unique index idx_pairing_codes_pending_unique
  on pairing_codes (code)
  where status = 'pending';

-- =====================================================
-- ÍNDICES adicionales para consultas frecuentes
-- =====================================================
create index idx_profiles_company_id on profiles(company_id);
create index idx_media_company_id on media(company_id);
create index idx_playlists_company_id on playlists(company_id);
create index idx_playlist_items_playlist_id on playlist_items(playlist_id);
create index idx_screens_company_id on screens(company_id);
create index idx_screens_device_uuid on screens(device_uuid);
create index idx_pairing_codes_device_uuid on pairing_codes(device_uuid);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) — habilitar en todas las tablas
-- =====================================================
alter table companies enable row level security;
alter table profiles enable row level security;
alter table media enable row level security;
alter table playlists enable row level security;
alter table playlist_items enable row level security;
alter table screens enable row level security;
alter table pairing_codes enable row level security;

-- Función helper: obtiene el company_id del usuario autenticado actual
create or replace function auth_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from profiles where id = auth.uid()
$$;

-- Función helper: chequea si el usuario actual es superadmin
create or replace function is_superadmin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'superadmin'
  )
$$;

-- Función helper: como auth_company_id(), pero devuelve NULL si la company está
-- deshabilitada (is_active = false). Se usa en TODAS las policies de contenido
-- de company_admin (media, playlists, playlist_items, screens, storage) — así,
-- deshabilitar una company corta el acceso real en un solo lugar, sin tener que
-- tocar cada policy una por una. OJO: la policy de `companies` (ver más abajo)
-- sigue usando auth_company_id() (la versión sin chequear is_active) a propósito
-- — el panel de company_admin necesita poder leer su propia fila de `companies`
-- (incluido is_active = false) para poder mostrar el aviso de "cuenta
-- deshabilitada"; si también se cortara ese SELECT, el frontend no tendría cómo
-- saber por qué dejó de ver sus datos.
create or replace function auth_active_company_id()
returns uuid
language sql
security definer
stable
as $$
  select p.company_id
  from profiles p
  join companies c on c.id = p.company_id
  where p.id = auth.uid() and c.is_active = true
$$;

-- --- Policies: companies ---
create policy "superadmin ve todas las companies"
  on companies for select
  using (is_superadmin());

create policy "company_admin ve su propia company"
  on companies for select
  using (id = auth_company_id());

create policy "superadmin crea companies"
  on companies for insert
  to authenticated
  with check (is_superadmin());

create policy "superadmin edita companies"
  on companies for update
  to authenticated
  using (is_superadmin())
  with check (is_superadmin());

-- --- Policies: profiles ---
create policy "superadmin ve todos los profiles"
  on profiles for select
  using (is_superadmin());

create policy "usuario ve su propio profile"
  on profiles for select
  using (id = auth.uid());

-- --- Policies: media, playlists, playlist_items, screens (mismo patrón) ---
create policy "superadmin acceso total a media"
  on media for all
  using (is_superadmin());

create policy "company_admin ve su media"
  on media for select
  using (company_id = auth_active_company_id());

create policy "company_admin sube su media"
  on media for insert
  with check (company_id = auth_active_company_id());

create policy "company_admin elimina su media"
  on media for delete
  using (company_id = auth_active_company_id());

create policy "superadmin acceso total a playlists"
  on playlists for all
  using (is_superadmin());

create policy "company_admin ve sus playlists"
  on playlists for select
  using (company_id = auth_active_company_id());

create policy "company_admin crea sus playlists"
  on playlists for insert
  with check (company_id = auth_active_company_id());

create policy "company_admin actualiza sus playlists"
  on playlists for update
  using (company_id = auth_active_company_id())
  with check (company_id = auth_active_company_id());

create policy "company_admin elimina sus playlists"
  on playlists for delete
  using (company_id = auth_active_company_id());

create policy "superadmin acceso total a playlist_items"
  on playlist_items for all
  using (is_superadmin());

-- playlist_items no tiene company_id propia — se scopea vía la playlist dueña.
create policy "company_admin ve items de sus playlists"
  on playlist_items for select
  using (playlist_id in (select id from playlists where company_id = auth_active_company_id()));

create policy "company_admin agrega items a sus playlists"
  on playlist_items for insert
  with check (playlist_id in (select id from playlists where company_id = auth_active_company_id()));

create policy "company_admin quita items de sus playlists"
  on playlist_items for delete
  using (playlist_id in (select id from playlists where company_id = auth_active_company_id()));

-- Necesaria para reordenar (order_index) y editar duración (duration_seconds)
-- desde el panel. No existía porque hasta ahora playlist_items solo se
-- insertaba/borraba, nunca se actualizaba.
create policy "company_admin actualiza items de sus playlists"
  on playlist_items for update
  using (playlist_id in (select id from playlists where company_id = auth_active_company_id()))
  with check (playlist_id in (select id from playlists where company_id = auth_active_company_id()));

create policy "superadmin acceso total a screens"
  on screens for all
  using (is_superadmin());

create policy "company_admin ve sus screens"
  on screens for select
  using (company_id = auth_active_company_id());

create policy "company_admin administra sus screens (insert)"
  on screens for insert
  with check (company_id = auth_active_company_id());

create policy "company_admin administra sus screens (update)"
  on screens for update
  using (company_id = auth_active_company_id())
  with check (company_id = auth_active_company_id());

-- Elimina la fila por completo (no solo desconectar) para liberar el device_uuid
-- y que otra company pueda vincularlo desde cero — ver gotcha de RLS en sección 14.
create policy "company_admin elimina sus screens"
  on screens for delete
  using (company_id = auth_active_company_id());

create policy "superadmin acceso total a pairing_codes"
  on pairing_codes for all
  using (is_superadmin());

-- pairing_codes no tiene company_id (el código no está asociado a ninguna company
-- hasta el momento del claim) — mismo modelo de confianza que ya se usa para "anon"
-- en esta tabla (using (true)), extendido a cualquier usuario autenticado. Cubre a
-- company_admin sin tocar la policy de superadmin de arriba.
create policy "usuarios autenticados pueden leer pairing_codes"
  on pairing_codes for select
  to authenticated
  using (true);

create policy "usuarios autenticados pueden reclamar pairing_codes"
  on pairing_codes for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Al borrar un media que está en uso, las playlists PUBLICADAS que lo usaban
-- quedan con contenido fantasma para el visor (borrar toca playlist_items,
-- no playlists, así que el canal Realtime que escucha el visor no se entera).
-- Este trigger fuerza published_at = now() solo en esas playlists publicadas,
-- lo que sí dispara el evento que el visor escucha (ver Player.vue de
-- weluk-browser) y hace que refetcheen y descarten el ítem borrado.
--
-- OJO: cuelga de DELETE en `media`, nunca de DELETE en `playlist_items` —
-- si colgara ahí, se dispararía también cuando alguien solo quita un ítem al
-- editar una playlist desde el panel, publicando un borrador a la fuerza y
-- rompiendo el sentido del botón "Publicar" (ver sección 5 del CLAUDE.md).
-- Tiene que ser BEFORE DELETE: playlist_items todavía existe en ese momento,
-- antes de que el cascade de la FK lo borre.
create or replace function notify_playlists_on_media_delete()
returns trigger
language plpgsql
as $$
begin
  update playlists
  set published_at = now()
  where published_at is not null
    and id in (
      select playlist_id from playlist_items where media_id = old.id
    );
  return old;
end;
$$;

create trigger trg_notify_playlists_on_media_delete
before delete on media
for each row
execute function notify_playlists_on_media_delete();

-- Agregar/quitar/reordenar ítems toca playlist_items, no playlists — sin esto
-- `playlists.updated_at` se queda en la fecha de creación para siempre y no hay
-- forma de saber si una playlist tiene cambios sin publicar (el panel compara
-- updated_at > published_at para mostrar "Cambios sin publicar").
-- Acá sí es correcto colgar de playlist_items: updated_at es justamente el
-- campo "borrador" (ver sección 5 del CLAUDE.md), tocarlo NO llega al visor.
create or replace function touch_playlist_updated_at()
returns trigger
language plpgsql
as $$
begin
  update playlists
  set updated_at = now()
  where id = coalesce(new.playlist_id, old.playlist_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_touch_playlist_updated_at
after insert or update or delete on playlist_items
for each row
execute function touch_playlist_updated_at();

-- =====================================================
-- ACCESO A STORAGE (bucket `media`, rol authenticated)
-- El RLS de las tablas de arriba no controla el bucket — storage.objects
-- tiene su propio RLS, separado. Sin esto, subir/borrar un archivo desde
-- el panel falla aunque la fila en `media` sí se pueda escribir.
-- =====================================================
create policy "superadmin sube a media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and is_superadmin());

create policy "superadmin borra de media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and is_superadmin());

-- OJO: sin esta policy de SELECT, el DELETE de arriba NO funciona. El endpoint
-- de borrado primero busca los objetos que coinciden (esa búsqueda pasa por RLS)
-- y borra lo que encontró; sin SELECT no encuentra nada, borra cero, y responde
-- 200 con [] — sin error, igual que el gotcha de RLS de la sección 4 del CLAUDE.md.
create policy "superadmin lee media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media' and is_superadmin());

-- company_admin: mismo criterio, scopeado a su propia carpeta
-- ({company_id}/{archivo}, ver useUploadMedia.ts) en vez de acceso total.
create policy "company_admin sube archivos a su carpeta"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth_active_company_id()::text);

create policy "company_admin lee archivos de su carpeta"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth_active_company_id()::text);

create policy "company_admin borra archivos de su carpeta"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth_active_company_id()::text);

-- =====================================================
-- REALTIME — habilitar en las tablas que escucha el visor
-- =====================================================
alter publication supabase_realtime add table screens;
alter publication supabase_realtime add table playlists;
alter publication supabase_realtime add table pairing_codes;

-- =====================================================
-- ACCESO PARA EL VISOR (rol anon — sin sesión de usuario)
-- El visor (APK/browser) no hace login como usuario del panel,
-- opera como "anon" y necesita permisos explícitos, ya que
-- "Automatically expose new tables" está desactivado a propósito.
-- =====================================================

-- GRANTs base: sin esto, RLS ni siquiera entra a evaluarse
grant select, insert, update on pairing_codes to anon;
grant select on screens to anon;
grant select on playlists to anon;
grant select on playlist_items to anon;
grant select on media to anon;

-- --- Policies: pairing_codes (anon) ---
create policy "anon puede crear su codigo de pairing"
  on pairing_codes for insert
  to anon
  with check (true);

-- Antes era `using (true)`: cualquiera con la anon key (pública, va en el bundle
-- del visor) podía leer TODOS los códigos de pairing de TODAS las companies, no
-- solo los pendientes del propio dispositivo. Acotado a lo mínimo necesario para
-- que el flujo de pairing funcione (Pairing.vue ya filtra por status/expiración
-- del lado del cliente; esto lo hace innegociable también del lado del servidor).
create policy "anon puede leer codigos pendientes y vigentes"
  on pairing_codes for select
  to anon
  using (status = 'pending' and expires_at > now());

-- --- Policies: screens (anon) ---
-- El visor solo necesita leer SU PROPIA fila, filtrando por device_uuid
-- desde el cliente (no hay forma de restringir por fila sin auth real aquí,
-- así que el filtro efectivo lo hace el visor pidiendo su propio device_uuid).
-- Riesgo aceptado y documentado: cualquiera con la anon key puede listar todas
-- las pantallas de todas las companies (solo lectura). Cerrarlo del todo requiere
-- darle identidad real a cada dispositivo (ej. Supabase anonymous auth) — fuera
-- de alcance de este fix puntual; el riesgo real (poder ESCRIBIR sin filtro) es
-- el que se cierra abajo.
create policy "anon puede leer screens por device_uuid"
  on screens for select
  to anon
  using (true);

-- Antes: `grant update on screens to anon` + policy `using (true) with check (true)`.
-- Eso permitía a CUALQUIERA con la anon key modificar CUALQUIER pantalla de
-- CUALQUIER company (incluso todas a la vez en un solo request sin filtro) —
-- podían cambiarle la playlist a un cliente o apagarle la pantalla sin login.
-- Fix: se retira el UPDATE directo de la tabla y se reemplaza por esta función,
-- que solo puede hacer UNA cosa (desconectar) y solo sobre la fila cuyo
-- device_uuid coincide con el parámetro — no hay forma de que afecte otra fila
-- ni de tocar otra columna.
create or replace function disconnect_own_screen(p_device_uuid uuid)
returns setof screens
language sql
security definer
as $$
  update screens
  set status = 'disconnected', current_playlist_id = null
  where device_uuid = p_device_uuid
  returning *;
$$;

grant execute on function disconnect_own_screen(uuid) to anon;

-- --- Policies: playlists, playlist_items, media (anon, solo lectura) ---
create policy "anon puede leer playlists publicadas"
  on playlists for select
  to anon
  using (published_at is not null);

create policy "anon puede leer playlist_items"
  on playlist_items for select
  to anon
  using (true);

create policy "anon puede leer media"
  on media for select
  to anon
  using (true);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
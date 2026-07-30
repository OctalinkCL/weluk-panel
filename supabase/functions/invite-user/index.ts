import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = ['superadmin', 'company_admin']

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Solo un superadmin autenticado puede crear usuarios ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'No autorizado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user: caller },
      error: callerError,
    } = await supabase.auth.getUser(token)
    if (callerError || !caller) return jsonResponse({ error: 'No autorizado' }, 401)

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'superadmin') {
      return jsonResponse({ error: 'Solo un superadmin puede crear usuarios' }, 403)
    }

    // --- Validar el body contra las reglas del schema (weluk-schema.sql) ---
    const { email, password, full_name, role, company_id } = await req.json()

    if (!VALID_ROLES.includes(role)) {
      return jsonResponse({ error: `role inválido, debe ser: ${VALID_ROLES.join(', ')}` }, 400)
    }
    if (role === 'company_admin' && !company_id) {
      return jsonResponse({ error: 'company_admin requiere company_id' }, 400)
    }
    if (role === 'superadmin' && company_id) {
      return jsonResponse({ error: 'superadmin no debe tener company_id' }, 400)
    }

    // --- Crear el usuario en Auth ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw authError

    // --- Crear su fila en profiles ---
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user!.id,
      company_id: role === 'superadmin' ? null : company_id,
      role,
      full_name,
    })

    if (profileError) {
      // Sin esto, un fallo acá deja un usuario huérfano en auth.users
      // (sin profile, con el email ya "tomado" para siempre en Auth).
      await supabase.auth.admin.deleteUser(user!.id)
      throw profileError
    }

    return jsonResponse({ user }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return jsonResponse({ error: message }, 400)
  }
})

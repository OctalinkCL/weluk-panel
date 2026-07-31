import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/company'

/**
 * Resuelve el slug de la URL (`/c/:companySlug/*`) a la fila real de
 * `companies` — el id real (uuid) es lo que usan las queries/FKs/RLS, el
 * slug es solo routing (ver useCurrentCompanyId / useCurrentCompanySlug).
 *
 * guards.ts llama a `resolve()` una vez por navegación, antes de dejar
 * entrar a la ruta — así las vistas ya encuentran `company` resuelto al
 * montar. Se cachea por slug: navegar entre Screens/Playlists/Media de la
 * misma company no dispara un fetch nuevo en cada click.
 *
 * Un slug que no existe, o que RLS bloquea por pertenecer a otro cliente
 * (`company_admin`, policy `id = auth_company_id()`), devuelve 0 filas —
 * mismo patrón de "RLS silenciosa" de CLAUDE.md sección 4; acá se traduce a
 * `company: null`, y el guard lo trata como "no encontrada".
 */
export const useCurrentCompanyStore = defineStore('currentCompany', () => {
  const company = ref<Company | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let resolvedSlug: string | null = null

  async function resolve(slug: string): Promise<Company | null> {
    if (resolvedSlug === slug && company.value) return company.value

    loading.value = true
    error.value = null
    const { data, error: err } = await supabase.from('companies').select('*').eq('slug', slug).maybeSingle()
    loading.value = false

    if (err || !data) {
      error.value = err?.message ?? null
      company.value = null
      resolvedSlug = null
      return null
    }

    company.value = data
    resolvedSlug = slug
    return data
  }

  function reset() {
    company.value = null
    resolvedSlug = null
  }

  return { company, loading, error, resolve, reset }
})

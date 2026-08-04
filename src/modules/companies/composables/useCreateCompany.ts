import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/slug'
import type { Company } from '@/types/company'

// Slug único a partir del nombre — "Depa Living" -> "depa-living", con
// sufijo -2/-3/... si ya existe. Creación de company es una acción rara y
// solo de superadmin, así que una carrera real entre dos altas simultáneas
// con el mismo nombre es un riesgo aceptado (el unique constraint de la
// tabla igual la rechazaría en vez de fallar en silencio).
async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabase.from('companies').select('slug').or(`slug.eq.${base},slug.like.${base}-%`)
  const taken = new Set((data ?? []).map((row) => row.slug))
  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}

export function useCreateCompany() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function createCompany(name: string): Promise<Company | null> {
    loading.value = true
    error.value = null

    const slug = await uniqueSlug(slugify(name))
    const { data, error: err } = await supabase.from('companies').insert({ name, slug }).select()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo crear la company (revisar policies de RLS).'
      return null
    }
    return data[0]
  }

  return { createCompany, loading, error }
}

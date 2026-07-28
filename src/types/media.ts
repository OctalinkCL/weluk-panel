import type { Database } from '@/lib/database.types'

export type MediaType = 'image' | 'video'

export type Media = Omit<Database['public']['Tables']['media']['Row'], 'type'> & {
  type: MediaType
}

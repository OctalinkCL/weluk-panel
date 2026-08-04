import type { Database } from '@/lib/database.types'

export type ScreenStatus = 'pending' | 'paired' | 'disconnected'

export type Screen = Omit<Database['public']['Tables']['screens']['Row'], 'status'> & {
  status: ScreenStatus
  playlist: {
    name: string
    playlist_items: { order_index: number; media: { thumbnail_path: string | null } | null }[]
  } | null
}

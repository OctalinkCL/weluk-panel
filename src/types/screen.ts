import type { Database } from '@/lib/database.types'

export type ScreenStatus = 'pending' | 'paired' | 'disconnected'

export type Screen = Omit<Database['public']['Tables']['screens']['Row'], 'status'> & {
  status: ScreenStatus
}

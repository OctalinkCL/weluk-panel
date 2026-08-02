import type { Database } from '@/lib/database.types'
import type { Media } from './media'

export type Playlist = Database['public']['Tables']['playlists']['Row']

export type PlaylistItem = Database['public']['Tables']['playlist_items']['Row']

export type PlaylistItemWithMedia = PlaylistItem & { media: Media }

// playlist_items acá viene recortado a 1 fila server-side (order_index más bajo) —
// solo para mostrar una miniatura de vistazo en el listado, no una preview fiel.
export type PlaylistWithThumbnail = Playlist & {
  playlist_items: { media: { thumbnail_path: string | null } | null }[]
}

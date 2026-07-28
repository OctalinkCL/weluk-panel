import type { Database } from '@/lib/database.types'
import type { Media } from './media'

export type Playlist = Database['public']['Tables']['playlists']['Row']

export type PlaylistItem = Database['public']['Tables']['playlist_items']['Row']

export type PlaylistItemWithMedia = PlaylistItem & { media: Media }

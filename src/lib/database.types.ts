// Generado a mano desde weluk-schema.sql (sin acceso a Supabase CLI/Docker en este entorno).
// Reemplazar por el output real cuando haya acceso al proyecto:
//   supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          role: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          company_id?: string | null
          role: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          role?: string
          full_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      media: {
        Row: {
          id: string
          company_id: string
          type: string
          storage_path: string
          duration_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          storage_path: string
          duration_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          storage_path?: string
          duration_seconds?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'media_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      playlists: {
        Row: {
          id: string
          company_id: string
          name: string
          updated_at: string
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          updated_at?: string
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          updated_at?: string
          published_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'playlists_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      playlist_items: {
        Row: {
          id: string
          playlist_id: string
          media_id: string
          order_index: number
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          media_id: string
          order_index?: number
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          media_id?: string
          order_index?: number
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'playlist_items_playlist_id_fkey'
            columns: ['playlist_id']
            isOneToOne: false
            referencedRelation: 'playlists'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'playlist_items_media_id_fkey'
            columns: ['media_id']
            isOneToOne: false
            referencedRelation: 'media'
            referencedColumns: ['id']
          },
        ]
      }
      screens: {
        Row: {
          id: string
          company_id: string
          device_uuid: string
          name: string
          status: string
          current_playlist_id: string | null
          current_playlist_updated_at: string | null
          last_seen_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          device_uuid: string
          name: string
          status?: string
          current_playlist_id?: string | null
          current_playlist_updated_at?: string | null
          last_seen_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          device_uuid?: string
          name?: string
          status?: string
          current_playlist_id?: string | null
          current_playlist_updated_at?: string | null
          last_seen_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'screens_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'screens_current_playlist_id_fkey'
            columns: ['current_playlist_id']
            isOneToOne: false
            referencedRelation: 'playlists'
            referencedColumns: ['id']
          },
        ]
      }
      pairing_codes: {
        Row: {
          id: string
          code: string
          device_uuid: string
          status: string
          expires_at: string
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          device_uuid: string
          status?: string
          expires_at: string
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          device_uuid?: string
          status?: string
          expires_at?: string
          claimed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      auth_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; updated_at: string | null; full_name: string | null; avatar_url: string | null; website: string | null; role: 'admin' | 'photographer' | 'owner' | 'guest' }
        Insert: { id: string; updated_at?: string | null; full_name?: string | null; avatar_url?: string | null; website?: string | null; role?: 'admin' | 'photographer' | 'owner' | 'guest' }
        Update: { id?: string; updated_at?: string | null; full_name?: string | null; avatar_url?: string | null; website?: string | null; role?: 'admin' | 'photographer' | 'owner' | 'guest' }
      }
      events: {
        Row: { id: string; created_at: string; photographer_id: string; name: string; slug: string; date: string; location: string | null; cover_url: string | null; description: string | null; tier: 'starter' | 'pro' | 'premium'; is_public: boolean; status: string; watermark_enabled: boolean; download_enabled: boolean }
        Insert: { id?: string; created_at?: string; photographer_id: string; name: string; slug: string; date: string; location?: string | null; cover_url?: string | null; description?: string | null; tier?: 'starter' | 'pro' | 'premium'; is_public?: boolean; status?: string; watermark_enabled?: boolean; download_enabled?: boolean }
        Update: { id?: string; created_at?: string; photographer_id?: string; name?: string; slug?: string; date?: string; location?: string | null; cover_url?: string | null; description?: string | null; tier?: 'starter' | 'pro' | 'premium'; is_public?: boolean; status?: string; watermark_enabled?: boolean; download_enabled?: boolean }
      }
      photos: {
        Row: { id: string; created_at: string; event_id: string; url: string; thumbnail_url: string | null; width: number | null; height: number | null; original_name: string | null; is_hidden: boolean }
        Insert: { id?: string; created_at?: string; event_id: string; url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null; original_name?: string | null; is_hidden?: boolean }
        Update: { id?: string; created_at?: string; event_id?: string; url?: string; thumbnail_url?: string | null; width?: number | null; height?: number | null; original_name?: string | null; is_hidden?: boolean }
      }
      photo_faces: {
        Row: { id: string; photo_id: string; embedding: string | number[]; box_x: number | null; box_y: number | null; box_width: number | null; box_height: number | null }
        Insert: { id?: string; photo_id: string; embedding: string | number[]; box_x?: number | null; box_y?: number | null; box_width?: number | null; box_height?: number | null }
        Update: { id?: string; photo_id?: string; embedding?: string | number[]; box_x?: number | null; box_y?: number | null; box_width?: number | null; box_height?: number | null }
      }
    }
    Functions: {
      create_event_v3: {
        Args: { name: string; slug: string; date: string; location: string; description: string; tier: string }
        Returns: { id: string }
      }
      match_face_photos_v2: {
        Args: { query_embedding: string | number[]; match_threshold: number; match_count: number; filter_event_id: string }
        Returns: { id: string; url: string; similarity: number }[]
      }
    }
  }
}

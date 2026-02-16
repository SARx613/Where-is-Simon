export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; created_at: string; updated_at: string; username: string | null; full_name: string | null; avatar_url: string | null; website: string | null; role: 'admin' | 'photographer' | 'owner' | 'guest' }
        Insert: { id: string; created_at?: string; updated_at?: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; website?: string | null; role?: 'admin' | 'photographer' | 'owner' | 'guest' }
        Update: { id?: string; created_at?: string; updated_at?: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; website?: string | null; role?: 'admin' | 'photographer' | 'owner' | 'guest' }
      }
      events: {
        Row: { id: string; created_at: string; updated_at: string; photographer_id: string; owner_id: string | null; name: string; slug: string; date: string; location: string | null; cover_url: string | null; description: string | null; tier: 'starter' | 'pro' | 'premium'; is_public: boolean; status: string; watermark_enabled: boolean; watermark_text: string | null; watermark_opacity: number | null; download_enabled: boolean; enable_guestbook: boolean; enable_privacy_mode: boolean; enable_downloads: boolean; price_per_photo: number | null; currency: string | null }
        Insert: { id?: string; created_at?: string; updated_at?: string; photographer_id: string; owner_id?: string | null; name: string; slug: string; date: string; location?: string | null; cover_url?: string | null; description?: string | null; tier?: 'starter' | 'pro' | 'premium'; is_public?: boolean; status?: string; watermark_enabled?: boolean; watermark_text?: string | null; watermark_opacity?: number | null; download_enabled?: boolean; enable_guestbook?: boolean; enable_privacy_mode?: boolean; enable_downloads?: boolean; price_per_photo?: number | null; currency?: string | null }
        Update: { id?: string; created_at?: string; updated_at?: string; photographer_id?: string; owner_id?: string | null; name?: string; slug?: string; date?: string; location?: string | null; cover_url?: string | null; description?: string | null; tier?: 'starter' | 'pro' | 'premium'; is_public?: boolean; status?: string; watermark_enabled?: boolean; watermark_text?: string | null; watermark_opacity?: number | null; download_enabled?: boolean; enable_guestbook?: boolean; enable_privacy_mode?: boolean; enable_downloads?: boolean; price_per_photo?: number | null; currency?: string | null }
      }
      photos: {
        Row: { id: string; created_at: string; event_id: string; url: string; thumbnail_url: string | null; width: number | null; height: number | null; original_name: string | null; is_hidden: boolean; status: 'uploading' | 'processing' | 'ready' | 'error'; display_order: number | null }
        Insert: { id?: string; created_at?: string; event_id: string; url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null; original_name?: string | null; is_hidden?: boolean; status?: 'uploading' | 'processing' | 'ready' | 'error'; display_order?: number | null }
        Update: { id?: string; created_at?: string; event_id?: string; url?: string; thumbnail_url?: string | null; width?: number | null; height?: number | null; original_name?: string | null; is_hidden?: boolean; status?: 'uploading' | 'processing' | 'ready' | 'error'; display_order?: number | null }
      }
      photo_faces: {
        Row: { id: string; photo_id: string; embedding: string | number[]; box_x: number | null; box_y: number | null; box_width: number | null; box_height: number | null; confidence: number | null }
        Insert: { id?: string; photo_id: string; embedding: string | number[]; box_x?: number | null; box_y?: number | null; box_width?: number | null; box_height?: number | null; confidence?: number | null }
        Update: { id?: string; photo_id?: string; embedding?: string | number[]; box_x?: number | null; box_y?: number | null; box_width?: number | null; box_height?: number | null; confidence?: number | null }
      }
      guestbook_entries: {
        Row: { id: string; created_at: string; event_id: string; photo_id: string | null; author_name: string; author_email: string | null; message: string | null; audio_url: string | null; is_approved: boolean }
        Insert: { id?: string; created_at?: string; event_id: string; photo_id?: string | null; author_name: string; author_email?: string | null; message?: string | null; audio_url?: string | null; is_approved?: boolean }
        Update: { id?: string; created_at?: string; event_id?: string; photo_id?: string | null; author_name?: string; author_email?: string | null; message?: string | null; audio_url?: string | null; is_approved?: boolean }
      }
      photo_reports: {
        Row: { id: string; created_at: string; photo_id: string; reporter_email: string; reason: string; status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' }
        Insert: { id?: string; created_at?: string; photo_id: string; reporter_email: string; reason: string; status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed' }
        Update: { id?: string; created_at?: string; photo_id?: string; reporter_email?: string; reason?: string; status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed' }
      }
      orders: {
        Row: { id: string; created_at: string; event_id: string; customer_email: string; total_amount: number; status: 'pending' | 'paid' | 'failed' | 'refunded'; stripe_session_id: string | null }
        Insert: { id?: string; created_at?: string; event_id: string; customer_email: string; total_amount: number; status?: 'pending' | 'paid' | 'failed' | 'refunded'; stripe_session_id?: string | null }
        Update: { id?: string; created_at?: string; event_id?: string; customer_email?: string; total_amount?: number; status?: 'pending' | 'paid' | 'failed' | 'refunded'; stripe_session_id?: string | null }
      }
      order_items: {
        Row: { id: string; order_id: string; photo_id: string; product_type: string; quantity: number; price: number }
        Insert: { id?: string; order_id: string; photo_id: string; product_type: string; quantity?: number; price: number }
        Update: { id?: string; order_id?: string; photo_id?: string; product_type?: string; quantity?: number; price?: number }
      }
      photo_likes: {
        Row: { id: string; created_at: string; photo_id: string; user_id: string }
        Insert: { id?: string; created_at?: string; photo_id: string; user_id: string }
        Update: { id?: string; created_at?: string; photo_id?: string; user_id?: string }
      }
      notifications: {
        Row: { id: string; created_at: string; user_id: string; title: string; message: string; is_read: boolean; read_at: string | null }
        Insert: { id?: string; created_at?: string; user_id: string; title: string; message: string; is_read?: boolean; read_at?: string | null }
        Update: { id?: string; created_at?: string; user_id?: string; title?: string; message?: string; is_read?: boolean; read_at?: string | null }
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

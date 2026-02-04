export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: 'admin' | 'photographer' | 'owner' | 'guest'
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: 'admin' | 'photographer' | 'owner' | 'guest'
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: 'admin' | 'photographer' | 'owner' | 'guest'
        }
      }
      events: {
        Row: {
          id: string
          created_at: string
          photographer_id: string
          name: string
          slug: string
          date: string
          location: string | null
          cover_url: string | null
          description: string | null
          tier: 'starter' | 'pro' | 'premium'
          is_public: boolean
          status: string
          watermark_enabled: boolean
          download_enabled: boolean
          owner_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          photographer_id: string
          name: string
          slug: string
          date: string
          location?: string | null
          cover_url?: string | null
          description?: string | null
          tier?: 'starter' | 'pro' | 'premium'
          is_public?: boolean
          status?: string
          watermark_enabled?: boolean
          download_enabled?: boolean
          owner_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          photographer_id?: string
          name?: string
          slug?: string
          date?: string
          location?: string | null
          cover_url?: string | null
          description?: string | null
          tier?: 'starter' | 'pro' | 'premium'
          is_public?: boolean
          status?: string
          watermark_enabled?: boolean
          download_enabled?: boolean
          owner_id?: string | null
        }
      }
      photos: {
        Row: {
          id: string
          created_at: string
          event_id: string
          url: string
          thumbnail_url: string | null
          width: number | null
          height: number | null
          embedding: string | null
          original_name: string | null
          is_hidden: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          url: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          embedding?: string | number[] | null
          original_name?: string | null
          is_hidden?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          url?: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          embedding?: string | number[] | null
          original_name?: string | null
          is_hidden?: boolean
        }
      }
      photo_faces: {
        Row: {
          id: string
          photo_id: string
          embedding: string | number[]
          box_x: number | null
          box_y: number | null
          box_width: number | null
          box_height: number | null
        }
        Insert: {
          id?: string
          photo_id: string
          embedding: string | number[]
          box_x?: number | null
          box_y?: number | null
          box_width?: number | null
          box_height?: number | null
        }
        Update: {
          id?: string
          photo_id?: string
          embedding?: string | number[]
          box_x?: number | null
          box_y?: number | null
          box_width?: number | null
          box_height?: number | null
        }
      }
      guestbook_entries: {
        Row: {
          id: string
          created_at: string
          event_id: string
          photo_id: string | null
          author_name: string
          message: string | null
          audio_url: string | null
          is_approved: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          photo_id?: string | null
          author_name: string
          message?: string | null
          audio_url?: string | null
          is_approved?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          photo_id?: string | null
          author_name?: string
          message?: string | null
          audio_url?: string | null
          is_approved?: boolean
        }
      }
      photo_reports: {
        Row: {
          id: string
          created_at: string
          photo_id: string
          reporter_email: string | null
          reason: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          photo_id: string
          reporter_email?: string | null
          reason?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          photo_id?: string
          reporter_email?: string | null
          reason?: string | null
          status?: string
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          event_id: string
          customer_email: string
          total_amount: number
          status: string
          stripe_session_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          customer_email: string
          total_amount: number
          status?: string
          stripe_session_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          customer_email?: string
          total_amount?: number
          status?: string
          stripe_session_id?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          photo_id: string
          product_type: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          order_id: string
          photo_id: string
          product_type: string
          quantity?: number
          price: number
        }
        Update: {
          id?: string
          order_id?: string
          photo_id?: string
          product_type?: string
          quantity?: number
          price?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_face_photos: {
        Args: {
          query_embedding: string | number[]
          match_threshold: number
          match_count: number
          filter_event_id: string
        }
        Returns: {
          id: string
          url: string
          similarity: number
        }[]
      }
      match_face_photos_v2: {
        Args: {
          query_embedding: string | number[]
          match_threshold: number
          match_count: number
          filter_event_id: string
        }
        Returns: {
          id: string
          url: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: 'admin' | 'photographer' | 'owner' | 'guest'
      event_tier: 'starter' | 'pro' | 'premium'
    }
  }
}

// These type definitions are based on the Supabase schema in `db/supabase_schema.sql`

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
          role: 'user' | 'merchant' | 'admin'
          wallet_address: string | null
          created_at: string
          updated_at: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          did: string | null
        }
        Insert: {
          id: string
          role?: 'user' | 'merchant' | 'admin'
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          did?: string | null
        }
        Update: {
          id?: string
          role?: 'user' | 'merchant' | 'admin'
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          did?: string | null
        }
      }
      merchants: {
        Row: {
          id: string
          business_name: string
          business_registration_number: string | null
          business_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_name: string
          business_registration_number?: string | null
          business_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          business_registration_number?: string | null
          business_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types here as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      user_role: 'user' | 'merchant' | 'admin'
    }
  }
}

// Custom type alias for Profile for easier use in the app
export type Profile = Database['public']['Tables']['profiles']['Row'];
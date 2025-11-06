// Database types based on Supabase schema
// Generated from PRD Part 8: Data Models & Database Schema

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
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string | null
          currency: string
          timezone: string
          language: string
          custom_domain: string | null
          custom_supabase_url: string | null
          custom_supabase_anon_key: string | null
          plan: string
          seats_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string | null
          currency?: string
          timezone?: string
          language?: string
          custom_domain?: string | null
          custom_supabase_url?: string | null
          custom_supabase_anon_key?: string | null
          plan?: string
          seats_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string | null
          currency?: string
          timezone?: string
          language?: string
          custom_domain?: string | null
          custom_supabase_url?: string | null
          custom_supabase_anon_key?: string | null
          plan?: string
          seats_limit?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          workspace_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          permissions: Json
          status: string
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          workspace_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          permissions?: Json
          status?: string
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          permissions?: Json
          status?: string
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string | null
          phone: string | null
          company_id: string | null
          tags: string[]
          notes: string | null
          custom_fields: Json
          source: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email?: string | null
          phone?: string | null
          company_id?: string | null
          tags?: string[]
          notes?: string | null
          custom_fields?: Json
          source?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company_id?: string | null
          tags?: string[]
          notes?: string | null
          custom_fields?: Json
          source?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          workspace_id: string
          name: string
          website: string | null
          industry: string | null
          size: string | null
          tax_id: string | null
          notes: string | null
          custom_fields: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          website?: string | null
          industry?: string | null
          size?: string | null
          tax_id?: string | null
          notes?: string | null
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          website?: string | null
          industry?: string | null
          size?: string | null
          tax_id?: string | null
          notes?: string | null
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          workspace_id: string
          title: string
          contact_id: string
          stage: string
          amount: number | null
          currency: string
          probability: number | null
          expected_close_date: string | null
          assigned_to: string | null
          products: Json
          notes: string | null
          custom_fields: Json
          tags: string[]
          won_at: string | null
          lost_at: string | null
          lost_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          contact_id: string
          stage: string
          amount?: number | null
          currency?: string
          probability?: number | null
          expected_close_date?: string | null
          assigned_to?: string | null
          products?: Json
          notes?: string | null
          custom_fields?: Json
          tags?: string[]
          won_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          contact_id?: string
          stage?: string
          amount?: number | null
          currency?: string
          probability?: number | null
          expected_close_date?: string | null
          assigned_to?: string | null
          products?: Json
          notes?: string | null
          custom_fields?: Json
          tags?: string[]
          won_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          category: string | null
          sku: string | null
          base_price: number | null
          currency: string
          type: string
          weight_kg: number | null
          dimensions_cm: Json | null
          images: string[]
          specs: Json
          deliverables: string[]
          delivery_time_days: number | null
          active: boolean
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          category?: string | null
          sku?: string | null
          base_price?: number | null
          currency?: string
          type?: string
          weight_kg?: number | null
          dimensions_cm?: Json | null
          images?: string[]
          specs?: Json
          deliverables?: string[]
          delivery_time_days?: number | null
          active?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          category?: string | null
          sku?: string | null
          base_price?: number | null
          currency?: string
          type?: string
          weight_kg?: number | null
          dimensions_cm?: Json | null
          images?: string[]
          specs?: Json
          deliverables?: string[]
          delivery_time_days?: number | null
          active?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

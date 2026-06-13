export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      delivery_history: {
        Row: {
          failure_count: number | null
          id: string
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          status: string | null
          story_number: number
          user_id: string | null
        }
        Insert: {
          failure_count?: number | null
          id?: string
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          story_number: number
          user_id?: string | null
        }
        Update: {
          failure_count?: number | null
          id?: string
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          story_number?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          category: string | null
          content_blocks: Json
          created_at: string | null
          date_label: string | null
          disclaimer: string | null
          id: string
          pool: string | null
          preheader: string | null
          read_minutes: number | null
          sequence_position: number | null
          slug: string | null
          sources: Json | null
          status: string | null
          story_number: number
          subject_line: string | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          category?: string | null
          content_blocks: Json
          created_at?: string | null
          date_label?: string | null
          disclaimer?: string | null
          id?: string
          pool?: string | null
          preheader?: string | null
          read_minutes?: number | null
          sequence_position?: number | null
          slug?: string | null
          sources?: Json | null
          status?: string | null
          story_number: number
          subject_line?: string | null
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          category?: string | null
          content_blocks?: Json
          created_at?: string | null
          date_label?: string | null
          disclaimer?: string | null
          id?: string
          pool?: string | null
          preheader?: string | null
          read_minutes?: number | null
          sequence_position?: number | null
          slug?: string | null
          sources?: Json | null
          status?: string | null
          story_number?: number
          subject_line?: string | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      story_sends: {
        Row: {
          failure_count: number
          id: string
          resend_id: string | null
          sent_at: string
          status: string
          story_number: number | null
          subscriber_id: string
          type: string
        }
        Insert: {
          failure_count?: number
          id?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
          story_number?: number | null
          subscriber_id: string
          type: string
        }
        Update: {
          failure_count?: number
          id?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
          story_number?: number | null
          subscriber_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          bounced: boolean
          complained: boolean
          created_at: string
          currency: string
          email: string
          funnel_step: number
          id: string
          next_send_at: string | null
          signup_source: string | null
          status: string
          timezone: string | null
        }
        Insert: {
          bounced?: boolean
          complained?: boolean
          created_at?: string
          currency?: string
          email: string
          funnel_step?: number
          id?: string
          next_send_at?: string | null
          signup_source?: string | null
          status?: string
          timezone?: string | null
        }
        Update: {
          bounced?: boolean
          complained?: boolean
          created_at?: string
          currency?: string
          email?: string
          funnel_step?: number
          id?: string
          next_send_at?: string | null
          signup_source?: string | null
          status?: string
          timezone?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          amount_paid: number
          bounced: boolean
          complained: boolean
          created_at: string | null
          currency: string
          current_story: number | null
          dodo_payment_id: string | null
          email: string
          id: string
          purchased_at: string | null
          refunded: boolean | null
          timezone: string | null
          unsubscribed: boolean | null
        }
        Insert: {
          amount_paid: number
          bounced?: boolean
          complained?: boolean
          created_at?: string | null
          currency: string
          current_story?: number | null
          dodo_payment_id?: string | null
          email: string
          id?: string
          purchased_at?: string | null
          refunded?: boolean | null
          timezone?: string | null
          unsubscribed?: boolean | null
        }
        Update: {
          amount_paid?: number
          bounced?: boolean
          complained?: boolean
          created_at?: string | null
          currency?: string
          current_story?: number | null
          dodo_payment_id?: string | null
          email?: string
          id?: string
          purchased_at?: string | null
          refunded?: boolean | null
          timezone?: string | null
          unsubscribed?: boolean | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

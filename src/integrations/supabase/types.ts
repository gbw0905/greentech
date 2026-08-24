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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alert_subscribers: {
        Row: {
          cadence: string
          confirm_token: string
          confirmed_at: string | null
          countries: string[]
          created_at: string
          email: string
          fuels: string[]
          id: string
          last_sent_at: string | null
          last_weekly_sent_at: string | null
          plan: string
          updated_at: string
        }
        Insert: {
          cadence?: string
          confirm_token?: string
          confirmed_at?: string | null
          countries?: string[]
          created_at?: string
          email: string
          fuels?: string[]
          id?: string
          last_sent_at?: string | null
          last_weekly_sent_at?: string | null
          plan?: string
          updated_at?: string
        }
        Update: {
          cadence?: string
          confirm_token?: string
          confirmed_at?: string | null
          countries?: string[]
          created_at?: string
          email?: string
          fuels?: string[]
          id?: string
          last_sent_at?: string | null
          last_weekly_sent_at?: string | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      brief_sends: {
        Row: {
          cadence: string
          created_at: string
          email: string
          id: string
          sent_at: string
          subscriber_id: string | null
          update_id: string | null
        }
        Insert: {
          cadence?: string
          created_at?: string
          email: string
          id?: string
          sent_at?: string
          subscriber_id?: string | null
          update_id?: string | null
        }
        Update: {
          cadence?: string
          created_at?: string
          email?: string
          id?: string
          sent_at?: string
          subscriber_id?: string | null
          update_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "alert_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_sends_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "policy_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_drafts: {
        Row: {
          created_at: string
          day_key: string
          emailed_at: string | null
          id: string
          items: Json
          linkedin_post_urn: string | null
          post_text: string
          publish_token_hash: string
          published_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          day_key: string
          emailed_at?: string | null
          id?: string
          items?: Json
          linkedin_post_urn?: string | null
          post_text: string
          publish_token_hash: string
          published_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          day_key?: string
          emailed_at?: string | null
          id?: string
          items?: Json
          linkedin_post_urn?: string | null
          post_text?: string
          publish_token_hash?: string
          published_at?: string | null
          status?: string
        }
        Relationships: []
      }
      linkedin_org_connections: {
        Row: {
          access_token: string
          access_token_expires_at: string
          connected_at: string
          id: boolean
          org_id: string | null
          org_name: string | null
          person_name: string | null
          person_urn: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          scope: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          access_token_expires_at: string
          connected_at?: string
          id?: boolean
          org_id?: string | null
          org_name?: string | null
          person_name?: string | null
          person_urn?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string
          connected_at?: string
          id?: boolean
          org_id?: string | null
          org_name?: string | null
          person_name?: string | null
          person_urn?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      linkedin_settings: {
        Row: {
          company_org_id: string
          company_page_url: string
          id: boolean
          posting_mode: string
          updated_at: string
        }
        Insert: {
          company_org_id?: string
          company_page_url?: string
          id?: boolean
          posting_mode?: string
          updated_at?: string
        }
        Update: {
          company_org_id?: string
          company_page_url?: string
          id?: boolean
          posting_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_updates: {
        Row: {
          ai_brief: string | null
          ai_brief_at: string | null
          category: string
          country_name: string | null
          country_slug: string | null
          created_at: string
          fuels: string[]
          id: string
          published_at: string | null
          region: string
          source: string
          summary: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          ai_brief?: string | null
          ai_brief_at?: string | null
          category?: string
          country_name?: string | null
          country_slug?: string | null
          created_at?: string
          fuels?: string[]
          id?: string
          published_at?: string | null
          region?: string
          source?: string
          summary?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          ai_brief?: string | null
          ai_brief_at?: string | null
          category?: string
          country_name?: string | null
          country_slug?: string | null
          created_at?: string
          fuels?: string[]
          id?: string
          published_at?: string | null
          region?: string
          source?: string
          summary?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_traffic_stats: { Args: never; Returns: Json }
      record_visit: {
        Args: {
          _country?: string
          _path: string
          _referrer?: string
          _visitor_id: string
        }
        Returns: undefined
      }
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

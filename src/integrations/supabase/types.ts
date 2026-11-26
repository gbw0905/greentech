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
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_analyses: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          keywords: string[]
          analysis: Json
          created_at: string
          file_path: string | null
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: string
          keywords?: string[]
          analysis: Json
          created_at?: string
          file_path?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          keywords?: string[]
          analysis?: Json
          created_at?: string
          file_path?: string | null
        }
        Relationships: []
      }
      country_enrichment_log: {
        Row: {
          id: string
          country_slug: string
          enrichment_type: string
          articles_used: string[]
          result_summary: string | null
          created_at: string
          changes: Json | null
          evidence: Json | null
        }
        Insert: {
          id?: string
          country_slug: string
          enrichment_type: string
          articles_used?: string[]
          result_summary?: string | null
          created_at?: string
          changes?: Json | null
          evidence?: Json | null
        }
        Update: {
          id?: string
          country_slug?: string
          enrichment_type?: string
          articles_used?: string[]
          result_summary?: string | null
          created_at?: string
          changes?: Json | null
          evidence?: Json | null
        }
        Relationships: []
      }
      country_mandates: {
        Row: {
          id: string
          country_slug: string | null
          jurisdiction: string
          instrument: string
          fuels: string[]
          status: string
          current_obligation: string
          requirements: string[]
          compliance: Json
          timeline: Json
          source_name: string | null
          source_url: string | null
          official_sites: Json | null
          keywords: string[] | null
          last_reviewed: string | null
          ai_updated_at: string | null
          last_enriched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          country_slug?: string | null
          jurisdiction: string
          instrument: string
          fuels?: string[]
          status?: string
          current_obligation: string
          requirements?: string[]
          compliance?: Json
          timeline?: Json
          source_name?: string | null
          source_url?: string | null
          official_sites?: Json | null
          keywords?: string[] | null
          last_reviewed?: string | null
          ai_updated_at?: string | null
          last_enriched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          country_slug?: string | null
          jurisdiction?: string
          instrument?: string
          fuels?: string[]
          status?: string
          current_obligation?: string
          requirements?: string[]
          compliance?: Json
          timeline?: Json
          source_name?: string | null
          source_url?: string | null
          official_sites?: Json | null
          keywords?: string[] | null
          last_reviewed?: string | null
          ai_updated_at?: string | null
          last_enriched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_profiles: {
        Row: {
          id: string
          country_slug: string
          blurb: string | null
          mandates: Json
          frameworks: string[]
          policy_status: string | null
          ai_blurb_at: string | null
          ai_status_at: string | null
          last_enriched_at: string | null
          created_at: string
          updated_at: string
          last_change_at: string | null
          last_change_fields: string[]
          last_change_source_url: string | null
          last_change_source_title: string | null
          last_change_source_name: string | null
          last_change_quote: string | null
        }
        Insert: {
          id?: string
          country_slug: string
          blurb?: string | null
          mandates?: Json
          frameworks?: string[]
          policy_status?: string | null
          ai_blurb_at?: string | null
          ai_status_at?: string | null
          last_enriched_at?: string | null
          created_at?: string
          updated_at?: string
          last_change_at?: string | null
          last_change_fields?: string[]
          last_change_source_url?: string | null
          last_change_source_title?: string | null
          last_change_source_name?: string | null
          last_change_quote?: string | null
        }
        Update: {
          id?: string
          country_slug?: string
          blurb?: string | null
          mandates?: Json
          frameworks?: string[]
          policy_status?: string | null
          ai_blurb_at?: string | null
          ai_status_at?: string | null
          last_enriched_at?: string | null
          created_at?: string
          updated_at?: string
          last_change_at?: string | null
          last_change_fields?: string[]
          last_change_source_url?: string | null
          last_change_source_title?: string | null
          last_change_source_name?: string | null
          last_change_quote?: string | null
        }
        Relationships: []
      }
      ci_runs: {
        Row: {
          annual_energy_mj: number
          annual_tonnes_co2e: number
          ci_total: number
          created_at: string
          credits_ci: number
          feedstock_label: string
          gross_ci: number
          id: string
          inputs: Json
          name: string
          pathway_id: string
          pathway_label: string
          programs: Json
          region_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_energy_mj?: number
          annual_tonnes_co2e?: number
          ci_total: number
          created_at?: string
          credits_ci?: number
          feedstock_label?: string
          gross_ci?: number
          id?: string
          inputs?: Json
          name?: string
          pathway_id: string
          pathway_label: string
          programs?: Json
          region_label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_energy_mj?: number
          annual_tonnes_co2e?: number
          ci_total?: number
          created_at?: string
          credits_ci?: number
          feedstock_label?: string
          gross_ci?: number
          id?: string
          inputs?: Json
          name?: string
          pathway_id?: string
          pathway_label?: string
          programs?: Json
          region_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      civanta_calculations: {
        Row: {
          ci: number
          created_at: string
          engine_version: string
          id: string
          input_hash: string
          inputs: Json
          parts: Json
          pathway_id: string
          pathway_label: string
          plant_id: string
          plant_name: string
          user_id: string
        }
        Insert: {
          ci: number
          created_at?: string
          engine_version: string
          id?: string
          input_hash: string
          inputs: Json
          parts?: Json
          pathway_id: string
          pathway_label?: string
          plant_id: string
          plant_name: string
          user_id: string
        }
        Update: {
          ci?: number
          created_at?: string
          engine_version?: string
          id?: string
          input_hash?: string
          inputs?: Json
          parts?: Json
          pathway_id?: string
          pathway_label?: string
          plant_id?: string
          plant_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "civanta_calculations_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "civanta_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      civanta_plants: {
        Row: {
          calculated: boolean
          created_at: string
          id: string
          latest_ci: number | null
          model: Json | null
          name: string
          pathway_id: string
          pathway_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated?: boolean
          created_at?: string
          id?: string
          latest_ci?: number | null
          model?: Json | null
          name: string
          pathway_id?: string
          pathway_label?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated?: boolean
          created_at?: string
          id?: string
          latest_ci?: number | null
          model?: Json | null
          name?: string
          pathway_id?: string
          pathway_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flyer_generations: {
        Row: {
          created_at: string
          day_key: string
          emailed_at: string | null
          emailed_to: string | null
          id: string
          image_base64: string | null
          items_json: Json
          prompt: string
        }
        Insert: {
          created_at?: string
          day_key: string
          emailed_at?: string | null
          emailed_to?: string | null
          id?: string
          image_base64?: string | null
          items_json?: Json
          prompt: string
        }
        Update: {
          created_at?: string
          day_key?: string
          emailed_at?: string | null
          emailed_to?: string | null
          id?: string
          image_base64?: string | null
          items_json?: Json
          prompt?: string
        }
        Relationships: []
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
      premium_members: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          note: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          updated_at?: string
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
      official_price_cache: {
        Row: {
          cache_key: string
          payload: Json
          source_url: string
          fetched_at: string
        }
        Insert: {
          cache_key: string
          payload: Json
          source_url: string
          fetched_at?: string
        }
        Update: {
          cache_key?: string
          payload?: Json
          source_url?: string
          fetched_at?: string
        }
        Relationships: []
      }
      video_cache: {
        Row: {
          cache_key: string
          kind: string
          payload: Json
          fetched_at: string
        }
        Insert: {
          cache_key: string
          kind: string
          payload?: Json
          fetched_at?: string
        }
        Update: {
          cache_key?: string
          kind?: string
          payload?: Json
          fetched_at?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

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
      api_keys: {
        Row: {
          created_at: string
          hashed_key: string
          id: string
          last_used_at: string | null
          name: string
          org_id: string
          revoked: boolean
        }
        Insert: {
          created_at?: string
          hashed_key: string
          id?: string
          last_used_at?: string | null
          name: string
          org_id: string
          revoked?: boolean
        }
        Update: {
          created_at?: string
          hashed_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          ip: string | null
          org_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          org_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          org_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      exports: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      genome_snapshots: {
        Row: {
          categories: Json
          id: string
          indices: Json
          overall_score: number
          session_id: string
          timestamp_ms: number
          traits: Json
        }
        Insert: {
          categories: Json
          id?: string
          indices: Json
          overall_score: number
          session_id: string
          timestamp_ms: number
          traits: Json
        }
        Update: {
          categories?: Json
          id?: string
          indices?: Json
          overall_score?: number
          session_id?: string
          timestamp_ms?: number
          traits?: Json
        }
        Relationships: [
          {
            foreignKeyName: "genome_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          id: string
          max_retries: number
          org_id: string | null
          payload_json: Json | null
          result_json: Json | null
          retry_count: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_retries?: number
          org_id?: string | null
          payload_json?: Json | null
          result_json?: Json | null
          retry_count?: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_retries?: number
          org_id?: string | null
          payload_json?: Json | null
          result_json?: Json | null
          retry_count?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          data: Json
          id: string
          session_id: string
          timestamp_ms: number
        }
        Insert: {
          data: Json
          id?: string
          session_id: string
          timestamp_ms: number
        }
        Update: {
          data?: Json
          id?: string
          session_id?: string
          timestamp_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          org_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          org_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          org_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          id: string
          joined_at: string
          org_id: string
          role_in_org: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          org_id: string
          role_in_org?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          org_id?: string
          role_in_org?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          allow_heatmap: boolean
          allow_live_mode: boolean
          allow_voice: boolean
          id: string
          org_id: string
          retention_days: number
          thresholds_json: Json
          transcript_storage_default: boolean
          updated_at: string
        }
        Insert: {
          allow_heatmap?: boolean
          allow_live_mode?: boolean
          allow_voice?: boolean
          id?: string
          org_id: string
          retention_days?: number
          thresholds_json?: Json
          transcript_storage_default?: boolean
          updated_at?: string
        }
        Update: {
          allow_heatmap?: boolean
          allow_live_mode?: boolean
          allow_voice?: boolean
          id?: string
          org_id?: string
          retention_days?: number
          thresholds_json?: Json
          transcript_storage_default?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string
          key: string
        }
        Insert: {
          created_at?: string
          description: string
          key: string
        }
        Update: {
          created_at?: string
          description?: string
          key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          data_processing_consent: boolean
          display_name: string | null
          eye_tracking_consent: boolean
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          data_processing_consent?: boolean
          display_name?: string | null
          eye_tracking_consent?: boolean
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          data_processing_consent?: boolean
          display_name?: string | null
          eye_tracking_consent?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_assets: {
        Row: {
          asset_type: string
          id: string
          question_id: string
          url: string
        }
        Insert: {
          asset_type: string
          id?: string
          question_id: string
          url: string
        }
        Update: {
          asset_type?: string
          id?: string
          question_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_assets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          created_at: string
          created_by: string
          difficulty: number
          id: string
          org_id: string | null
          published: boolean
          stem: string
          subject: string | null
          tags_json: Json | null
          title: string
          topic: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          difficulty?: number
          id?: string
          org_id?: string | null
          published?: boolean
          stem: string
          subject?: string | null
          tags_json?: Json | null
          title: string
          topic?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          difficulty?: number
          id?: string
          org_id?: string | null
          published?: boolean
          stem?: string
          subject?: string | null
          tags_json?: Json | null
          title?: string
          topic?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      question_hints: {
        Row: {
          asset_url: string | null
          content: string
          hint_type: string
          id: string
          question_id: string
        }
        Insert: {
          asset_url?: string | null
          content: string
          hint_type?: string
          id?: string
          question_id: string
        }
        Update: {
          asset_url?: string | null
          content?: string
          hint_type?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_hints_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          correct_answer: string
          id: string
          options_json: Json
          question_id: string
        }
        Insert: {
          correct_answer: string
          id?: string
          options_json?: Json
          question_id: string
        }
        Update: {
          correct_answer?: string
          id?: string
          options_json?: Json
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          id: string
          permission_key: string
          role: string
        }
        Insert: {
          allowed?: boolean
          id?: string
          permission_key: string
          role: string
        }
        Update: {
          allowed?: boolean
          id?: string
          permission_key?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      session_events: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          session_id: string
          timestamp_ms: number
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json | null
          session_id: string
          timestamp_ms: number
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          session_id?: string
          timestamp_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          avg_confusion: number | null
          avg_fatigue: number | null
          ended_at: string | null
          id: string
          mode: string
          overall_score: number | null
          persona: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          avg_confusion?: number | null
          avg_fatigue?: number | null
          ended_at?: string | null
          id?: string
          mode?: string
          overall_score?: number | null
          persona?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          avg_confusion?: number | null
          avg_fatigue?: number | null
          ended_at?: string | null
          id?: string
          mode?: string
          overall_score?: number | null
          persona?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_metrics_daily: {
        Row: {
          date: string
          id: string
          metrics_json: Json
          org_id: string | null
        }
        Insert: {
          date: string
          id?: string
          metrics_json?: Json
          org_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          metrics_json?: Json
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_metrics_daily_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions_override: {
        Row: {
          allowed: boolean
          id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          allowed: boolean
          id?: string
          permission_key: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_override_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          enabled: boolean
          events_json: Json
          id: string
          org_id: string
          secret: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          events_json?: Json
          id?: string
          org_id: string
          secret: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          events_json?: Json
          id?: string
          org_id?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_session: { Args: { _session_id: string }; Returns: boolean }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
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
    Enums: {
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const

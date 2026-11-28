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
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          threshold: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id: string
          threshold?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          threshold?: number
          title?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          author_id: string | null
          body: string
          created_at: string
          id: string
          published: boolean
          title: string
        }
        Insert: {
          audience?: string
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          published?: boolean
          title: string
        }
        Update: {
          audience?: string
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          published?: boolean
          title?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          ayah: number
          created_at: string
          id: string
          note: string | null
          surah: number
          user_id: string
        }
        Insert: {
          ayah: number
          created_at?: string
          id?: string
          note?: string | null
          surah: number
          user_id: string
        }
        Update: {
          ayah?: number
          created_at?: string
          id?: string
          note?: string | null
          surah?: number
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          description: string | null
          id: string
          issued_at: string
          issuer: string
          surah_from: number | null
          surah_to: number | null
          title: string
          user_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          issued_at?: string
          issuer?: string
          surah_from?: number | null
          surah_to?: number | null
          title: string
          user_id: string
        }
        Update: {
          description?: string | null
          id?: string
          issued_at?: string
          issuer?: string
          surah_from?: number | null
          surah_to?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          ayah: number | null
          created_at: string
          id: string
          note: string | null
          surah: number
          user_id: string
        }
        Insert: {
          ayah?: number | null
          created_at?: string
          id?: string
          note?: string | null
          surah: number
          user_id: string
        }
        Update: {
          ayah?: number | null
          created_at?: string
          id?: string
          note?: string | null
          surah?: number
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          rating: number | null
          resolved: boolean
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          rating?: number | null
          resolved?: boolean
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          rating?: number | null
          resolved?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      hifz_plans: {
        Row: {
          completed_ayahs: Json
          completed_juz: Json
          completed_surahs: Json
          created_at: string
          current_task: Json
          daily_target: number
          history: Json
          id: string
          starting_juz: number
          status: string
          updated_at: string
          user_id: string
          weak_ayahs: Json
        }
        Insert: {
          completed_ayahs?: Json
          completed_juz?: Json
          completed_surahs?: Json
          created_at?: string
          current_task?: Json
          daily_target?: number
          history?: Json
          id?: string
          starting_juz?: number
          status?: string
          updated_at?: string
          user_id: string
          weak_ayahs?: Json
        }
        Update: {
          completed_ayahs?: Json
          completed_juz?: Json
          completed_surahs?: Json
          created_at?: string
          current_task?: Json
          daily_target?: number
          history?: Json
          id?: string
          starting_juz?: number
          status?: string
          updated_at?: string
          user_id?: string
          weak_ayahs?: Json
        }
        Relationships: []
      }
      hifz_progress: {
        Row: {
          id: string
          last_revised_at: string | null
          percent: number
          status: string
          streak_days: number
          surah: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_revised_at?: string | null
          percent?: number
          status?: string
          streak_days?: number
          surah: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_revised_at?: string | null
          percent?: number
          status?: string
          streak_days?: number
          surah?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      last_read: {
        Row: {
          ayah: number
          surah: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ayah: number
          surah: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ayah?: number
          surah?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_child_links: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          language: string
          notification_prefs: Json
          theme: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          language?: string
          notification_prefs?: Json
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string
          notification_prefs?: Json
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      quran_revision_plans: {
        Row: {
          completed_portions: Json
          created_at: string
          duration_days: number
          id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
          weak_ayahs: Json
        }
        Insert: {
          completed_portions?: Json
          created_at?: string
          duration_days: number
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
          weak_ayahs?: Json
        }
        Update: {
          completed_portions?: Json
          created_at?: string
          duration_days?: number
          id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          weak_ayahs?: Json
        }
        Relationships: []
      }
      recitation_sessions: {
        Row: {
          accuracy: number
          ai_advice: string | null
          completed: boolean
          created_at: string
          duration_ms: number
          end_ayah: number
          id: string
          pronunciation_score: number
          start_ayah: number
          surah_id: number
          tajweed_notes: Json
          updated_at: string
          user_id: string
          word_states: Json
          words_matched: number
          words_missing: number
          words_total: number
          words_wrong: number
          wpm: number
        }
        Insert: {
          accuracy?: number
          ai_advice?: string | null
          completed?: boolean
          created_at?: string
          duration_ms?: number
          end_ayah: number
          id?: string
          pronunciation_score?: number
          start_ayah: number
          surah_id: number
          tajweed_notes?: Json
          updated_at?: string
          user_id: string
          word_states?: Json
          words_matched?: number
          words_missing?: number
          words_total?: number
          words_wrong?: number
          wpm?: number
        }
        Update: {
          accuracy?: number
          ai_advice?: string | null
          completed?: boolean
          created_at?: string
          duration_ms?: number
          end_ayah?: number
          id?: string
          pronunciation_score?: number
          start_ayah?: number
          surah_id?: number
          tajweed_notes?: Json
          updated_at?: string
          user_id?: string
          word_states?: Json
          words_matched?: number
          words_missing?: number
          words_total?: number
          words_wrong?: number
          wpm?: number
        }
        Relationships: []
      }
      teacher_students: {
        Row: {
          created_at: string
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          daily_minutes_target: number
          id: string
          updated_at: string
          user_id: string
          weekly_sessions_target: number
        }
        Insert: {
          created_at?: string
          daily_minutes_target?: number
          id?: string
          updated_at?: string
          user_id: string
          weekly_sessions_target?: number
        }
        Update: {
          created_at?: string
          daily_minutes_target?: number
          id?: string
          updated_at?: string
          user_id?: string
          weekly_sessions_target?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "parent" | "admin"
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
    Enums: {
      app_role: ["student", "teacher", "parent", "admin"],
    },
  },
} as const

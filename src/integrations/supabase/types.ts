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
      day_offs: {
        Row: {
          created_at: string
          day_date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day_date: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          color: string
          completed: boolean
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          location: string | null
          period: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          location?: string | null
          period?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          location?: string | null
          period?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          created_at: string
          done: boolean
          goal_id: string
          id: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          goal_id: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          goal_id?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          color: string
          completed_at: string | null
          completion_photo: string | null
          created_at: string
          description: string | null
          horizon: string
          id: string
          progress: number
          sort_order: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string
          completed_at?: string | null
          completion_photo?: string | null
          created_at?: string
          description?: string | null
          horizon?: string
          id?: string
          progress?: number
          sort_order?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string
          completed_at?: string | null
          completion_photo?: string | null
          created_at?: string
          description?: string | null
          horizon?: string
          id?: string
          progress?: number
          sort_order?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          color: string
          created_at: string
          frequency: string
          goal_id: string | null
          icon: string | null
          id: string
          name: string
          period: string | null
          reminder_time: string | null
          sort_order: number
          updated_at: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          archived?: boolean
          color?: string
          created_at?: string
          frequency?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          name: string
          period?: string | null
          reminder_time?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
          weekdays?: number[]
        }
        Update: {
          archived?: boolean
          color?: string
          created_at?: string
          frequency?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          period?: string | null
          reminder_time?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      month_summaries: {
        Row: {
          completion_pct: number
          created_at: string
          goals_done: number
          habits_done: number
          habits_total: number
          id: string
          moments_count: number
          month_key: string
          photos: Json
          reflection: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_pct?: number
          created_at?: string
          goals_done?: number
          habits_done?: number
          habits_total?: number
          id?: string
          moments_count?: number
          month_key: string
          photos?: Json
          reflection?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_pct?: number
          created_at?: string
          goals_done?: number
          habits_done?: number
          habits_total?: number
          id?: string
          moments_count?: number
          month_key?: string
          photos?: Json
          reflection?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      period_goals: {
        Row: {
          created_at: string
          done: boolean
          id: string
          period_key: string
          scope: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          period_key: string
          scope: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          period_key?: string
          scope?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_day_of_week: number
          id: string
          theme: string
          updated_at: string
          vision_images: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_day_of_week?: number
          id: string
          theme?: string
          updated_at?: string
          vision_images?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_day_of_week?: number
          id?: string
          theme?: string
          updated_at?: string
          vision_images?: string[]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          goal_id: string | null
          id: string
          period: string | null
          priority: string
          scope: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          goal_id?: string | null
          id?: string
          period?: string | null
          priority?: string
          scope?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          goal_id?: string | null
          id?: string
          period?: string | null
          priority?: string
          scope?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      year_summaries: {
        Row: {
          avg_pct: number
          created_at: string
          goals_done: number
          habits_done: number
          habits_total: number
          id: string
          moments_count: number
          photos: Json
          retrospective: string | null
          updated_at: string
          user_id: string
          year_key: string
        }
        Insert: {
          avg_pct?: number
          created_at?: string
          goals_done?: number
          habits_done?: number
          habits_total?: number
          id?: string
          moments_count?: number
          photos?: Json
          retrospective?: string | null
          updated_at?: string
          user_id: string
          year_key: string
        }
        Update: {
          avg_pct?: number
          created_at?: string
          goals_done?: number
          habits_done?: number
          habits_total?: number
          id?: string
          moments_count?: number
          photos?: Json
          retrospective?: string | null
          updated_at?: string
          user_id?: string
          year_key?: string
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

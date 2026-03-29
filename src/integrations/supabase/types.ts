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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      ad_config: {
        Row: {
          ad_code: string | null
          ad_name: string | null
          ad_type: string
          device_target: string
          enabled: boolean
          frequency_limit: string | null
          id: string
          slot_name: string
          trigger_type: string | null
          updated_at: string
        }
        Insert: {
          ad_code?: string | null
          ad_name?: string | null
          ad_type?: string
          device_target?: string
          enabled?: boolean
          frequency_limit?: string | null
          id?: string
          slot_name: string
          trigger_type?: string | null
          updated_at?: string
        }
        Update: {
          ad_code?: string | null
          ad_name?: string | null
          ad_type?: string
          device_target?: string
          enabled?: boolean
          frequency_limit?: string | null
          id?: string
          slot_name?: string
          trigger_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_impressions: {
        Row: {
          created_at: string
          device_type: string | null
          error_message: string | null
          event_type: string
          id: string
          session_id: string | null
          slot_name: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          session_id?: string | null
          slot_name: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          session_id?: string | null
          slot_name?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          created_at: string
          duration_ms: number | null
          estimated_cost: number
          function_name: string
          id: string
          is_ai_call: boolean
          status_code: number | null
          tokens_used: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          created_at?: string
          duration_ms?: number | null
          estimated_cost?: number
          function_name: string
          id?: string
          is_ai_call?: boolean
          status_code?: number | null
          tokens_used?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          created_at?: string
          duration_ms?: number | null
          estimated_cost?: number
          function_name?: string
          id?: string
          is_ai_call?: boolean
          status_code?: number | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          creator_id: string
          end_date: string
          id: string
          revenue_share_percent: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_name: string
          created_at?: string
          creator_id: string
          end_date: string
          id?: string
          revenue_share_percent?: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          created_at?: string
          creator_id?: string
          end_date?: string
          id?: string
          revenue_share_percent?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          amount: number
          bonus: number
          campaign_id: string
          created_at: string
          creator_id: string
          id: string
          notes: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          amount?: number
          bonus?: number
          campaign_id: string
          created_at?: string
          creator_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          bonus?: number
          campaign_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_payouts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_payouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          created_at: string
          email: string
          followers: string | null
          id: string
          instagram_url: string | null
          is_top_partner: boolean | null
          monthly_views: string | null
          name: string
          password_hash: string
          platform: string
          profile_image: string | null
          promo_video_url: string | null
          social_url: string | null
          status: string
          tags: string[] | null
          updated_at: string
          username: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          followers?: string | null
          id?: string
          instagram_url?: string | null
          is_top_partner?: boolean | null
          monthly_views?: string | null
          name: string
          password_hash: string
          platform?: string
          profile_image?: string | null
          promo_video_url?: string | null
          social_url?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          username?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          followers?: string | null
          id?: string
          instagram_url?: string | null
          is_top_partner?: boolean | null
          monthly_views?: string | null
          name?: string
          password_hash?: string
          platform?: string
          profile_image?: string | null
          promo_video_url?: string | null
          social_url?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          username?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          credit_type: string
          description: string | null
          id: string
          payment_id: string | null
          tool_used: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_type?: string
          description?: string | null
          id?: string
          payment_id?: string | null
          tool_used?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_type?: string
          description?: string | null
          id?: string
          payment_id?: string | null
          tool_used?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reel_url: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reel_url: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reel_url?: string
        }
        Relationships: []
      }
      paid_reports: {
        Row: {
          amount: number
          analysis_data: Json | null
          completed_at: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          payment_gateway: string | null
          payment_id: string | null
          pdf_url: string | null
          reel_url: string
          status: string
        }
        Insert: {
          amount?: number
          analysis_data?: Json | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          payment_gateway?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          reel_url: string
          status?: string
        }
        Update: {
          amount?: number
          analysis_data?: Json | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          payment_gateway?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          reel_url?: string
          status?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_added: number
          gateway_response: Json | null
          id: string
          order_id: string
          payment_method: string
          plan_id: string
          status: string
          txn_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_added?: number
          gateway_response?: Json | null
          id?: string
          order_id: string
          payment_method?: string
          plan_id: string
          status?: string
          txn_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_added?: number
          gateway_response?: Json | null
          id?: string
          order_id?: string
          payment_method?: string
          plan_id?: string
          status?: string
          txn_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          function_name: string
          id: string
          ip_hash: string
          request_count: number
          window_start: string
        }
        Insert: {
          function_name: string
          id?: string
          ip_hash: string
          request_count?: number
          window_start?: string
        }
        Update: {
          function_name?: string
          id?: string
          ip_hash?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      share_events: {
        Row: {
          clicks_generated: number | null
          created_at: string
          id: string
          platform: string
          referrer_session_id: string | null
          share_id: string
          shared_url: string | null
        }
        Insert: {
          clicks_generated?: number | null
          created_at?: string
          id?: string
          platform: string
          referrer_session_id?: string | null
          share_id: string
          shared_url?: string | null
        }
        Update: {
          clicks_generated?: number | null
          created_at?: string
          id?: string
          platform?: string
          referrer_session_id?: string | null
          share_id?: string
          shared_url?: string | null
        }
        Relationships: []
      }
      site_config: {
        Row: {
          config_key: string
          config_value: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      traffic_sessions: {
        Row: {
          bot_flags: string[] | null
          bot_score: number | null
          browser: string | null
          city: string | null
          click_count: number | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          has_click: boolean | null
          has_input_interaction: boolean | null
          has_mouse_movement: boolean | null
          has_scroll: boolean | null
          id: string
          ip_hash: string | null
          is_bot: boolean | null
          is_real_user: boolean | null
          language: string | null
          navigation_variation: number | null
          os: string | null
          page_views: number | null
          referrer_source: string | null
          referrer_url: string | null
          screen_size: string | null
          scroll_depth: number | null
          session_end: string | null
          session_id: string
          session_start: string
          share_id: string | null
          timezone: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          bot_flags?: string[] | null
          bot_score?: number | null
          browser?: string | null
          city?: string | null
          click_count?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          has_click?: boolean | null
          has_input_interaction?: boolean | null
          has_mouse_movement?: boolean | null
          has_scroll?: boolean | null
          id?: string
          ip_hash?: string | null
          is_bot?: boolean | null
          is_real_user?: boolean | null
          language?: string | null
          navigation_variation?: number | null
          os?: string | null
          page_views?: number | null
          referrer_source?: string | null
          referrer_url?: string | null
          screen_size?: string | null
          scroll_depth?: number | null
          session_end?: string | null
          session_id: string
          session_start?: string
          share_id?: string | null
          timezone?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          bot_flags?: string[] | null
          bot_score?: number | null
          browser?: string | null
          city?: string | null
          click_count?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          has_click?: boolean | null
          has_input_interaction?: boolean | null
          has_mouse_movement?: boolean | null
          has_scroll?: boolean | null
          id?: string
          ip_hash?: string | null
          is_bot?: boolean | null
          is_real_user?: boolean | null
          language?: string | null
          navigation_variation?: number | null
          os?: string | null
          page_views?: number | null
          referrer_source?: string | null
          referrer_url?: string | null
          screen_size?: string | null
          scroll_depth?: number | null
          session_end?: string | null
          session_id?: string
          session_start?: string
          share_id?: string | null
          timezone?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          reel_url: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          reel_url: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          reel_url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_analyses: {
        Row: {
          analysis_data: Json | null
          created_at: string
          id: string
          reel_url: string
          user_id: string
          viral_score: number | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          id?: string
          reel_url: string
          user_id: string
          viral_score?: number | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          id?: string
          reel_url?: string
          user_id?: string
          viral_score?: number | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          free_credits: number
          free_credits_reset_at: string
          id: string
          paid_credits: number
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_credits?: number
          free_credits_reset_at?: string
          id?: string
          paid_credits?: number
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_credits?: number
          free_credits_reset_at?: string
          id?: string
          paid_credits?: number
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_management: {
        Row: {
          created_at: string
          extra_credits: number
          id: string
          is_blocked: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extra_credits?: number
          id?: string
          is_blocked?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extra_credits?: number
          id?: string
          is_blocked?: boolean
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      viral_patterns: {
        Row: {
          audio_quality_score: number | null
          author_name: string | null
          caption_length: number | null
          caption_score: number | null
          comments: number | null
          content_type: string | null
          created_at: string
          curiosity_level: number | null
          emotional_triggers: string[] | null
          engagement_rate: number | null
          engagement_score: number | null
          face_presence: string | null
          has_cta: boolean | null
          hashtag_count: number | null
          hashtag_score: number | null
          hook_score: number | null
          hook_type: string | null
          id: string
          likes: number | null
          matched_trends: string[] | null
          motion_intensity: string | null
          music_usage: string | null
          primary_category: string | null
          reel_url: string
          saves: number | null
          scene_cuts: string | null
          shares: number | null
          sub_category: string | null
          text_overlay: string | null
          thumbnail_analyzed: boolean | null
          trend_score: number | null
          video_length_estimate: string | null
          video_quality_score: number | null
          views: number | null
          viral_score: number | null
          viral_status: string | null
        }
        Insert: {
          audio_quality_score?: number | null
          author_name?: string | null
          caption_length?: number | null
          caption_score?: number | null
          comments?: number | null
          content_type?: string | null
          created_at?: string
          curiosity_level?: number | null
          emotional_triggers?: string[] | null
          engagement_rate?: number | null
          engagement_score?: number | null
          face_presence?: string | null
          has_cta?: boolean | null
          hashtag_count?: number | null
          hashtag_score?: number | null
          hook_score?: number | null
          hook_type?: string | null
          id?: string
          likes?: number | null
          matched_trends?: string[] | null
          motion_intensity?: string | null
          music_usage?: string | null
          primary_category?: string | null
          reel_url: string
          saves?: number | null
          scene_cuts?: string | null
          shares?: number | null
          sub_category?: string | null
          text_overlay?: string | null
          thumbnail_analyzed?: boolean | null
          trend_score?: number | null
          video_length_estimate?: string | null
          video_quality_score?: number | null
          views?: number | null
          viral_score?: number | null
          viral_status?: string | null
        }
        Update: {
          audio_quality_score?: number | null
          author_name?: string | null
          caption_length?: number | null
          caption_score?: number | null
          comments?: number | null
          content_type?: string | null
          created_at?: string
          curiosity_level?: number | null
          emotional_triggers?: string[] | null
          engagement_rate?: number | null
          engagement_score?: number | null
          face_presence?: string | null
          has_cta?: boolean | null
          hashtag_count?: number | null
          hashtag_score?: number | null
          hook_score?: number | null
          hook_type?: string | null
          id?: string
          likes?: number | null
          matched_trends?: string[] | null
          motion_intensity?: string | null
          music_usage?: string | null
          primary_category?: string | null
          reel_url?: string
          saves?: number | null
          scene_cuts?: string | null
          shares?: number | null
          sub_category?: string | null
          text_overlay?: string | null
          thumbnail_analyzed?: boolean | null
          trend_score?: number | null
          video_length_estimate?: string | null
          video_quality_score?: number | null
          views?: number | null
          viral_score?: number | null
          viral_status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_ip_hash: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reset_free_credits_if_expired: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

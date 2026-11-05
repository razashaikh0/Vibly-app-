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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_mention: boolean
          read_at: string | null
          recipient_id: string
          room_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_mention?: boolean
          read_at?: string | null
          recipient_id: string
          room_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_mention?: boolean
          read_at?: string | null
          recipient_id?: string
          room_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          activeness: number
          announcement: string | null
          avatar_url: string | null
          badge: string | null
          created_at: string
          id: string
          intro: string | null
          leader_id: string
          level: number
          member_limit: number
          name: string
          region: string | null
        }
        Insert: {
          activeness?: number
          announcement?: string | null
          avatar_url?: string | null
          badge?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          leader_id: string
          level?: number
          member_limit?: number
          name: string
          region?: string | null
        }
        Update: {
          activeness?: number
          announcement?: string | null
          avatar_url?: string | null
          badge?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          leader_id?: string
          level?: number
          member_limit?: number
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string
          points: number
          role: string
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string
          points?: number
          role?: string
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string
          points?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          is_bff: boolean
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          is_bff?: boolean
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          is_bff?: boolean
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rate_limits: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "fx_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          eliminated_round: number | null
          id: string
          is_alive: boolean
          joined_at: string
          role: string | null
          session_id: string
          user_id: string
          word: string | null
        }
        Insert: {
          eliminated_round?: number | null
          id?: string
          is_alive?: boolean
          joined_at?: string
          role?: string | null
          session_id: string
          user_id: string
          word?: string | null
        }
        Update: {
          eliminated_round?: number | null
          id?: string
          is_alive?: boolean
          joined_at?: string
          role?: string | null
          session_id?: string
          user_id?: string
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          civilian_word: string | null
          created_at: string
          ended_at: string | null
          game_key: string
          host_id: string
          id: string
          phase: string
          room_id: string
          round: number
          spy_word: string | null
          updated_at: string
          winner: string | null
        }
        Insert: {
          civilian_word?: string | null
          created_at?: string
          ended_at?: string | null
          game_key?: string
          host_id: string
          id?: string
          phase?: string
          room_id: string
          round?: number
          spy_word?: string | null
          updated_at?: string
          winner?: string | null
        }
        Update: {
          civilian_word?: string | null
          created_at?: string
          ended_at?: string | null
          game_key?: string
          host_id?: string
          id?: string
          phase?: string
          room_id?: string
          round?: number
          spy_word?: string | null
          updated_at?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_votes: {
        Row: {
          created_at: string
          id: string
          round: number
          session_id: string
          target_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          round: number
          session_id: string
          target_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          round?: number
          session_id?: string
          target_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_word_pairs: {
        Row: {
          civilian_word: string
          id: string
          spy_word: string
        }
        Insert: {
          civilian_word: string
          id?: string
          spy_word: string
        }
        Update: {
          civilian_word?: string
          id?: string
          spy_word?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          description: string
          emoji: string
          gradient: string
          id: string
          is_active: boolean
          is_wide: boolean
          max_players: number
          min_players: number
          name: string
          slug: string
          sort_order: number
          tag: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          emoji?: string
          gradient?: string
          id?: string
          is_active?: boolean
          is_wide?: boolean
          max_players?: number
          min_players?: number
          name: string
          slug: string
          sort_order?: number
          tag?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          gradient?: string
          id?: string
          is_active?: boolean
          is_wide?: boolean
          max_players?: number
          min_players?: number
          name?: string
          slug?: string
          sort_order?: number
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gift_events: {
        Row: {
          created_at: string
          gift_id: string
          id: string
          quantity: number
          receiver_id: string
          room_id: string
          sender_id: string
          total_price: number
        }
        Insert: {
          created_at?: string
          gift_id: string
          id?: string
          quantity?: number
          receiver_id: string
          room_id: string
          sender_id: string
          total_price: number
        }
        Update: {
          created_at?: string
          gift_id?: string
          id?: string
          quantity?: number
          receiver_id?: string
          room_id?: string
          sender_id?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_events_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          emoji: string
          id: string
          name: string
          price: number
          tier: string
        }
        Insert: {
          emoji: string
          id?: string
          name: string
          price: number
          tier?: string
        }
        Update: {
          emoji?: string
          id?: string
          name?: string
          price?: number
          tier?: string
        }
        Relationships: []
      }
      guard_relations: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          is_cp: boolean
          points: number
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          is_cp?: boolean
          points?: number
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          is_cp?: boolean
          points?: number
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guard_relations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_relations_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          room_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body: string
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          room_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins: number
          created_at: string
          display_name: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      red_packets: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string
          packet_count: number
          room_id: string
          sender_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string
          packet_count?: number
          room_id: string
          sender_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string
          packet_count?: number
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_packets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_packets_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          room_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          room_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          room_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_activity: {
        Row: {
          charm: number
          created_at: string
          id: string
          points: number
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charm?: number
          created_at?: string
          id?: string
          points?: number
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charm?: number
          created_at?: string
          id?: string
          points?: number
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_activity_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_fx_events: {
        Row: {
          actor_avatar: string | null
          actor_id: string
          actor_name: string
          amount: number | null
          created_at: string
          dedupe_key: string
          emoji: string | null
          gift_name: string | null
          id: string
          kind: string
          room_id: string
          room_name: string | null
          scope: string
          target_name: string | null
          vip_level: number | null
        }
        Insert: {
          actor_avatar?: string | null
          actor_id: string
          actor_name?: string
          amount?: number | null
          created_at?: string
          dedupe_key: string
          emoji?: string | null
          gift_name?: string | null
          id?: string
          kind: string
          room_id: string
          room_name?: string | null
          scope?: string
          target_name?: string | null
          vip_level?: number | null
        }
        Update: {
          actor_avatar?: string | null
          actor_id?: string
          actor_name?: string
          amount?: number | null
          created_at?: string
          dedupe_key?: string
          emoji?: string | null
          gift_name?: string | null
          id?: string
          kind?: string
          room_id?: string
          room_name?: string | null
          scope?: string
          target_name?: string | null
          vip_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_fx_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_fx_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_presence: {
        Row: {
          id: string
          joined_at: string
          last_seen: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_seen?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_seen?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_presence_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_seats: {
        Row: {
          id: string
          is_locked: boolean
          is_muted: boolean
          room_id: string
          seat_index: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          is_locked?: boolean
          is_muted?: boolean
          room_id: string
          seat_index: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          is_locked?: boolean
          is_muted?: boolean
          room_id?: string
          seat_index?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_seats_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_seats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          category: string
          cover_emoji: string
          created_at: string
          host_id: string
          id: string
          is_live: boolean
          name: string
          seat_count: number
          theme: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          cover_emoji?: string
          created_at?: string
          host_id: string
          id?: string
          is_live?: boolean
          name: string
          seat_count?: number
          theme?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cover_emoji?: string
          created_at?: string
          host_id?: string
          id?: string
          is_live?: boolean
          name?: string
          seat_count?: number
          theme?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_claims: {
        Row: {
          activeness: number
          category: string
          claim_day: string
          coins_awarded: number
          created_at: string
          id: string
          task_key: string
          user_id: string
        }
        Insert: {
          activeness?: number
          category: string
          claim_day?: string
          coins_awarded?: number
          created_at?: string
          id?: string
          task_key: string
          user_id: string
        }
        Update: {
          activeness?: number
          category?: string
          claim_day?: string
          coins_awarded?: number
          created_at?: string
          id?: string
          task_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_guard_points: {
        Args: { _points: number; _target_id: string }
        Returns: {
          created_at: string
          guardian_id: string
          id: string
          is_cp: boolean
          points: number
          target_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "guard_relations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_room_activity: {
        Args: {
          _charm: number
          _points: number
          _room_id: string
          _user_id: string
        }
        Returns: undefined
      }
      cast_game_vote: {
        Args: { _session_id: string; _target_id: string }
        Returns: {
          civilian_word: string | null
          created_at: string
          ended_at: string | null
          game_key: string
          host_id: string
          id: string
          phase: string
          room_id: string
          round: number
          spy_word: string | null
          updated_at: string
          winner: string | null
        }
        SetofOptions: {
          from: "*"
          to: "game_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_task: {
        Args: {
          _activeness: number
          _category: string
          _coins: number
          _task_key: string
        }
        Returns: {
          activeness: number
          category: string
          claim_day: string
          coins_awarded: number
          created_at: string
          id: string
          task_key: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_claims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_room:
        | {
            Args: {
              _cover_emoji: string
              _name: string
              _seat_count?: number
              _theme: string
              _topic: string
            }
            Returns: {
              category: string
              cover_emoji: string
              created_at: string
              host_id: string
              id: string
              is_live: boolean
              name: string
              seat_count: number
              theme: string
              topic: string | null
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "rooms"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _category?: string
              _cover_emoji: string
              _name: string
              _seat_count: number
              _theme: string
              _topic: string
            }
            Returns: {
              category: string
              cover_emoji: string
              created_at: string
              host_id: string
              id: string
              is_live: boolean
              name: string
              seat_count: number
              theme: string
              topic: string | null
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "rooms"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      fx_rate_ok: {
        Args: {
          _action: string
          _max_count: number
          _user_id: string
          _window_seconds: number
        }
        Returns: boolean
      }
      is_room_host: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      join_room: {
        Args: { _room_id: string }
        Returns: {
          id: string
          joined_at: string
          last_seen: string
          room_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "room_presence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leave_room: { Args: { _room_id: string }; Returns: undefined }
      log_fx: {
        Args: {
          _actor_id: string
          _amount?: number
          _dedupe_key: string
          _emoji?: string
          _gift_name?: string
          _kind: string
          _room_id: string
          _scope: string
          _target_name?: string
          _vip_level?: number
        }
        Returns: {
          actor_avatar: string | null
          actor_id: string
          actor_name: string
          amount: number | null
          created_at: string
          dedupe_key: string
          emoji: string | null
          gift_name: string | null
          id: string
          kind: string
          room_id: string
          room_name: string | null
          scope: string
          target_name: string | null
          vip_level: number | null
        }
        SetofOptions: {
          from: "*"
          to: "room_fx_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      open_game_session: {
        Args: { _room_id: string }
        Returns: {
          civilian_word: string | null
          created_at: string
          ended_at: string | null
          game_key: string
          host_id: string
          id: string
          phase: string
          room_id: string
          round: number
          spy_word: string | null
          updated_at: string
          winner: string | null
        }
        SetofOptions: {
          from: "*"
          to: "game_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_vip_entry: {
        Args: { _room_id: string }
        Returns: {
          actor_avatar: string | null
          actor_id: string
          actor_name: string
          amount: number | null
          created_at: string
          dedupe_key: string
          emoji: string | null
          gift_name: string | null
          id: string
          kind: string
          room_id: string
          room_name: string | null
          scope: string
          target_name: string | null
          vip_level: number | null
        }
        SetofOptions: {
          from: "*"
          to: "room_fx_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_gift: {
        Args: {
          _gift_id: string
          _quantity?: number
          _receiver_id: string
          _room_id: string
        }
        Returns: {
          created_at: string
          gift_id: string
          id: string
          quantity: number
          receiver_id: string
          room_id: string
          sender_id: string
          total_price: number
        }
        SetofOptions: {
          from: "*"
          to: "gift_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_red_packet: {
        Args: {
          _amount: number
          _message?: string
          _packet_count?: number
          _room_id: string
        }
        Returns: {
          amount: number
          created_at: string
          id: string
          message: string
          packet_count: number
          room_id: string
          sender_id: string
        }
        SetofOptions: {
          from: "*"
          to: "red_packets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_game_phase: {
        Args: { _phase: string; _session_id: string }
        Returns: {
          civilian_word: string | null
          created_at: string
          ended_at: string | null
          game_key: string
          host_id: string
          id: string
          phase: string
          room_id: string
          round: number
          spy_word: string | null
          updated_at: string
          winner: string | null
        }
        SetofOptions: {
          from: "*"
          to: "game_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_game_session: {
        Args: { _session_id: string }
        Returns: {
          civilian_word: string | null
          created_at: string
          ended_at: string | null
          game_key: string
          host_id: string
          id: string
          phase: string
          room_id: string
          round: number
          spy_word: string | null
          updated_at: string
          winner: string | null
        }
        SetofOptions: {
          from: "*"
          to: "game_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      vip_level_for: { Args: { _coins: number }; Returns: number }
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

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
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          line1: string
          line2: string
          phone: string
          postal_code: string
          state: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          line1: string
          line2?: string
          phone?: string
          postal_code: string
          state?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string
          phone?: string
          postal_code?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          asin: string
          qty: number
          saved: boolean
          user_id: string
        }
        Insert: {
          added_at?: string
          asin: string
          qty?: number
          saved?: boolean
          user_id: string
        }
        Update: {
          added_at?: string
          asin?: string
          qty?: number
          saved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_asin_fkey"
            columns: ["asin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["asin"]
          },
        ]
      }
      categories: {
        Row: {
          name: string
          short: string
          slug: string
          sort_order: number
        }
        Insert: {
          name: string
          short: string
          slug: string
          sort_order: number
        }
        Update: {
          name?: string
          short?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_at: string
          asin: string
          user_id: string
        }
        Insert: {
          added_at?: string
          asin: string
          user_id: string
        }
        Update: {
          added_at?: string
          asin?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_asin_fkey"
            columns: ["asin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["asin"]
          },
        ]
      }
      order_items: {
        Row: {
          asin: string
          id: string
          image_url: string
          order_id: string
          price_cents: number
          qty: number
          title: string
        }
        Insert: {
          asin: string
          id?: string
          image_url?: string
          order_id: string
          price_cents: number
          qty: number
          title: string
        }
        Update: {
          asin?: string
          id?: string
          image_url?: string
          order_id?: string
          price_cents?: number
          qty?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          arrives_on: string
          id: string
          payment_last4: string
          placed_at: string
          ship_to: Json
          shipping_cents: number
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          user_id: string
        }
        Insert: {
          arrives_on: string
          id?: string
          payment_last4?: string
          placed_at?: string
          ship_to: Json
          shipping_cents?: number
          status?: string
          subtotal_cents: number
          tax_cents?: number
          total_cents: number
          user_id: string
        }
        Update: {
          arrives_on?: string
          id?: string
          payment_last4?: string
          placed_at?: string
          ship_to?: Json
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          asin: string
          badge: string | null
          bought_past_month: number | null
          brand: string
          bullets: string[]
          category: string
          express: boolean
          image: string
          images: string[]
          list_price_cents: number | null
          price_cents: number
          price_synthesised: boolean
          rating: number | null
          review_count: number | null
          scraped_rating: number
          scraped_review_count: number
          short_title: string
          stock: number
          title: string
          updated_at: string
          user_rating_sum: number
          user_review_count: number
          variants: Json
        }
        Insert: {
          asin: string
          badge?: string | null
          bought_past_month?: number | null
          brand: string
          bullets?: string[]
          category: string
          express?: boolean
          image: string
          images?: string[]
          list_price_cents?: number | null
          price_cents: number
          price_synthesised?: boolean
          rating?: number | null
          review_count?: number | null
          scraped_rating: number
          scraped_review_count: number
          short_title: string
          stock?: number
          title: string
          updated_at?: string
          user_rating_sum?: number
          user_review_count?: number
          variants?: Json
        }
        Update: {
          asin?: string
          badge?: string | null
          bought_past_month?: number | null
          brand?: string
          bullets?: string[]
          category?: string
          express?: boolean
          image?: string
          images?: string[]
          list_price_cents?: number | null
          price_cents?: number
          price_synthesised?: boolean
          rating?: number | null
          review_count?: number | null
          scraped_rating?: number
          scraped_review_count?: number
          short_title?: string
          stock?: number
          title?: string
          updated_at?: string
          user_rating_sum?: number
          user_review_count?: number
          variants?: Json
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          asin: string
          author_name: string
          body: string
          created_at: string
          id: string
          rating: number
          title: string
          user_id: string
        }
        Insert: {
          asin: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          rating: number
          title?: string
          user_id: string
        }
        Update: {
          asin?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          rating?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_asin_fkey"
            columns: ["asin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["asin"]
          },
        ]
      }
    }
    Views: {
      review_histogram: {
        Row: {
          asin: string | null
          count: number | null
          stars: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_asin_fkey"
            columns: ["asin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["asin"]
          },
        ]
      }
    }
    Functions: {
      also_viewed: {
        Args: { lim?: number; target: string }
        Returns: {
          asin: string
          badge: string | null
          bought_past_month: number | null
          brand: string
          bullets: string[]
          category: string
          express: boolean
          image: string
          images: string[]
          list_price_cents: number | null
          price_cents: number
          price_synthesised: boolean
          rating: number | null
          review_count: number | null
          scraped_rating: number
          scraped_review_count: number
          short_title: string
          stock: number
          title: string
          updated_at: string
          user_rating_sum: number
          user_review_count: number
          variants: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      deals: {
        Args: { lim?: number }
        Returns: {
          asin: string
          badge: string | null
          bought_past_month: number | null
          brand: string
          bullets: string[]
          category: string
          express: boolean
          image: string
          images: string[]
          list_price_cents: number | null
          price_cents: number
          price_synthesised: boolean
          rating: number | null
          review_count: number | null
          scraped_rating: number
          scraped_review_count: number
          short_title: string
          stock: number
          title: string
          updated_at: string
          user_rating_sum: number
          user_review_count: number
          variants: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      place_order: {
        Args: { p_payment_last4?: string; p_ship_to: Json }
        Returns: string
      }
      product_score: {
        Args: {
          p: Database["public"]["Tables"]["products"]["Row"]
          tokens: string[]
        }
        Returns: number
      }
      related_to_any: {
        Args: { lim?: number; seeds: string[] }
        Returns: {
          asin: string
          badge: string | null
          bought_past_month: number | null
          brand: string
          bullets: string[]
          category: string
          express: boolean
          image: string
          images: string[]
          list_price_cents: number | null
          price_cents: number
          price_synthesised: boolean
          rating: number | null
          review_count: number | null
          scraped_rating: number
          scraped_review_count: number
          short_title: string
          stock: number
          title: string
          updated_at: string
          user_rating_sum: number
          user_review_count: number
          variants: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_base: {
        Args: {
          brands: string[]
          cat: string
          deals_only: boolean
          except_dim?: string
          express_only: boolean
          max_price: number
          min_price: number
          min_rating: number
          q: string
        }
        Returns: {
          asin: string
          score: number
        }[]
      }
      search_facets: {
        Args: {
          brands?: string[]
          cat?: string
          deals_only?: boolean
          express_only?: boolean
          max_price?: number
          min_price?: number
          min_rating?: number
          q?: string
        }
        Returns: Json
      }
      search_products: {
        Args: {
          brands?: string[]
          cat?: string
          deals_only?: boolean
          express_only?: boolean
          max_price?: number
          min_price?: number
          min_rating?: number
          page?: number
          page_size?: number
          q?: string
          sort?: string
        }
        Returns: Json
      }
      search_tokens: { Args: { q: string }; Returns: string[] }
      suggestions: { Args: { lim?: number; q: string }; Returns: string[] }
      sync_review_stats: { Args: { a: string }; Returns: undefined }
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

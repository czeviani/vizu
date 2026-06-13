import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type Database = {
  public: {
    Tables: {
      presentations: {
        Row: {
          id: string;
          title: string;
          data: string; // JSON string of Presentation
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          data: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          data?: string;
          updated_at?: string;
        };
      };
    };
  };
};

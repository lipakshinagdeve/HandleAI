import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './environment';

// Create Supabase client with anon key (for client-side operations)
export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

// Create Supabase admin client with service role key (for server-side operations)
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey
);

export default supabase;
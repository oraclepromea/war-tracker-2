import { createClient } from '@supabase/supabase-js';

// Make Supabase optional - use fallback values if env vars are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have real Supabase credentials
export const hasSupabaseConfig = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

// Create client but only use it if we have valid config
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => hasSupabaseConfig && supabase !== null;

console.log('🔗 Supabase Status:', hasSupabaseConfig ? 'Connected' : 'Not configured (using fallback data)');
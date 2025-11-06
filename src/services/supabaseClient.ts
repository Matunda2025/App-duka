import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project URL and Anon Key
// You can get these from your Supabase project settings > API
// It's recommended to store these in environment variables
// Fix: Explicitly type as string to prevent TypeScript from inferring a literal type, which causes a comparison error below.
export const supabaseUrl: string = 'https://xbcbmvhhqwzupjsajlyt.supabase.co';
// Fix: Explicitly type as string to prevent TypeScript from inferring a literal type, which causes a comparison error below.
export const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiY2JtdmhocXd6dXBqc2FqbHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMjc3OTAsImV4cCI6MjA3NzkwMzc5MH0.Viq59QC75C4Qhbg9gLb0WwysW959TJZLQJ6CDUZRLRI';

export const isSupabaseConfigured =
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Use dummy credentials if the real ones are not set. This prevents the app
// from crashing on startup and allows the main App component to display a
// helpful configuration error message to the developer.
const effectiveUrl = isSupabaseConfigured ? supabaseUrl : 'https://dummy-url.supabase.co';
const effectiveAnonKey = isSupabaseConfigured ? supabaseAnonKey : 'dummy-key';


export const supabase = createClient(effectiveUrl, effectiveAnonKey);
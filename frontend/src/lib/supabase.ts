import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// This will create a dummy client if keys are missing, preventing the app from crashing on load.
// API calls will fail, but the UI will render.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

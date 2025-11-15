import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nkrvrqhleqijboptwtan.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcnZycWhsZXFpamJvcHR3dGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjgyNjMsImV4cCI6MjA3ODgwNDI2M30.nwbKyI5g5JG72-bPIVRALEPzyw0V22yfo4jfFkAlkPg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

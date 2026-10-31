import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pgxgfhqwzkdayhbyqfvl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase = null;

if (SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here') {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('[Supabase] Service role key not configured — backend will use localStorage fallback only.');
}

export { supabase };
export default supabase;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSimulated = !supabaseUrl || supabaseUrl === 'TU_SUPABASE_URL_AQUI';

export const supabase = isSimulated 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

export { isSimulated };

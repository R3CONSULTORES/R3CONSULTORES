import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSimulated = !supabaseUrl || supabaseUrl === 'TU_SUPABASE_URL_AQUI';

export const supabase = isSimulated 
  ? null 
  : createClient(supabaseUrl as string, supabaseAnonKey as string);

export { isSimulated };

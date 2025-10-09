import { createClient } from '@supabase/supabase-js';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const supabaseUrl = CONFIG.supabase.url;
const supabaseKey = CONFIG.supabase.key;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Storage features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);


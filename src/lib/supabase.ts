/**
 * TilawaNow - A modern Quran platform.
 * Copyright (c) 2026 Muhammed Risvan.
 * Licensed under the GNU Affero General Public License v3.0.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
    supabaseUrl || 'https://MISSING_URL.supabase.co',
    supabaseAnonKey || 'MISSING_KEY'
);

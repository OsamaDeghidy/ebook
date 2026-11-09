import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;

function sanitizeUrl(raw?: string): string {
  let u = (raw || '').trim().replace(/^["']|["']$/g, '').trim();
  if (!u || u === 'undefined' || u === 'null') {
    return 'https://ydlzvuutjgelpxueufgn.supabase.co';
  }
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  return u.replace(/\/+$/, '');
}

function sanitizeKey(raw?: string): string {
  let k = (raw || '').trim().replace(/^["']|["']$/g, '').trim();
  if (!k || k === 'undefined' || k === 'null') {
    return 'sb_publishable_KoXiLZfD6mIYGRRMb0gjtg_h3PkBle7';
  }
  return k;
}

const supabaseUrl = sanitizeUrl(meta.env?.VITE_SUPABASE_URL || meta.env?.SUPABASE_URL);
const supabaseAnonKey = sanitizeKey(meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || meta.env?.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

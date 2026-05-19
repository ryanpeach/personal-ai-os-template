import { InjectionToken } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// In the browser the portal talks to Supabase via a same-origin proxy
// (`/supabase` → `http://127.0.0.1:54321`, configured in `proxy.conf.json`
// for `ng serve`). This means the iPhone reaches Supabase through the same
// Tailscale-served origin as the portal itself — no separate hostname,
// no CORS, and Supabase stays bound to localhost on the server.
const SUPABASE_URL =
  typeof window !== 'undefined' ? `${window.location.origin}/supabase` : 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY),
});

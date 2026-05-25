import type { NextConfig } from 'next';

// In the browser the portal talks to Supabase via a same-origin proxy
// (`/supabase` → `http://127.0.0.1:54321`). This means the iPhone reaches
// Supabase through the same Tailscale-served origin as the portal itself —
// no separate hostname, no CORS, and Supabase stays bound to localhost on
// the server. Replaces the old Angular `proxy.conf.json`.
const SUPABASE_LOCAL_URL = process.env.SUPABASE_LOCAL_URL ?? 'http://127.0.0.1:54321';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: `${SUPABASE_LOCAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;

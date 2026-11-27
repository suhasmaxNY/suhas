/**
 * SUHAS.COM edge API foundation.
 * Secrets are configured with: wrangler secret put SUPABASE_URL
 * and: wrangler secret put SUPABASE_ANON_KEY
 */
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "suhas-marketplace",
        environment: env.APP_ENV || "development",
        databaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)
      });
    }

    if (url.pathname.startsWith("/api/")) {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return json({ error: "Backend is not configured yet." }, 503);
      }
      // API routes will be added with authenticated Supabase access.
      return json({ error: "API route not implemented yet." }, 501);
    }

    return env.ASSETS.fetch(request);
  }
};

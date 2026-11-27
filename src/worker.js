/**
 * SUHAS.COM Cloudflare Worker API.
 * Configure SUPABASE_URL and SUPABASE_ANON_KEY as encrypted Worker secrets.
 * Public catalogue reads use the anon key and remain constrained by Supabase RLS.
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

    if (url.pathname === "/api/products" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return json({ error: "Backend is not configured yet." }, 503);
      }
      const endpoint = new URL("/rest/v1/products", env.SUPABASE_URL);
      endpoint.search = new URLSearchParams({
        select: "id,name_en,name_bn,slug,price_bdt,image_url,category_id",
        status: "eq.active",
        order: "created_at.desc",
        limit: "40"
      }).toString();
      const upstream = await fetch(endpoint, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          accept: "application/json"
        }
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") || "application/json",
          "cache-control": "public, max-age=30",
          "x-content-type-options": "nosniff"
        }
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route not implemented yet." }, 501);
    }

    return env.ASSETS.fetch(request);
  }
};

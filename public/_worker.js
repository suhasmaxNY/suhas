const API = "https://suhas-marketplace-api.mhasnain.workers.dev";
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/p/")) {
      const slug = decodeURIComponent(url.pathname.slice(3)).slice(0,120);
      if (!slug || slug.includes("/")) return env.ASSETS.fetch(request);
      try {
        const response = await fetch(API + "/api/products?slug=" + encodeURIComponent(slug), {headers:{accept:"application/json"}});
        const rows = await response.json();
        const p = Array.isArray(rows) ? rows[0] : null;
        if (!p) return new Response("Product not found on SUHAS.COM", {status:404,headers:{"content-type":"text/plain; charset=utf-8"}});
        const title = escapeHtml(p.name_en || p.name_bn || "SUHAS product");
        const description = escapeHtml((p.description || "Discover this product on SUHAS.COM.").slice(0,220));
        const image = escapeHtml(p.image_url || "https://suhasny.pages.dev/og-suhas.png");
        const canonical = "https://suhasny.pages.dev/p/" + encodeURIComponent(p.slug);
        const destination = "https://suhasny.pages.dev/?product=" + encodeURIComponent(p.slug);
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | SUHAS.COM</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="product"><meta property="og:site_name" content="SUHAS.COM"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="${image}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"><meta http-equiv="refresh" content="1;url=${destination}"><style>body{font:16px Arial,sans-serif;background:#f5f6f8;color:#202124;margin:0;padding:40px 20px;text-align:center}.card{max-width:520px;margin:5vh auto;background:#fff;padding:24px;border-radius:14px;box-shadow:0 8px 35px #0001}img{width:100%;max-height:360px;object-fit:contain}a{display:inline-block;background:#f85606;color:white;padding:14px 22px;border-radius:7px;text-decoration:none;font-weight:bold}.watermark{font-size:12px;color:#777;margin-top:20px}.watermark a{background:none;color:#f85606;padding:0;text-decoration:underline}</style></head><body><main class="card"><img src="${image}" alt="${title}"><h1>${title}</h1><p>${description}</p><p><strong>৳${escapeHtml(p.price_bdt)}</strong></p><a href="${destination}">View product on SUHAS.COM</a><p class="watermark">Shared from <a href="https://suhasny.pages.dev">SUHAS.COM</a></p></main><script>location.replace(${JSON.stringify(destination)})</script></body></html>`;
        return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=60","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"}});
      } catch {
        return new Response("Product details are temporarily unavailable. Visit SUHAS.COM.",{status:503,headers:{"content-type":"text/plain; charset=utf-8"}});
      }
    }
    return env.ASSETS.fetch(request);
  }
};

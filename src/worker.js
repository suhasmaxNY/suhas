const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors={"access-control-allow-origin":"https://suhasny.pages.dev","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"authorization,content-type,accept","vary":"Origin"};
    const apiReply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...cors}});
    if(request.method==="OPTIONS" && url.pathname.startsWith("/api/")) return new Response(null,{status:204,headers:{...cors,"access-control-max-age":"86400"}});
    if(url.pathname.startsWith("/api/") && (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)) return apiReply({error:"Supabase is not configured. Add SUPABASE_ANON_KEY as a Worker secret."},503);
    if(url.pathname==="/api/auth/signup" && request.method==="POST"){
      const b=await request.json().catch(()=>null);
      if(!b?.email || !b?.password || b.password.length<8 || !b?.full_name) return apiReply({error:"Name, email and password (at least 8 characters) are required."},400);
      const r=await fetch(env.SUPABASE_URL+"/auth/v1/signup",{method:"POST",headers:{apikey:env.SUPABASE_ANON_KEY,"content-type":"application/json"},body:JSON.stringify({email:b.email,password:b.password,data:{full_name:b.full_name}})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/auth/login" && request.method==="POST"){
      const b=await request.json().catch(()=>null);
      if(!b?.email || !b?.password) return apiReply({error:"Email and password are required."},400);
      const r=await fetch(env.SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:env.SUPABASE_ANON_KEY,"content-type":"application/json"},body:JSON.stringify({email:b.email,password:b.password})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname.startsWith("/api/orders")){
      const bearer=request.headers.get("authorization")||"";
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Please sign in to continue."},401);
      const headers={apikey:env.SUPABASE_ANON_KEY,authorization:bearer,"content-type":"application/json",accept:"application/json"};
      if(url.pathname==="/api/orders" && request.method==="POST"){
        const b=await request.json().catch(()=>null);
        if(!Array.isArray(b?.items)||!b?.address) return apiReply({error:"Cart and delivery details are required."},400);
        const r=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/place_order",{method:"POST",headers,body:JSON.stringify({p_items:b.items,p_address:b.address,p_payment_method:b.payment_method||"cod"})});
        return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      }
      if(url.pathname==="/api/orders" && request.method==="GET"){
        const number=url.searchParams.get("number");
        if(!number || !/^SH-[A-Z0-9]{10}$/.test(number)) return apiReply({error:"Enter a valid SUHAS order number."},400);
        const u=new URL(env.SUPABASE_URL+"/rest/v1/orders");
        u.search=new URLSearchParams({select:"order_number,status,payment_status,payment_method,subtotal_bdt,delivery_fee_bdt,total_bdt,created_at",order_number:"eq."+number,limit:"1"}).toString();
        const r=await fetch(u,{headers});const rows=await r.json().catch(()=>[]);
        return apiReply(Array.isArray(rows)&&rows.length?rows[0]:{error:"Order not found for this account."},Array.isArray(rows)&&rows.length?200:404);
      }
      return apiReply({error:"Method not allowed."},405);
    }
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "suhas-marketplace-api", databaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY) });
    }
    if (url.pathname === "/api/products" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ error: "Supabase Worker secrets are not configured." }, 503);
      const endpoint = new URL("/rest/v1/products", env.SUPABASE_URL);
      endpoint.search = new URLSearchParams({ select: "id,name_en,name_bn,slug,price_bdt,image_url,category_id,category:categories(name_en,name_bn)", status: "eq.active", order: "created_at.desc", limit: "40" }).toString();
      const upstream = await fetch(endpoint, { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, accept: "application/json" } });
      return new Response(await upstream.text(), { status: upstream.status, headers: { ...cors, "content-type": upstream.headers.get("content-type") || "application/json", "cache-control": "public, max-age=30", "x-content-type-options": "nosniff" } });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ service: "SUHAS.COM API", message: "Static storefront assets are not attached yet.", docs: "https://github.com/suhasmaxNY/suhas" });
  }
};

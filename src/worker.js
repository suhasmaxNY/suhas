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
      const signupUrl=new URL("/auth/v1/signup",env.SUPABASE_URL);signupUrl.searchParams.set("redirect_to","https://suhasny.pages.dev/");
      const r=await fetch(signupUrl,{method:"POST",headers:{apikey:env.SUPABASE_ANON_KEY,"content-type":"application/json"},body:JSON.stringify({email:b.email,password:b.password,data:{full_name:b.full_name}})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/auth/login" && request.method==="POST"){
      const b=await request.json().catch(()=>null);
      if(!b?.email || !b?.password) return apiReply({error:"Email and password are required."},400);
      const r=await fetch(env.SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:env.SUPABASE_ANON_KEY,"content-type":"application/json"},body:JSON.stringify({email:b.email,password:b.password})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    const bearer=request.headers.get("authorization")||"";
    const userHeaders={apikey:env.SUPABASE_ANON_KEY,authorization:bearer,"content-type":"application/json",accept:"application/json","prefer":"return=representation"};
    if(url.pathname==="/api/admin/sellers" && request.method==="GET"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Admin sign-in required."},401);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/admin_list_seller_applications",{method:"POST",headers:userHeaders,body:"{}"});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/admin/sellers/review" && request.method==="POST"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Admin sign-in required."},401);
      const b=await request.json().catch(()=>null);
      if(!b?.seller_id || !["approved","rejected","suspended"].includes(b?.decision)) return apiReply({error:"Seller ID and valid decision are required."},400);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/admin_review_seller",{method:"POST",headers:userHeaders,body:JSON.stringify({p_seller_id:b.seller_id,p_decision:b.decision})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/seller/apply" && request.method==="POST"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in before applying."},401);
      const b=await request.json().catch(()=>null);
      if(!b?.store_name||!b?.whatsapp_number) return apiReply({error:"Store name and WhatsApp number are required."},400);
      const slug=String(b.store_name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)+"-"+crypto.randomUUID().slice(0,6);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/apply_as_seller",{method:"POST",headers:userHeaders,body:JSON.stringify({p_store_name:b.store_name,p_slug:slug,p_description:b.description||"",p_whatsapp_number:String(b.whatsapp_number).replace(/[^0-9]/g,"")})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/seller/me" && request.method==="GET"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in first."},401);
      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});
      if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);
      const user=await me.json();
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/sellers?select=id,store_name,slug,description,status,whatsapp_number,support_email,created_at&owner_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:userHeaders});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/seller/products" && (request.method==="GET"||request.method==="POST")){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in first."},401);
      if(request.method==="GET"){
        const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});
        if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);
        const user=await me.json();
        const sr=await fetch(env.SUPABASE_URL+"/rest/v1/sellers?select=id&owner_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:userHeaders});
        const sellers=await sr.json().catch(()=>[]);
        if(!sellers.length)return apiReply({error:"Create a seller account first."},403);
        const r=await fetch(env.SUPABASE_URL+"/rest/v1/products?select=id,name_en,name_bn,slug,description,price_bdt,stock_quantity,status,image_url,category_id&seller_id=eq."+encodeURIComponent(sellers[0].id)+"&order=created_at.desc",{headers:userHeaders});
        return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      }
      const b=await request.json().catch(()=>null);
      if(!b?.name_en||!b?.price_bdt||!b?.category_id) return apiReply({error:"Product name, category and price are required."},400);
      const slug=String(b.name_en).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)+"-"+crypto.randomUUID().slice(0,6);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/products",{method:"POST",headers:userHeaders,body:JSON.stringify({seller_id:b.seller_id,category_id:b.category_id,name_en:b.name_en,name_bn:b.name_bn||null,slug,description:b.description||"",price_bdt:Number(b.price_bdt),stock_quantity:Number(b.stock_quantity||0),image_url:b.image_url||null,status:b.status||"draft"})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname.startsWith("/api/seller/products/") && request.method==="PATCH"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in first."},401);
      const id=url.pathname.split("/").pop();if(!/^[0-9a-f-]{36}$/i.test(id))return apiReply({error:"Invalid product id."},400);
      const b=await request.json().catch(()=>null);const allowed={};
      for(const k of ["name_en","name_bn","description","price_bdt","stock_quantity","image_url","status","category_id"])if(b&&Object.hasOwn(b,k))allowed[k]=b[k];
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/products?id=eq."+id,{method:"PATCH",headers:userHeaders,body:JSON.stringify(allowed)});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/assistant" && request.method==="POST"){
      const b=await request.json().catch(()=>null);const question=String(b?.question||"").trim().slice(0,1200);
      if(question.length<2)return apiReply({error:"Please enter a question."},400);
      const endpoint=new URL("/rest/v1/products",env.SUPABASE_URL);
      endpoint.search=new URLSearchParams({select:"id,name_en,name_bn,description,price_bdt,slug,image_url,seller:sellers(store_name,whatsapp_number)",status:"eq.active",order:"created_at.desc",limit:"40"}).toString();
      let catalogue=[];
      try {
        const pr=await fetch(endpoint,{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:"Bearer "+env.SUPABASE_ANON_KEY,accept:"application/json"}});
        if(pr.ok){
          const rows=await pr.json().catch(()=>[]);
          if(Array.isArray(rows)) catalogue=rows;
        } else {
          console.error("SUHAS catalogue request failed:",pr.status,await pr.text());
        }
      } catch(error) {
        console.error("SUHAS catalogue network error:",error?.message||String(error));
      }
      const words=question.toLowerCase().split(/[^a-z0-9\u0980-\u09ff]+/).filter(x=>x.length>2);
      const matches=(Array.isArray(catalogue)?catalogue:[]).map(p=>({...p,score:words.filter(word=>(p.name_en+" "+(p.name_bn||"")+" "+(p.description||"")).toLowerCase().includes(word)).length})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
      const marketContext="SUHAS is a Bangladesh-focused multi-vendor marketplace. Buyers can browse listed products, contact the product's own seller using the seller's WhatsApp contact, share product links, and place COD orders when checkout is enabled. Seller applications are reviewed; pending sellers cannot publish active listings. Never claim a feature is active unless stated here. Never invent prices, stock, seller contacts or product URLs. For product questions, use only the catalogue records below and provide /?product=SLUG links. If no matching product exists, say so. For general questions, answer helpfully but state uncertainty and avoid pretending to know private account/order information.\nCATALOGUE: "+JSON.stringify(matches.map(p=>({name:p.name_en,bn:p.name_bn,description:p.description,price_bdt:p.price_bdt,slug:p.slug,seller:p.seller?.store_name})));
      if(env.AI?.run){
        try {
          const out=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{messages:[{role:"system",content:marketContext},{role:"user",content:question}],max_tokens:650});
          const answer=out?.response||out?.output_text;
          if(answer) return apiReply({answer,products:matches.map(p=>({name:p.name_en,price_bdt:p.price_bdt,slug:p.slug}))});
        } catch(error) {
          console.error("SUHAS AI model error:",error?.message||String(error));
        }
      }
      const answer=matches.length?"I found these SUHAS catalogue matches: "+matches.map(p=>p.name_en+" — ৳"+p.price_bdt+" — /?product="+p.slug).join("\n"):"I can help with SUHAS shopping, seller onboarding, product discovery, WhatsApp contact and COD order guidance. The live AI model is not connected yet; I can only search the current product catalogue right now.";
      return apiReply({answer,products:matches.map(p=>({name:p.name_en,price_bdt:p.price_bdt,slug:p.slug}))});
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
    if(url.pathname==="/api/categories" && request.method==="GET"){
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/categories?select=id,name_en,name_bn,slug&is_active=eq.true&order=sort_order.asc",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:"Bearer "+env.SUPABASE_ANON_KEY,accept:"application/json"}});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"public, max-age=300"}});
    }
    if (url.pathname === "/api/products" && request.method === "GET") {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ error: "Supabase Worker secrets are not configured." }, 503);
      const endpoint = new URL("/rest/v1/products", env.SUPABASE_URL);
      const params={select:"id,name_en,name_bn,slug,description,price_bdt,stock_quantity,image_url,category_id,category:categories(name_en,name_bn),seller:sellers(id,store_name,whatsapp_number,slug)",status:"eq.active",order:"created_at.desc",limit:"40"};
      const requestedSlug=url.searchParams.get("slug");if(requestedSlug)params.slug="eq."+requestedSlug;
      endpoint.search=new URLSearchParams(params).toString();
      const upstream = await fetch(endpoint, { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, accept: "application/json" } });
      return new Response(await upstream.text(), { status: upstream.status, headers: { ...cors, "content-type": upstream.headers.get("content-type") || "application/json", "cache-control": "public, max-age=30", "x-content-type-options": "nosniff" } });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ service: "SUHAS.COM API", message: "Static storefront assets are not attached yet.", docs: "https://github.com/suhasmaxNY/suhas" });
  }
};

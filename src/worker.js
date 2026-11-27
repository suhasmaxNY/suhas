const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors={"access-control-allow-origin":"https://suhasny.pages.dev","access-control-allow-methods":"GET,POST,PATCH,OPTIONS","access-control-allow-headers":"authorization,content-type,accept","vary":"Origin"};
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
    if(url.pathname==="/api/admin/check" && request.method==="GET"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Admin sign-in required."},401);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/is_admin",{method:"POST",headers:userHeaders,body:"{}"});
      if(!r.ok)return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      const allowed=await r.json().catch(()=>false);
      return apiReply({is_admin:allowed===true});
    }
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
    if(url.pathname==="/api/seller/upload" && request.method==="POST"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in first."},401);
      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});
      if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);
      const user=await me.json();
      const sr=await fetch(env.SUPABASE_URL+"/rest/v1/sellers?select=id&owner_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:userHeaders});
      const sellers=await sr.json().catch(()=>[]);
      if(!Array.isArray(sellers)||!sellers.length)return apiReply({error:"Create a seller account before uploading product photos."},403);
      const form=await request.formData();const file=form.get("file");
      const allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"};
      if(!file||typeof file.arrayBuffer!=="function"||!allowed[file.type])return apiReply({error:"Choose a JPG, PNG, WEBP or GIF image."},400);
      if(file.size>5*1024*1024)return apiReply({error:"Product image must be 5 MB or smaller."},413);
      const objectPath=user.id+"/"+crypto.randomUUID()+"."+allowed[file.type];
      const upload=await fetch(env.SUPABASE_URL+"/storage/v1/object/product-images/"+objectPath,{method:"POST",headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer,"content-type":file.type,"cache-control":"3600","x-upsert":"false"},body:file});
      const result=await upload.json().catch(()=>({}));
      if(!upload.ok)return apiReply({error:result.message||result.error||"Storage upload failed. Check product image storage setup."},upload.status);
      return apiReply({image_url:env.SUPABASE_URL+"/storage/v1/object/public/product-images/"+objectPath},201);
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
        const r=await fetch(env.SUPABASE_URL+"/rest/v1/products?select=id,name_en,name_bn,slug,description,price_bdt,stock_quantity,status,image_url,image_urls,category_id&seller_id=eq."+encodeURIComponent(sellers[0].id)+"&order=created_at.desc",{headers:userHeaders});
        return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      }
      const b=await request.json().catch(()=>null);
      if(!b?.name_en||!b?.price_bdt||!b?.category_id||!String(b.description||"").trim()||!Array.isArray(b.image_urls)) return apiReply({error:"Complete product name, category, price, description and photo details before publishing."},400);
      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);const user=await me.json();
      const sr=await fetch(env.SUPABASE_URL+"/rest/v1/sellers?select=id,status&owner_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:userHeaders});const sellers=await sr.json().catch(()=>[]);if(!Array.isArray(sellers)||!sellers.length)return apiReply({error:"Create a seller account first."},403);if(sellers[0].status!=="approved")return apiReply({error:"Your seller account must be approved before publishing products."},403);
      const slug=String(b.name_en).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)+"-"+crypto.randomUUID().slice(0,6);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/products",{method:"POST",headers:userHeaders,body:JSON.stringify({seller_id:sellers[0].id,category_id:b.category_id,name_en:b.name_en,name_bn:b.name_bn||null,slug,description:b.description,price_bdt:Number(b.price_bdt),stock_quantity:Number(b.stock_quantity||0),image_url:b.image_url||b.image_urls[0]||null,image_urls:b.image_urls,status:"active"})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname.startsWith("/api/seller/products/") && request.method==="PATCH"){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in first."},401);
      const id=url.pathname.split("/").pop();if(!/^[0-9a-f-]{36}$/i.test(id))return apiReply({error:"Invalid product id."},400);
      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);const user=await me.json();
      const sr=await fetch(env.SUPABASE_URL+"/rest/v1/sellers?select=id,status&owner_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:userHeaders});const sellers=await sr.json().catch(()=>[]);if(!Array.isArray(sellers)||!sellers.length||sellers[0].status!=="approved")return apiReply({error:"An approved seller account is required to publish products."},403);
      const b=await request.json().catch(()=>null);const allowed={};
      for(const k of ["name_en","name_bn","description","price_bdt","stock_quantity","image_url","image_urls","category_id"])if(b&&Object.hasOwn(b,k))allowed[k]=b[k];allowed.status="active";
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/products?id=eq."+id+"&seller_id=eq."+encodeURIComponent(sellers[0].id),{method:"PATCH",headers:userHeaders,body:JSON.stringify(allowed)});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/support/conversations" && (request.method==="GET"||request.method==="POST")){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in to chat with SUHAS support."},401);
      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});
      if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);
      const user=await me.json();
      if(request.method==="GET"){
        const r=await fetch(env.SUPABASE_URL+"/rest/v1/support_conversations?select=id,subject,status,created_at,updated_at&order=updated_at.desc",{headers:userHeaders});
        return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      }
      const b=await request.json().catch(()=>null);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/support_conversations",{method:"POST",headers:userHeaders,body:JSON.stringify({user_id:user.id,subject:String(b?.subject||"SUHAS support").slice(0,120)})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/support/messages" && (request.method==="GET"||request.method==="POST")){
      if(!bearer.startsWith("Bearer ")) return apiReply({error:"Sign in to chat with SUHAS support."},401);
      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});
      if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);
      const user=await me.json();
      const conversationId=url.searchParams.get("conversation_id");
      if(request.method==="GET"){
        if(!conversationId||!/^[0-9a-f-]{36}$/i.test(conversationId))return apiReply({error:"A valid conversation is required."},400);
        const r=await fetch(env.SUPABASE_URL+"/rest/v1/support_messages?select=id,conversation_id,sender_id,sender_role,message,created_at&conversation_id=eq."+conversationId+"&order=created_at.asc",{headers:userHeaders});
        return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      }
      const b=await request.json().catch(()=>null);
      if(!b?.conversation_id||!/^[0-9a-f-]{36}$/i.test(b.conversation_id)||!String(b.message||"").trim())return apiReply({error:"Conversation and message are required."},400);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/support_messages",{method:"POST",headers:userHeaders,body:JSON.stringify({conversation_id:b.conversation_id,sender_id:user.id,sender_role:"customer",message:String(b.message).trim().slice(0,4000)})});
      if(!r.ok)return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      await fetch(env.SUPABASE_URL+"/rest/v1/support_conversations?id=eq."+b.conversation_id,{method:"PATCH",headers:userHeaders,body:JSON.stringify({status:"open",updated_at:new Date().toISOString()})});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/admin/support" && request.method==="GET"){
      if(!bearer.startsWith("Bearer "))return apiReply({error:"Admin sign-in required."},401);
      const allowed=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/is_admin",{method:"POST",headers:userHeaders,body:"{}"});
      if(!allowed.ok||await allowed.json().catch(()=>false)!==true)return apiReply({error:"Admin access required."},403);

      const r=await fetch(env.SUPABASE_URL+"/rest/v1/support_conversations?select=id,user_id,subject,status,created_at,updated_at&order=updated_at.desc&limit=100",{headers:userHeaders});
      return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
    }
    if(url.pathname==="/api/admin/support/reply" && request.method==="POST"){
      if(!bearer.startsWith("Bearer "))return apiReply({error:"Admin sign-in required."},401);
      const allowed=await fetch(env.SUPABASE_URL+"/rest/v1/rpc/is_admin",{method:"POST",headers:userHeaders,body:"{}"});
      if(!allowed.ok||await allowed.json().catch(()=>false)!==true)return apiReply({error:"Admin access required."},403);

      const me=await fetch(env.SUPABASE_URL+"/auth/v1/user",{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:bearer}});
      if(!me.ok)return apiReply({error:"Your session has expired. Sign in again."},401);
      const user=await me.json(),b=await request.json().catch(()=>null);
      if(!b?.conversation_id||!/^[0-9a-f-]{36}$/i.test(b.conversation_id)||!String(b.message||"").trim())return apiReply({error:"Conversation and reply are required."},400);
      const r=await fetch(env.SUPABASE_URL+"/rest/v1/support_messages",{method:"POST",headers:userHeaders,body:JSON.stringify({conversation_id:b.conversation_id,sender_id:user.id,sender_role:"admin",message:String(b.message).trim().slice(0,4000)})});
      if(!r.ok)return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      await fetch(env.SUPABASE_URL+"/rest/v1/support_conversations?id=eq."+b.conversation_id,{method:"PATCH",headers:userHeaders,body:JSON.stringify({status:"answered",updated_at:new Date().toISOString()})});
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
          const history=Array.isArray(b?.history)?b.history.filter(m=>m&&["user","assistant"].includes(m.role)&&typeof m.content==="string").slice(-10).map(m=>({role:m.role,content:m.content.slice(0,1200)})):[];
          const out=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{messages:[{role:"system",content:marketContext},...history,{role:"user",content:question}],max_tokens:650});
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
      const isPost=url.pathname==="/api/orders" && request.method==="POST";
      if(!isPost && !bearer.startsWith("Bearer ")) return apiReply({error:"Sign in is required to access account order history."},401);
      const headers={apikey:env.SUPABASE_ANON_KEY,authorization:bearer.startsWith("Bearer ")?bearer:"Bearer "+env.SUPABASE_ANON_KEY,"content-type":"application/json",accept:"application/json"};
      if(isPost){
        const b=await request.json().catch(()=>null);
        if(!Array.isArray(b?.items)||b.items.length<1||b.items.length>30||!b?.address||typeof b.address!=="object") return apiReply({error:"Please select a product and enter your delivery details."},400);
        const paymentChannel=String(b?.payment_channel||"cod").toLowerCase();const paymentMethod=paymentChannel==="cod"?"cod":"online";if(!["cod","bkash","nagad"].includes(paymentChannel))return apiReply({error:"Choose Cash on Delivery, bKash or Nagad."},400);const rpcUrl=env.SUPABASE_URL+"/rest/v1/rpc/place_order";
        const payload=JSON.stringify({p_items:b.items,p_address:b.address,p_payment_method:paymentMethod,p_payment_channel:paymentChannel});
        let r=await fetch(rpcUrl,{method:"POST",headers,body:payload});
        // A stale/invalid signed-in JWT must not block guest checkout. Retry only an auth failure with the public anon role; the first 401 cannot have created an order.
        if(r.status===401){const guestHeaders={...headers,authorization:"Bearer "+env.SUPABASE_ANON_KEY};r=await fetch(rpcUrl,{method:"POST",headers:guestHeaders,body:payload});}
        return new Response(await r.text(),{status:r.status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
      }
      if(url.pathname==="/api/orders" && request.method==="GET"){
        const number=url.searchParams.get("number");
        if(!number || !/^SH-[A-Z0-9]{10}$/.test(number)) return apiReply({error:"Enter a valid SUHAS order number."},400);
        const u=new URL(env.SUPABASE_URL+"/rest/v1/orders");
        u.search=new URLSearchParams({select:"order_number,status,payment_status,payment_method,payment_channel,subtotal_bdt,discount_bdt,delivery_fee_bdt,total_bdt,created_at",order_number:"eq."+number,limit:"1"}).toString();
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
      const headers={apikey:env.SUPABASE_ANON_KEY,authorization:"Bearer "+env.SUPABASE_ANON_KEY,accept:"application/json"};
      const endpoint=new URL("/rest/v1/products",env.SUPABASE_URL);
      const params={select:"id,name_en,name_bn,slug,description,price_bdt,stock_quantity,image_url,image_urls,category_id,seller_id,created_at",status:"eq.active",order:"created_at.desc",limit:"40"};
      const requestedSlug=url.searchParams.get("slug");if(requestedSlug)params.slug="eq."+requestedSlug;
      endpoint.search=new URLSearchParams(params).toString();
      const upstream=await fetch(endpoint,{headers});
      const raw=await upstream.text();
      if(!upstream.ok)return new Response(raw,{status:upstream.status,headers:{...cors,"content-type":upstream.headers.get("content-type")||"application/json","cache-control":"no-store"}});
      let products;try{products=JSON.parse(raw)}catch{return apiReply({error:"Invalid product data returned by Supabase."},502)}
      if(!Array.isArray(products))return apiReply({error:"Supabase product response was not a list."},502);
      const categoryIds=[...new Set(products.map(p=>p.category_id).filter(Boolean))];
      const sellerIds=[...new Set(products.map(p=>p.seller_id).filter(Boolean))];
      const categoryUrl=new URL("/rest/v1/categories",env.SUPABASE_URL);
      categoryUrl.search=new URLSearchParams({select:"id,name_en,name_bn",id:"in.("+categoryIds.join(",")+")"}).toString();
      const sellerUrl=new URL("/rest/v1/sellers",env.SUPABASE_URL);
      sellerUrl.search=new URLSearchParams({select:"id,store_name,whatsapp_number,slug",id:"in.("+sellerIds.join(",")+")"}).toString();
      const [categoryResponse,sellerResponse]=await Promise.all([
        categoryIds.length?fetch(categoryUrl,{headers}):Promise.resolve(null),
        sellerIds.length?fetch(sellerUrl,{headers}):Promise.resolve(null)
      ]);
      const categoryRows=categoryResponse?.ok?await categoryResponse.json().catch(()=>[]):[];
      const sellerRows=sellerResponse?.ok?await sellerResponse.json().catch(()=>[]):[];
      const categories=new Map(categoryRows.map(x=>[x.id,x]));
      const sellers=new Map(sellerRows.map(x=>[x.id,x]));
      const result=products.map(p=>({...p,category:categories.get(p.category_id)||null,seller:sellers.get(p.seller_id)||null}));
      return new Response(JSON.stringify(result),{status:200,headers:{...cors,"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ service: "SUHAS.COM API", message: "Static storefront assets are not attached yet.", docs: "https://github.com/suhasmaxNY/suhas" });
  }
};

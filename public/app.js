let products = [
  {id:1,name:"Everyday Canvas Tote",category:"Fashion",price:690,emoji:"👜",tag:"BESTSELLER",bg:"#f2e5d6"},
  {id:2,name:"Minimal Ceramic Mug Set",category:"Home",price:850,emoji:"☕",tag:"HOME PICK",bg:"#e7e9df"},
  {id:3,name:"Wireless Earbuds Lite",category:"Electronics",price:1490,emoji:"🎧",tag:"TRENDING",bg:"#e5e7ed"},
  {id:4,name:"Daily Care Essentials Kit",category:"Beauty",price:520,emoji:"🧴",tag:"NEW",bg:"#f3e4e5"},
  {id:5,name:"Classic Analog Watch",category:"Fashion",price:1890,emoji:"⌚",tag:"POPULAR",bg:"#e9e3d9"},
  {id:6,name:"Soft Cotton Cushion",category:"Home",price:740,emoji:"🛋️",tag:"COMFORT",bg:"#e5e9e2"},
  {id:7,name:"Portable Mini Speaker",category:"Electronics",price:1190,emoji:"🔊",tag:"ON THE GO",bg:"#e2e8e9"},
  {id:8,name:"Botanical Skin Lotion",category:"Beauty",price:430,emoji:"🌿",tag:"DAILY CARE",bg:"#e8ecdf"},
  {id:9,name:"Kids Learning Blocks",category:"Kids",price:990,emoji:"🧸",tag:"PLAY & LEARN",bg:"#f2e8d8"},
  {id:10,name:"Reusable Water Bottle",category:"Home",price:390,emoji:"🥤",tag:"ECO PICK",bg:"#dfe9e8"},
  {id:11,name:"Everyday Backpack",category:"Fashion",price:1250,emoji:"🎒",tag:"TRAVEL READY",bg:"#e8e2dc"},
  {id:12,name:"Desk Light Mini",category:"Electronics",price:980,emoji:"💡",tag:"WORKSPACE",bg:"#eee9df"}
];
const categoryMeta = [{name:"Fashion",icon:"👕"},{name:"Electronics",icon:"🎧"},{name:"Home",icon:"🪴"},{name:"Beauty",icon:"🧴"},{name:"Kids",icon:"🧸"}];
const copy = {
 en:{topline:"Bangladesh-wide delivery · Secure shopping · Seller marketplace",categories:"Categories",sell:"Become a seller",heroEyebrow:"A BETTER WAY TO SHOP",heroTitle:"Good finds.<br><em>Great everyday.</em>",heroText:"Explore thoughtful picks from growing local businesses and trusted sellers.",shopNow:"Explore products",heroNote:"Made for Bangladesh. Ready for everywhere.",trust1:"Curated local sellers",trust2:"Clear product details",trust3:"Convenient checkout",trust4:"Growing with you",browse:"FIND YOUR NEXT FAVOURITE",categoryTitle:"Shop by category",viewAll:"View all products ↗",JUST_FOR_YOU:"THE GOOD STUFF",productTitle:"Popular right now",sellerTitle:"Your business deserves<br>a bigger stage.",sellerText:"Bring your products to a marketplace built to help local businesses reach more customers.",sellerCta:"Start selling ↗",footer:"A marketplace for better everyday finds."},
 bn:{topline:"সারা বাংলাদেশে ডেলিভারি · নিরাপদ কেনাকাটা · বিক্রেতাদের মার্কেটপ্লেস",categories:"ক্যাটাগরি",sell:"বিক্রেতা হোন",heroEyebrow:"কেনাকাটার নতুন অভিজ্ঞতা",heroTitle:"পছন্দের পণ্য।<br><em>প্রতিদিনের আনন্দ।</em>",heroText:"দেশের স্থানীয় ব্যবসা ও বিশ্বস্ত বিক্রেতাদের বাছাই করা পণ্য ঘুরে দেখুন।",shopNow:"পণ্য দেখুন",heroNote:"বাংলাদেশের জন্য তৈরি। সবার জন্য প্রস্তুত।",trust1:"বাছাই করা স্থানীয় বিক্রেতা",trust2:"পণ্যের পরিষ্কার তথ্য",trust3:"সহজ অর্ডার",trust4:"আপনার সঙ্গে এগিয়ে চলা",browse:"আপনার পছন্দের পণ্য খুঁজুন",categoryTitle:"ক্যাটাগরি অনুযায়ী কিনুন",viewAll:"সব পণ্য দেখুন ↗",JUST_FOR_YOU:"দারুণ সব পণ্য",productTitle:"এখন জনপ্রিয়",sellerTitle:"আপনার ব্যবসার প্রাপ্য<br>আরও বড় পরিসর।",sellerText:"স্থানীয় ব্যবসাকে আরও ক্রেতার কাছে পৌঁছে দিতে SUHAS-এ পণ্য যুক্ত করুন।",sellerCta:"বিক্রি শুরু করুন ↗",footer:"প্রতিদিনের প্রয়োজনীয় পণ্যের মার্কেটপ্লেস।"}
};
let language="en", activeCategory="All", searchTerm="", cart=JSON.parse(localStorage.getItem("suhas-cart")||"[]");
const $=s=>document.querySelector(s), money=n=>"৳"+Number(n).toLocaleString("en-BD");

async function loadMarketplaceProducts(){
  try {
    const response = await fetch("/api/products", {headers:{accept:"application/json"}});
    if (!response.ok) throw new Error("Catalogue unavailable");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Unexpected catalogue response");
    if (!rows.length) { $("#demoLabel").textContent = "NO LIVE PRODUCTS YET · SAMPLE ITEMS SHOWN"; return; }
    const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    products = rows.map(p => {
      const category = safe(p.category?.name_en || "Other");
      return {id:p.id,name:safe(p.name_en || p.name_bn || "Product"),category,price:Number(p.price_bdt),emoji:"📦",tag:"LOCAL SELLER",bg:"#f2eee8"};
    });
    categoryMeta.splice(0, categoryMeta.length, ...[...new Set(products.map(p=>p.category))].map(name=>({name,icon:"📦"})));
    $("#demoLabel").textContent = "LIVE SELLER CATALOGUE";
    renderCategories(); renderFilters(); renderProducts(); renderCart();
  } catch (error) {
    $("#demoLabel").textContent = "DEMO CATALOGUE · DATABASE NOT CONNECTED";
    console.info("SUHAS catalogue:", error.message);
  }
}

function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2100)}
function renderCategories(){$("#categoryGrid").innerHTML=categoryMeta.map(c=>'<button class="category-tile '+(activeCategory===c.name?'active':'')+'" data-category="'+c.name+'"><span class="category-icon">'+c.icon+'</span><b>'+c.name+'</b></button>').join("");$("#categoryGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>setCategory(b.dataset.category))}
function renderFilters(){const names=["All",...categoryMeta.map(c=>c.name)];$("#filterChips").innerHTML=names.map(n=>'<button class="chip '+(activeCategory===n?'active':'')+'" data-category="'+n+'">'+n+'</button>').join("");$("#filterChips").querySelectorAll("button").forEach(b=>b.onclick=()=>setCategory(b.dataset.category))}
function setCategory(name){activeCategory=name;renderCategories();renderFilters();renderProducts()}
function renderProducts(){let list=products.filter(p=>(activeCategory==="All"||p.category===activeCategory)&&(p.name+" "+p.category).toLowerCase().includes(searchTerm));const sort=$("#sortSelect").value;if(sort==="low")list.sort((a,b)=>a.price-b.price);if(sort==="high")list.sort((a,b)=>b.price-a.price);$("#productGrid").innerHTML=list.map(p=>'<article class="product-card"><div class="product-visual" style="background:'+p.bg+'"><span class="product-tag">'+p.tag+'</span><span class="emoji">'+p.emoji+'</span></div><div class="product-info"><span class="product-category">'+p.category+'</span><h3>'+p.name+'</h3><div class="product-bottom"><span class="price">'+money(p.price)+'</span><button class="add-button" aria-label="Add '+p.name+' to bag" data-add="'+p.id+'">+</button></div></div></article>').join("");$("#emptyState").hidden=list.length>0;$("#productGrid").querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(Number(b.dataset.add)))}
function saveCart(){localStorage.setItem("suhas-cart",JSON.stringify(cart));renderCart()}
function addToCart(id){const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({id,qty:1});saveCart();showToast("Added to your bag")}
function renderCart(){const count=cart.reduce((s,x)=>s+x.qty,0);$("#cartCount").textContent=count;const lines=cart.map(x=>{const p=products.find(p=>p.id===x.id);return '<div class="cart-line"><div class="cart-thumb">'+p.emoji+'</div><div><b>'+p.name+'</b><small>'+money(p.price)+' each</small></div><div class="qty"><button data-qty="'+p.id+'" data-delta="-1" aria-label="Decrease quantity">−</button><span>'+x.qty+'</span><button data-qty="'+p.id+'" data-delta="1" aria-label="Increase quantity">+</button></div></div>'}).join("");$("#cartItems").innerHTML=lines||'<p class="empty">Your bag is waiting for something good.</p>';$("#cartTotal").textContent=money(cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0));$("#cartItems").querySelectorAll("[data-qty]").forEach(b=>b.onclick=()=>{const item=cart.find(x=>x.id===Number(b.dataset.qty));item.qty+=Number(b.dataset.delta);if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);saveCart()})}
function setLanguage(){const dict=copy[language];document.documentElement.lang=language==="bn"?"bn":"en";document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(dict[key])el.innerHTML=dict[key]});$("#languageToggle").textContent=language==="en"?"বাংলা":"English";$("#searchInput").placeholder=language==="en"?"Search products, brands and more":"পণ্য, ব্র্যান্ড ও আরও কিছু খুঁজুন"}
$("#searchForm").addEventListener("submit",e=>{e.preventDefault();searchTerm=$("#searchInput").value.trim().toLowerCase();renderProducts();$("#products").scrollIntoView({behavior:"smooth"})});
$("#searchInput").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();renderProducts()});
$("#sortSelect").addEventListener("change",renderProducts);
$("#languageToggle").onclick=()=>{language=language==="en"?"bn":"en";setLanguage()};
$("#cartOpen").onclick=()=>$("#cartDrawer").hidden=false;$("#cartClose").onclick=()=>$("#cartDrawer").hidden=true;
$("#cartDrawer").addEventListener("click",e=>{if(e.target.id==="cartDrawer")e.currentTarget.hidden=true});
$("#checkoutButton").onclick=()=>showToast("Checkout will be enabled after Supabase setup. No payment has been taken.");
$("#year").textContent=new Date().getFullYear();
renderCategories();renderFilters();renderProducts();renderCart();setLanguage();loadMarketplaceProducts();

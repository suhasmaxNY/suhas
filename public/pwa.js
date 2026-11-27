(()=>{let deferred=null;const btn=document.getElementById("installAppBtn");if(!btn)return;
const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
const hide=()=>{btn.hidden=true};
if(standalone())hide();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;btn.hidden=false;btn.textContent="⬇ Install App"});
window.addEventListener("appinstalled",()=>{deferred=null;hide();});
btn.addEventListener("click",async()=>{
 if(standalone()){hide();return}
 if(deferred){deferred.prompt();const choice=await deferred.userChoice;deferred=null;if(choice?.outcome==="accepted")hide();return}
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 const msg=ios?"To install SUHAS: tap the Share button in Safari, then choose “Add to Home Screen”.":"To install SUHAS: open your browser menu (⋮) and choose “Install app” or “Add to Home screen”. If this option is missing, use Chrome and open this website over the internet.";
 if(typeof window.showPwaInstallHelp==="function")window.showPwaInstallHelp(msg);else alert(msg);
});

function showUpdateNotice(reg){
 const waiting=reg.waiting;
 if(!waiting||document.getElementById("suhasUpdateNotice"))return;
 const box=document.createElement("div");box.id="suhasUpdateNotice";box.setAttribute("role","status");
 box.innerHTML='<span><b>Software updated</b><small>A new SUHAS version is ready.</small></span><button type="button">Install now</button><button type="button" aria-label="Dismiss">×</button>';
 Object.assign(box.style,{position:"fixed",zIndex:"99999",left:"12px",right:"12px",bottom:"max(14px,env(safe-area-inset-bottom))",maxWidth:"460px",margin:"auto",padding:"13px 14px",borderRadius:"14px",background:"#202020",color:"#fff",boxShadow:"0 8px 30px #0004",display:"flex",alignItems:"center",gap:"12px",fontFamily:"Arial,sans-serif"});
 const span=box.querySelector("span");Object.assign(span.style,{flex:"1",display:"grid",gap:"4px"});span.querySelector("small").style.cssText="font-size:11px;color:#ddd";
 const buttons=box.querySelectorAll("button");Object.assign(buttons[0].style,{border:0,borderRadius:"20px",padding:"9px 13px",background:"#f85606",color:"#fff",fontWeight:"700",whiteSpace:"nowrap"});Object.assign(buttons[1].style,{border:0,background:"transparent",color:"#fff",fontSize:"20px"});
 buttons[0].onclick=()=>{waiting.postMessage("SUHAS_SKIP_WAITING");buttons[0].textContent="Installing…";buttons[0].disabled=true};
 buttons[1].onclick=()=>box.remove();document.body.appendChild(box);
}
if("serviceWorker"in navigator&&location.protocol==="https:"){
 window.addEventListener("load",async()=>{
  try{
   const reg=await navigator.serviceWorker.register("/sw.js");
   if(reg.waiting&&navigator.serviceWorker.controller)showUpdateNotice(reg);
   reg.addEventListener("updatefound",()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)showUpdateNotice(reg)})});
   setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
   navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!window.__suhasReloading){window.__suhasReloading=true;location.reload()}});
  }catch(e){console.warn("SUHAS offline update check failed",e)}
 });
}
})();
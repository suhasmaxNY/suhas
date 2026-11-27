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
if("serviceWorker"in navigator&&location.protocol==="https:"){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))}
})();
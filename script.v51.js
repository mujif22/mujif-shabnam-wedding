/* Old cached shells → force latest welcome */
(function(){
  try{
    if(!document.querySelector(".welcome-gate, .emerald-gate")){
      location.replace("index.html?r=" + Date.now());
      return;
    }
  }catch(_e){}
})();

const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse=window.matchMedia("(pointer: coarse)").matches;
let inviteOpened=false;

/* —— Viewport: scale each page to fit every phone/browser —— */
let manualScrollMode=false;

function readViewportSize(){
  const vv=window.visualViewport;
  let h=window.innerHeight || document.documentElement.clientHeight || 0;
  let w=window.innerWidth || document.documentElement.clientWidth || 0;
  if(vv){
    if(vv.height) h=Math.round(vv.height);
    if(vv.width) w=Math.round(vv.width);
  }
  return {
    h:Math.max(320, Math.round(h || 640)),
    w:Math.max(280, Math.round(w || 360))
  };
}

function syncAppViewport(){
  const {h,w}=readViewportSize();
  const root=document.documentElement;
  root.style.setProperty("--app-h", h + "px");
  root.style.setProperty("--app-w", w + "px");
  root.style.setProperty("--screen-min", h + "px");
}

function resetFitTarget(el){
  if(!el) return;
  el.style.transform="";
  el.style.transformOrigin="";
  el.style.marginTop="";
  el.style.marginBottom="";
}

function fitOneContainer(container, childSel, vh){
  if(!container) return;
  const el=container.querySelector(childSel);
  if(!el) return;
  const isGate=container.classList.contains("emerald-gate") || container.classList.contains("welcome-gate");

  resetFitTarget(el);
  container.classList.remove("is-fitted","is-compact","is-scrollable");
  container.style.overflow="";
  container.style.overflowX="";
  container.style.overflowY="";
  if(!isGate){
    /* Lock every invite page to exactly one phone screen — no extra bottom stretch */
    container.style.height=vh + "px";
    container.style.minHeight=vh + "px";
    container.style.maxHeight=vh + "px";
    container.style.overflow="hidden";
  }
  void el.offsetHeight;

  const cs=getComputedStyle(container);
  const padY=(parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const boxH=isGate ? (container.clientHeight || vh) : vh;
  const avail=Math.max(180, boxH - padY - 4);
  const need=Math.max(el.scrollHeight, el.offsetHeight);

  if(need <= avail + 2){
    container.style.setProperty("--fit-scale", "1");
    return;
  }

  const scale=Math.max(0.62, Math.min(1, avail / need));
  el.style.transformOrigin="center center";
  el.style.transform=`scale(${scale})`;
  const shrink=need * (1 - scale);
  el.style.marginTop=`${(-shrink / 2).toFixed(1)}px`;
  el.style.marginBottom=`${(-shrink / 2).toFixed(1)}px`;
  container.style.setProperty("--fit-scale", String(scale.toFixed(4)));
  container.classList.add("is-fitted");
}

function fitAllPages(){
  syncAppViewport();
  const {h:vh}=readViewportSize();
  fitOneContainer(document.querySelector(".welcome-gate.emerald-gate, .emerald-gate"), ".emerald-gate-sheet", vh);
  document.querySelectorAll("#invitation .screen").forEach(screen=>{
    const sel=screen.classList.contains("host") ? ".host-sheet" : ".content";
    fitOneContainer(screen, sel, vh);
  });
}

function scheduleFitScreens(){
  window.requestAnimationFrame(()=>{
    fitAllPages();
    window.requestAnimationFrame(fitAllPages);
  });
}

syncAppViewport();
scheduleFitScreens();
window.addEventListener("orientationchange", ()=>{
  window.setTimeout(scheduleFitScreens, 120);
  window.setTimeout(scheduleFitScreens, 400);
  window.setTimeout(scheduleFitScreens, 900);
});
window.addEventListener("resize", scheduleFitScreens, {passive:true});
window.addEventListener("pageshow", scheduleFitScreens);
window.addEventListener("load", scheduleFitScreens);
window.setTimeout(scheduleFitScreens, 80);
window.setTimeout(scheduleFitScreens, 400);
window.setTimeout(scheduleFitScreens, 1200);
if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(scheduleFitScreens).catch(()=>{});
}
if(window.visualViewport){
  window.visualViewport.addEventListener("resize", ()=>{
    if(manualScrollMode) return;
    scheduleFitScreens();
  }, {passive:true});
}

/* Never restore mid-page — always open on the first host screen */
if("scrollRestoration" in history) history.scrollRestoration="manual";

function pinToStart(){
  const root=document.documentElement;
  root.style.scrollBehavior="auto";
  window.scrollTo(0, 0);
  root.scrollTop=0;
  document.body.scrollTop=0;
}

function showReveal(el){
  el.classList.add("in");
  const screen=el.closest(".screen");
  if(screen) screen.classList.add("is-visible");
}

function hideReveal(el){
  el.classList.remove("in");
}

/** @param {Element} el @param {"start-to-end"|"end-to-start"} dir */
function restartReveal(el, dir){
  hideReveal(el);
  el.classList.toggle("from-end", dir === "end-to-start");
  el.classList.toggle("from-start", dir !== "end-to-start");
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      showReveal(el);
    });
  });
}

function revealFirstScreens(){
  const first=document.querySelector("#invitation > .screen");
  if(first){
    first.classList.add("is-visible");
    const rev=first.querySelector(".reveal");
    if(rev){
      rev.classList.add("from-start");
      showReveal(rev);
    }
  }
}

/** Replay host/first-page word animation after Tap to open */
function playOpeningReveal(){
  const first=document.querySelector("#invitation > .screen");
  if(!first) return;
  const rev=first.querySelector(".reveal");
  if(!rev) return;
  first.classList.add("is-visible");
  if(reduceMotion){
    showReveal(rev);
    return;
  }
  /* Force CSS animations to restart */
  rev.classList.remove("in","from-end","from-start");
  rev.querySelectorAll(".anim-item,.w").forEach(el=>{
    el.style.animation="none";
    void el.offsetWidth;
    el.style.animation="";
  });
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      rev.classList.add("from-start");
      showReveal(rev);
      if(typeof markRevealPlayed === "function") markRevealPlayed(rev);
    });
  });
}

pinToStart();
window.addEventListener("pageshow", pinToStart);
window.addEventListener("load", pinToStart);

/* Countdown */
const target=new Date("2026-09-27T11:30:00+05:30").getTime();
const dayEl=document.getElementById("days");
const hourEl=document.getElementById("hours");
const minEl=document.getElementById("minutes");
const secEl=document.getElementById("seconds");
let prev={d:"",h:"",m:"",s:""};

function setDigit(el, value, key){
  const next=String(value).padStart(2,"0");
  if(prev[key] !== next){
    el.textContent=next;
    if(!reduceMotion && prev[key] !== ""){
      el.classList.remove("tick");
      void el.offsetWidth;
      el.classList.add("tick");
    }
    prev[key]=next;
  }
}

function tick(){
  let d=Math.max(0, target - Date.now());
  const days=Math.floor(d/86400000); d%=86400000;
  const hours=Math.floor(d/3600000); d%=3600000;
  const mins=Math.floor(d/60000); d%=60000;
  const secs=Math.floor(d/1000);
  setDigit(dayEl, days, "d");
  setDigit(hourEl, hours, "h");
  setDigit(minEl, mins, "m");
  setDigit(secEl, secs, "s");
}
tick();
setInterval(tick, 1000);

/* —— Word-by-word smooth reveal —— */
function splitWords(root){
  if(!root || root.dataset.split === "1" || reduceMotion) return;
  /* Word-split + foil clip breaks Devanagari matras — skip in Hindi */
  if(document.body.classList.contains("lang-hi")) return;
  root.dataset.split="1";
  const wantFoil=root.classList.contains("foil") || root.dataset.foil === "1";
  const wantFoilSoft=root.classList.contains("foil-soft") || root.dataset.foilSoft === "1";
  if(wantFoil) root.dataset.foil="1";
  if(wantFoilSoft) root.dataset.foilSoft="1";
  let i=0;

  function wrapText(textNode){
    const raw=textNode.textContent;
    if(!raw || !/\S/.test(raw)) return;
    const frag=document.createDocumentFragment();
    raw.split(/(\s+)/).forEach(part=>{
      if(!part) return;
      if(/^\s+$/.test(part)){
        frag.appendChild(document.createTextNode(part));
        return;
      }
      const span=document.createElement("span");
      span.className="w";
      span.style.setProperty("--i", String(i++));
      span.textContent=part;
      if(wantFoil) span.classList.add("foil");
      if(wantFoilSoft) span.classList.add("foil-soft");
      frag.appendChild(span);
    });
    textNode.parentNode.replaceChild(frag, textNode);
  }

  function walk(node){
    if(node.nodeType === Node.TEXT_NODE){
      wrapText(node);
      return;
    }
    if(node.nodeType !== Node.ELEMENT_NODE) return;
    const tag=node.tagName;
    if(tag === "BR") return;
    if(tag === "EM"){
      node.classList.add("w");
      node.style.setProperty("--i", String(i++));
      return;
    }
    if(tag === "SPAN" && node.childNodes.length === 1 && node.textContent.trim() === "&"){
      node.classList.add("w","w-amp");
      node.style.setProperty("--i", String(i++));
      return;
    }
    [...node.childNodes].forEach(walk);
  }

  walk(root);
  root.classList.add("is-split");
  root.style.setProperty("--wc", String(Math.max(i, 1)));
}

/* —— Bilingual EN / Hindi —— */
const I18N={
  en:{
    wedding_invitation:"WEDDING INVITATION",
    welcome_title:"Wedding<span>Invitation</span>",
    welcome_line1:"Wedding",
    welcome_line2:"Invitation",
    names_amp:"Mujif <em>&</em> Shabnam",
    tap_to_open:"Tap to open",
    tap_again_music:"Tap again for music",
    host_blessing:"With the blessings of Allah",
    host_eyebrow:"THE FAMILIES OF",
    host_families:"Attar <em>&</em> Shaikh",
    host_hi_title:"",
    host_hi_date:"",
    host_hi_day:"",
    host_invite:"cordially invite you to celebrate<br>the sacred Nikah &amp; Walima of",
    host_note:"YOUR PRESENCE WILL BE AN HONOUR AND A BLESSING, INSHA’ALLAH.",
    gate_sub:"Rooted in Faith • Bound by Love",
    gate_nikah_row:"<b>Nikah</b><span>27 September 2026</span>",
    gate_walima_row:"<b>Walima</b><span>29 September 2026</span>",
    ayah_eyebrow:"A BEAUTIFUL AYAH",
    ayah_translation:"“And among His signs is that He created for you spouses from among yourselves so that you may find tranquility in them; and He placed between you affection and mercy.”",
    ayah_ref:"QUR’AN • 30:21",
    blessing_note:"May Allah bless this union with love, peace, barakah and endless happiness.",
    couple_eyebrow:"THE COUPLE",
    couple_title:"A New Chapter<br><em>Begins Together</em>",
    couple_lead:"Two hearts • One niyyah • Forever in Allah’s care",
    groom_label:"THE GROOM",
    groom_name:"Mujif",
    groom_parent:"Son of Attar Gafur Hasan",
    groom_place:"Resident of Ieet<br>Taluka Bhoom, District Dharashiv",
    bride_label:"THE BRIDE",
    bride_name:"Shabnam",
    bride_parent:"Daughter of Shaikh Rahim Ansar",
    bride_place:"Resident of Dindrud<br>Taluka Majalgaon, District Beed",
    nikah:"Nikah",
    nikah_month_year:"SEPTEMBER<br>2026",
    nikah_day:"SUNDAY",
    nikah_time:"11:30 AM",
    nikah_venue:"Swaraj Mangal Karyalaya",
    nikah_address:"Telgaon Road, Dindrud<br>Taluka Majalgaon, District Beed",
    open_maps:"OPEN IN MAPS",
    nikah_maps:"OPEN IN MAPS",
    walima_maps:"OPEN IN MAPS",
    nikah_qr:"SCAN FOR NIKAH LOCATION",
    nikah_qr_alt:"QR code for Nikah venue",
    walima:"Walima",
    walima_month_year:"SEPTEMBER<br>2026",
    walima_day:"TUESDAY",
    walima_time:"AFTER ZUHR NAMAZ",
    walima_venue:"Rudra Mangal Karyalaya",
    walima_address:"Pakhrud Road, Ieet<br>Taluka Bhoom, District Dharashiv",
    walima_qr:"SCAN FOR WALIMA LOCATION",
    walima_qr_alt:"QR code for Walima venue",
    countdown_eyebrow:"COUNTDOWN TO NIKAH",
    countdown_title:"The Wait Is<br><em>Almost Over</em>",
    unit_days:"DAYS",
    unit_hours:"HOURS",
    unit_minutes:"MINUTES",
    unit_seconds:"SECONDS",
    countdown_target:"27 September 2026 · Sunday · 11:30 AM",
    countdown_note:"Until two hearts begin one beautiful journey, Insha’Allah.",
    closing_eyebrow:"WITH LOVE & DUA",
    closing_title:"For Being a Part<br><em>of Our Story</em>",
    closing_note:"We ask Allah to fill this journey with sakinah, mawaddah and rahmah.",
    closing_nikah:"Nikah 27 Sep",
    closing_walima:"Walima 29 Sep",
    keep_duas:"Keep us in your duas"
  },
  hi:{
    wedding_invitation:"जश्ने शादी",
    welcome_title:"जश्ने<span>शादी</span>",
    welcome_line1:"जश्ने",
    welcome_line2:"शादी",
    names_amp:"मुजिफ <em>&</em> शबनम",
    tap_to_open:"खोलने के लिए टैप करें",
    tap_again_music:"मौसीक़ी के लिए फिर टैप करें",
    host_blessing:"",
    host_eyebrow:"",
    host_hi_title:"जश्ने शादी",
    host_families:"आतार <em>&</em> शेख़",
    host_invite:"",
    host_note:"",
    host_hi_date:"27 सितंबर 2026",
    host_hi_day:"इतवार",
    gate_sub:"एक मुबारक रिश्ता, एक नई शुरुआत",
    gate_nikah_row:"<b>निकाह</b><span>— 27 सितंबर 2026</span>",
    gate_walima_row:"<b>वलीमा</b><span>— 29 सितंबर 2026</span>",
    ayah_eyebrow:"आयते क़ुरआन",
    ayah_translation:"“और अल्लाह की निशानियों में से ये है कि उसने तुम्हारे लिए तुम्हारी ही क़ौम से जोड़े बनाए ताकि तुम उनके पास सुकून पाओ, और तुम्हारे बीच मुहब्बत & रहमत रख दी।”",
    ayah_ref:"क़ुरआन • ३०:२१",
    blessing_note:"अल्लाह इस अक़्द निकाह को मुहब्बत, सुकून & बरकत से नवाज़े।",
    couple_eyebrow:"",
    couple_title:"एक मुबारक रिश्ते की<br>नई शुरुआत",
    couple_lead:"",
    groom_label:"नुरेचश्म",
    groom_name:"मुजिफ",
    groom_parent:"वल्द : गफूर हसन आतार",
    groom_place:"साकीन : ईट<br>ता. भूम, जि. धाराशिव",
    bride_label:"नुरेचश्मी",
    bride_name:"शबनम",
    bride_parent:"बिन्त : शेख़ रहीम अन्सर",
    bride_place:"साकीन : दिंद्रुड<br>ता. माजलगाव, जि. बीड",
    nikah:"निकाह",
    nikah_month_year:"सितंबर<br>2026",
    nikah_day:"इतवार",
    nikah_time:"11:30 AM",
    nikah_venue:"स्वराज मंगल कार्यालय",
    nikah_address:"तेलगांव रोड, दिंद्रुड<br>ता. माजलगाव, जि. बीड",
    open_maps:"MAPS में खोलें",
    nikah_maps:"MAPS में खोलें",
    nikah_qr:"लोकेशन के लिए QR कोड स्कैन करें",
    nikah_qr_alt:"निकाह के मक़ाम का क्यूआर कोड",
    walima:"वलीमा",
    walima_month_year:"सितंबर<br>2026",
    walima_day:"मंगल",
    walima_time:"ज़ोहर के बाद",
    walima_venue:"रुद्रा मंगल कार्यालय",
    walima_address:"पखरूड रोड, ईट<br>ता. भूम, जि. धाराशिव",
    walima_maps:"MAPS में खोलें",
    walima_qr:"लोकेशन के लिए QR कोड स्कैन करें",
    walima_qr_alt:"वलीमा के मक़ाम का क्यूआर कोड",
    countdown_eyebrow:"निकाह का दिन",
    countdown_title:"अब बस इंतज़ार है...",
    unit_days:"दिन",
    unit_hours:"घंटे",
    unit_minutes:"मिनट",
    unit_seconds:"सेकंड",
    countdown_target:"27 सितंबर 2026 · इतवार · सुबह 11.30 बजे",
    countdown_note:"",
    closing_eyebrow:"मोहब्बत और दुआओं के साथ",
    closing_title:"हमारी ख़ुशी में<br><em>शामिल होने के लिए शुक्रिया</em>",
    closing_note:"",
    closing_nikah:"निकाह — 27 सितंबर",
    closing_walima:"वलीमा — 29 सितंबर",
    keep_duas:"हमें अपनी दुआओं में याद रखिएगा"
  }
};

const LANG_KEY="wedding-lang-v3";
let currentLang="hi";

function t(key){
  const dict=I18N[currentLang] || I18N.en;
  return (dict && dict[key] != null) ? dict[key] : (I18N.en[key] || key);
}

const HI_FONT='"Noto Sans Devanagari","Noto Serif Devanagari",sans-serif';

function applyHindiFonts(isHi){
  const targets=document.querySelectorAll(
    ".title-wedding,.title-invitation,.invite-open-hint,.host-hi-title,.host-families,.host-hi-date,.host-hi-day,.host-couple,.title-hero,.eyebrow,.event-meta,.event-date,.closing h2,.closing-dates,[data-i18n='keep_duas'],.person-card h3,.person-card p,.translation,.blessing-note,.count-note,.couple-lead"
  );
  targets.forEach(el=>{
    if(isHi){
      el.style.setProperty("font-family", HI_FONT, "important");
      el.style.setProperty("letter-spacing", "0", "important");
      el.setAttribute("lang","hi");
    }else{
      el.style.removeProperty("font-family");
      el.style.removeProperty("letter-spacing");
      if(el.classList.contains("title-wedding") || el.classList.contains("title-invitation")){
        el.setAttribute("lang","en");
      }else{
        el.removeAttribute("lang");
      }
    }
  });
  document.querySelectorAll(".gold-btn").forEach(el=>{
    el.style.setProperty("padding", "12px 22px", "important");
    el.style.setProperty("min-height", "44px", "important");
    el.style.setProperty("min-width", isHi ? "210px" : "200px", "important");
    el.style.setProperty("max-width", "min(280px, 86vw)", "important");
    el.style.setProperty("font-size", isHi ? "14px" : "12px", "important");
    el.style.setProperty("font-weight", "700", "important");
    el.style.setProperty("border", "2px solid #d4b36a", "important");
    el.style.setProperty("cursor", "pointer", "important");
    if(isHi){
      el.style.setProperty("font-family", HI_FONT, "important");
      el.style.setProperty("letter-spacing", "0.02em", "important");
      el.style.setProperty("text-transform", "none", "important");
      el.setAttribute("lang","hi");
    }else{
      el.style.removeProperty("font-family");
      el.style.setProperty("letter-spacing", "0.12em", "important");
      el.style.setProperty("text-transform", "uppercase", "important");
      el.removeAttribute("lang");
    }
  });
  /* Keep QR image full size; only caption text is compact */
  document.querySelectorAll(".qr-card img").forEach(img=>{
    img.setAttribute("width","156");
    img.setAttribute("height","156");
    img.style.removeProperty("width");
    img.style.removeProperty("max-width");
    img.style.removeProperty("height");
  });
  document.querySelectorAll(".qr-card span").forEach(span=>{
    span.style.setProperty("font-size", isHi ? "11px" : "10px", "important");
    span.style.setProperty("padding", "7px 10px", "important");
  });
  if(isHi && document.fonts && document.fonts.load){
    document.fonts.load('600 40px "Noto Sans Devanagari"').catch(()=>{});
  }
}

function setLanguage(lang){
  const next=(lang === "hi") ? "hi" : "en";
  currentLang=next;
  try{ localStorage.setItem(LANG_KEY, next); }catch(_e){}

  document.documentElement.lang=next === "hi" ? "hi" : "en";
  document.body.classList.remove("lang-en","lang-hi");
  document.body.classList.add(next === "hi" ? "lang-hi" : "lang-en");

  const dict=I18N[next] || I18N.en;

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.getAttribute("data-i18n");
    if(key && dict[key] != null) el.textContent=dict[key];
    if(el.classList.contains("title-wedding") || el.classList.contains("title-invitation")){
      el.setAttribute("lang", next === "hi" ? "hi" : "en");
    }
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el=>{
    const key=el.getAttribute("data-i18n-html");
    if(key && dict[key] != null) el.innerHTML=dict[key];
  });
  document.querySelectorAll("[data-i18n-alt]").forEach(el=>{
    const key=el.getAttribute("data-i18n-alt");
    if(key && dict[key] != null) el.setAttribute("alt", dict[key]);
  });

  document.querySelectorAll(".split-words").forEach(el=>{
    delete el.dataset.split;
    el.classList.remove("is-split");
    if(el.dataset.foil === "1") el.classList.add("foil");
    if(el.dataset.foilSoft === "1") el.classList.add("foil-soft");
  });
  if(next !== "hi"){
    document.querySelectorAll(".split-words").forEach(splitWords);
  }

  applyHindiFonts(next === "hi");
  scheduleFitScreens();

  document.querySelectorAll(".lang-btn").forEach(btn=>{
    const active=btn.getAttribute("data-lang") === next;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function initLanguage(){
  let saved="hi";
  try{ saved=localStorage.getItem(LANG_KEY) || "hi"; }catch(_e){}
  setLanguage(saved === "en" ? "en" : "hi");

  const switcher=document.getElementById("langSwitch");
  if(!switcher) return;
  switcher.addEventListener("click", (e)=>{
    e.stopPropagation();
    const btn=e.target && e.target.closest ? e.target.closest(".lang-btn") : null;
    if(!btn) return;
    e.preventDefault();
    const lang=btn.getAttribute("data-lang");
    if(lang) setLanguage(lang);
  });
  ["pointerdown","touchstart"].forEach(evt=>{
    switcher.addEventListener(evt, (e)=>{ e.stopPropagation(); }, {passive:true});
  });
}

initLanguage();


/*
  Upar scroll  = start → end (page scroll down)
  Neeche scroll = end → start (page scroll up)
*/
const reveals=[...document.querySelectorAll(".reveal")];
const screens=document.querySelectorAll("#invitation > .screen");
const hasOpenGate=!!document.getElementById("openGate");
let markRevealPlayed=null;

/* Don't animate first page under the gate — wait for Tap to open */
if(!hasOpenGate) revealFirstScreens();

if(reduceMotion){
  reveals.forEach(showReveal);
  screens.forEach(s=>s.classList.add("is-visible"));
}else{
  const played=new WeakMap();
  markRevealPlayed=(el)=>{ played.set(el, true); };
  let lastY=window.scrollY || 0;
  let dir="start-to-end";

  function updateDir(){
    const y=window.scrollY || 0;
    if(Math.abs(y - lastY) < 2) return;
    dir=y > lastY ? "start-to-end" : "end-to-start";
    lastY=y;
  }

  function sectionGone(rect, vh){
    return rect.bottom < -40 || rect.top > vh + 40;
  }

  function sectionEntering(rect, vh){
    if(dir === "start-to-end"){
      return rect.top < vh * 0.88 && rect.bottom > vh * 0.08;
    }
    return rect.bottom > vh * 0.12 && rect.top < vh * 0.92;
  }

  function syncReveals(){
    updateDir();
    const vh=window.innerHeight || 1;
    reveals.forEach(el=>{
      const rect=el.getBoundingClientRect();
      if(sectionGone(rect, vh)){
        played.set(el, false);
        return;
      }
      if(!sectionEntering(rect, vh)) return;
      if(played.get(el)) return;
      /* Host stays gated until Tap to open */
      if(hasOpenGate && !inviteOpened && el.closest("#host, .screen.host")) return;
      played.set(el, true);
      restartReveal(el, dir);
      const screen=el.closest(".screen");
      if(screen) screen.classList.add("is-visible");
    });
  }

  let ticking=false;
  function onScroll(){
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{
      syncReveals();
      ticking=false;
    });
  }

  window.addEventListener("scroll", onScroll, {passive:true});
  window.addEventListener("resize", onScroll, {passive:true});
  syncReveals();
}

function clearWillChange(){
  document.querySelectorAll(".anim-item,.w").forEach(el=>{
    el.style.willChange="auto";
  });
}

/* Soft sparks briefly on first paint, then stop (cover stays put) */
const canvas=document.getElementById("sparkCanvas");
const ctx=canvas && canvas.getContext ? canvas.getContext("2d") : null;
let sparks=[];
let w=0, h=0;
let sparkRaf=0;
let sparksActive=true;

function resizeCanvas(){
  if(!canvas) return;
  const dpr=Math.min(window.devicePixelRatio || 1, 2);
  w=canvas.width=window.innerWidth * dpr;
  h=canvas.height=window.innerHeight * dpr;
  canvas.style.width=window.innerWidth + "px";
  canvas.style.height=window.innerHeight + "px";
}

function spawnSpark(x, y, force){
  const n=force ? (isCoarse ? 18 : 28) : 1;
  for(let i=0;i<n;i++){
    sparks.push({
      x: x + (Math.random()-0.5)*(force?70:20),
      y: y + (Math.random()-0.5)*(force?50:20),
      vx:(Math.random()-0.5)*(force?3.4:0.4),
      vy: force ? (Math.random()*-2.8 - 0.5) : (Math.random()*-0.4 - 0.05),
      life: force ? 1 : 0.55 + Math.random()*0.4,
      fade: force ? 0.012 + Math.random()*0.014 : 0.003 + Math.random()*0.004,
      r: force ? 1.1 + Math.random()*2.2 : 0.55 + Math.random()*1.1
    });
  }
}

function loopSparks(){
  if(!ctx || !sparksActive) return;
  ctx.clearRect(0,0,w,h);
  if(Math.random() < 0.04){
    spawnSpark(Math.random()*w, Math.random()*h*0.72, false);
  }
  sparks=sparks.filter(s=>s.life>0);
  for(const s of sparks){
    s.x+=s.vx; s.y+=s.vy; s.life-=s.fade;
    ctx.beginPath();
    ctx.fillStyle=`rgba(240,213,138,${Math.max(0,s.life)})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  }
  sparkRaf=requestAnimationFrame(loopSparks);
}

function stopSparkLoop(){
  sparksActive=false;
  if(sparkRaf) cancelAnimationFrame(sparkRaf);
  sparkRaf=0;
  sparks=[];
  if(ctx) ctx.clearRect(0,0,w,h);
  if(canvas) canvas.style.display="none";
  clearWillChange();
}

if(ctx && !reduceMotion){
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, {passive:true});
  loopSparks();
  window.setTimeout(stopSparkLoop, 2200);
}else{
  clearWillChange();
}

/* Cross-browser music + timed auto-scroll (4s).
   - Tap to open → music + auto-scroll
   - Manual scroll attempt → auto off, manual on
   - Reach last screen → music stops
   - Scroll back to top → music starts again */
const bgMusic=document.getElementById("bgMusic");
const openGate=document.getElementById("openGate");
const openGateHint=openGate ? openGate.querySelector(".open-gate-hint") : null;
const autoScreens=[...document.querySelectorAll("#invitation > .screen")];
let musicPlaying=false;
let audioCtx=null;
let decodedBuffer=null;
let webSource=null;
let webGain=null;
let musicMode="none"; /* html | webaudio | none */
let autoOn=false;
let autoTimer=0;
let autoRaf=0;
let autoIndex=0;
let ignoreInterruptUntil=0;
let musicEndedAtBottom=false;

function musicSrc(){
  try{
    return new URL("assets/instrumental.mp3", window.location.href).href;
  }catch(e){
    return "assets/instrumental.mp3";
  }
}

function pinLangSwitchAfterOpen(){
  const switcher=document.getElementById("langSwitch");
  if(!switcher) return;
  switcher.classList.remove("lang-switch-gate");
  switcher.classList.add("is-fixed");
  if(switcher.parentNode !== document.body){
    document.body.appendChild(switcher);
  }
}

function hideOpenGate(){
  if(!openGate) return;
  pinLangSwitchAfterOpen();
  openGate.classList.add("is-gone");
  document.body.classList.remove("gate-locked");
  scheduleFitScreens();
  window.setTimeout(()=>{
    if(openGate && openGate.parentNode) openGate.parentNode.removeChild(openGate);
    scheduleFitScreens();
  }, 750);
}

function prepareHtmlAudio(){
  if(!bgMusic) return;
  bgMusic.loop=true;
  bgMusic.preload="auto";
  bgMusic.playsInline=true;
  bgMusic.setAttribute("playsinline","");
  bgMusic.setAttribute("webkit-playsinline","");
  const abs=musicSrc();
  const source=bgMusic.querySelector("source");
  if(source) source.src=abs;
  if(!bgMusic.src || bgMusic.src.indexOf("instrumental.mp3") === -1){
    bgMusic.src=abs;
  }
  try{ bgMusic.load(); }catch(e){}
  /* If native loop gaps, restart instantly — no long silence */
  bgMusic.addEventListener("ended", ()=>{
    if(!musicPlaying || musicEndedAtBottom || musicMode !== "html") return;
    try{
      bgMusic.currentTime=0;
      bgMusic.play().catch(()=>{});
    }catch(e){}
  });
}

function unlockAudioContext(){
  try{
    const AC=window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    if(!audioCtx) audioCtx=new AC();
    if(audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }catch(e){
    return null;
  }
}

function stopWebAudio(){
  if(webSource){
    try{ webSource.stop(); }catch(e){}
    try{ webSource.disconnect(); }catch(e){}
    webSource=null;
  }
}

function stopMusic(){
  musicPlaying=false;
  if(bgMusic){
    try{
      bgMusic.pause();
      bgMusic.currentTime=0;
    }catch(e){}
  }
  stopWebAudio();
}

function pauseMusicSoft(){
  /* Pause without resetting — used for real screen-lock only */
  musicPlaying=false;
  if(bgMusic && !bgMusic.paused){
    try{ bgMusic.pause(); }catch(e){}
  }
  if(audioCtx && audioCtx.state === "running"){
    try{ audioCtx.suspend(); }catch(e){}
  }
}

function playHtmlAudio(){
  if(!bgMusic) return Promise.resolve(false);
  if(musicPlaying && musicMode === "html" && !bgMusic.paused){
    return Promise.resolve(true);
  }
  bgMusic.muted=false;
  bgMusic.loop=true;
  bgMusic.volume=0.65;
  try{
    const p=bgMusic.play();
    if(p && typeof p.then === "function"){
      return p.then(()=>{
        musicPlaying=true;
        musicMode="html";
        musicEndedAtBottom=false;
        return true;
      }).catch(()=>false);
    }
    musicPlaying=true;
    musicMode="html";
    musicEndedAtBottom=false;
    return Promise.resolve(true);
  }catch(e){
    return Promise.resolve(false);
  }
}

function startWebAudioFromBuffer(buffer){
  const ctx=unlockAudioContext();
  if(!ctx || !buffer) return false;
  /* Already seamless-looping — do not restart (avoids 1–2s cut) */
  if(musicMode === "webaudio" && webSource && musicPlaying) return true;
  stopWebAudio();
  webSource=ctx.createBufferSource();
  webGain=ctx.createGain();
  webGain.gain.value=0.65;
  webSource.buffer=buffer;
  webSource.loop=true;
  webSource.loopStart=0;
  webSource.loopEnd=buffer.duration;
  webSource.connect(webGain);
  webGain.connect(ctx.destination);
  webSource.start(0);
  musicPlaying=true;
  musicMode="webaudio";
  musicEndedAtBottom=false;
  /* HTML was only for unlock — stop it quietly after seamless WA starts */
  if(bgMusic){
    try{
      bgMusic.pause();
      bgMusic.muted=false;
    }catch(e){}
  }
  return true;
}

function playViaWebAudio(){
  const ctx=unlockAudioContext();
  if(!ctx) return Promise.resolve(false);
  if(musicMode === "webaudio" && webSource && musicPlaying){
    return Promise.resolve(true);
  }
  if(decodedBuffer){
    return Promise.resolve(startWebAudioFromBuffer(decodedBuffer));
  }
  return fetch(musicSrc())
    .then(r=>r.arrayBuffer())
    .then(buf=>ctx.decodeAudioData(buf.slice(0)))
    .then(decoded=>{
      decodedBuffer=decoded;
      return startWebAudioFromBuffer(decoded);
    })
    .catch(()=>false);
}

function startMusicFromGesture(){
  const ctx=unlockAudioContext();
  /* Unlock media in the same tap, then prefer seamless WebAudio loop */
  if(bgMusic){
    try{
      bgMusic.muted=true;
      bgMusic.play().catch(()=>{});
    }catch(e){}
  }
  if(ctx && ctx.state === "suspended") ctx.resume();
  return playViaWebAudio().then((ok)=>{
    if(ok) return true;
    if(bgMusic) bgMusic.muted=false;
    return playHtmlAudio();
  });
}

function resumeMusic(){
  if(musicEndedAtBottom === false && musicPlaying){
    if(musicMode === "html" && bgMusic && !bgMusic.paused) return;
    if(musicMode === "webaudio" && webSource) return;
  }
  musicEndedAtBottom=false;
  if(audioCtx && audioCtx.state === "suspended"){
    audioCtx.resume().catch(()=>{});
  }
  if(musicMode === "webaudio" || decodedBuffer){
    if(webSource && audioCtx && audioCtx.state === "running"){
      musicPlaying=true;
      return;
    }
    playViaWebAudio();
    return;
  }
  playHtmlAudio().then((ok)=>{
    if(!ok) playViaWebAudio();
  });
}

/* If browser pauses audio unexpectedly mid-invite, resume without reset */
window.setInterval(()=>{
  if(!inviteOpened || musicEndedAtBottom || !musicPlaying) return;
  if(document.hidden) return;
  if(musicMode === "html" && bgMusic && bgMusic.paused){
    bgMusic.play().catch(()=>{});
  }
  if(musicMode === "webaudio" && audioCtx && audioCtx.state === "suspended"){
    audioCtx.resume().catch(()=>{});
  }
}, 800);

function clearAutoTimer(){
  if(autoTimer){
    window.clearTimeout(autoTimer);
    autoTimer=0;
  }
}

function cancelAutoAnim(){
  if(autoRaf){
    cancelAnimationFrame(autoRaf);
    autoRaf=0;
  }
}

function stopAutoScroll(){
  autoOn=false;
  manualScrollMode=true;
  clearAutoTimer();
  cancelAutoAnim();
  scheduleFitScreens();
}

function easeInOutCubic(t){
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
}

function setScrollY(y){
  if(!autoOn) return; /* manual mode: never force scroll position */
  const top=Math.max(0, y);
  try{ window.scrollTo({top, left:0, behavior:"auto"}); }catch(e){
    try{ window.scrollTo(0, top); }catch(e2){}
  }
}

function getScrollY(){
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function softScrollTo(top, duration, onDone){
  cancelAutoAnim();
  if(!autoOn){
    if(onDone) onDone();
    return;
  }
  const start=getScrollY();
  const dist=top - start;
  const ms=reduceMotion ? 0 : duration;
  if(Math.abs(dist) < 2 || ms < 50){
    setScrollY(top);
    if(onDone) onDone();
    return;
  }
  const t0=performance.now();
  function frame(now){
    if(!autoOn){
      autoRaf=0;
      return;
    }
    const p=Math.min(1, (now - t0) / ms);
    setScrollY(start + dist * easeInOutCubic(p));
    if(p < 1) autoRaf=requestAnimationFrame(frame);
    else{
      autoRaf=0;
      setScrollY(top);
      if(onDone) onDone();
    }
  }
  autoRaf=requestAnimationFrame(frame);
}

function goToScreen(i, onDone){
  const screen=autoScreens[i];
  if(!screen || !autoOn){
    if(onDone) onDone();
    return;
  }
  autoIndex=i;
  const top=Math.max(0, Math.round(screen.offsetTop || 0));
  softScrollTo(top, 1800, onDone);
}

function finishAutoAtEnd(){
  stopAutoScroll();
  musicEndedAtBottom=true;
  stopMusic();
  releaseScreenWakeLock();
}

/* Keep phone screen on while invitation auto-plays (short screen-timeout devices). */
let screenWakeLock=null;
let keepScreenAwake=false;

async function requestScreenWakeLock(){
  if(!keepScreenAwake) return;
  if(!("wakeLock" in navigator) || typeof navigator.wakeLock.request !== "function") return;
  if(document.hidden || document.visibilityState === "hidden") return;
  try{
    if(screenWakeLock){
      try{ await screenWakeLock.release(); }catch(_e){}
      screenWakeLock=null;
    }
    screenWakeLock=await navigator.wakeLock.request("screen");
    screenWakeLock.addEventListener("release", ()=>{
      screenWakeLock=null;
    });
  }catch(_e){
    screenWakeLock=null;
  }
}

function releaseScreenWakeLock(){
  keepScreenAwake=false;
  if(!screenWakeLock) return;
  try{ screenWakeLock.release(); }catch(_e){}
  screenWakeLock=null;
}

function enableScreenWakeLock(){
  keepScreenAwake=true;
  requestScreenWakeLock();
}

function dwellMsForIndex(i){
  /* First page 5s, every page from second onward 8s */
  return i <= 0 ? 5000 : 8000;
}

function scheduleAfterDwell(){
  clearAutoTimer();
  if(!autoOn) return;
  if(autoIndex >= autoScreens.length - 1){
    autoTimer=window.setTimeout(finishAutoAtEnd, dwellMsForIndex(autoIndex));
    return;
  }
  autoTimer=window.setTimeout(()=>{
    if(!autoOn) return;
    const next=autoIndex + 1;
    goToScreen(next, ()=>{
      if(!autoOn) return;
      if(next >= autoScreens.length - 1){
        autoTimer=window.setTimeout(finishAutoAtEnd, dwellMsForIndex(next));
      }else{
        scheduleAfterDwell();
      }
    });
  }, dwellMsForIndex(autoIndex));
}

function startAutoScroll(){
  if(!autoScreens.length) return;
  if(autoOn) return;
  manualScrollMode=false;
  autoOn=true;
  autoIndex=nearestScreenIndexSafe();
  ignoreInterruptUntil=Date.now() + 1800;
  const y=autoScreens[autoIndex] ? Math.max(0, autoScreens[autoIndex].offsetTop) : 0;
  try{ window.scrollTo(0, y); }catch(e){}
  document.documentElement.scrollTop=y;
  document.body.scrollTop=y;
  scheduleAfterDwell();
}

function nearestScreenIndexSafe(){
  const y=getScrollY() + (window.innerHeight * 0.25);
  let best=0, bestDist=Infinity;
  autoScreens.forEach((s, i)=>{
    const d=Math.abs((s.offsetTop || 0) - y);
    if(d < bestDist){ bestDist=d; best=i; }
  });
  return best;
}

let touchStartY=0;
let touchArmed=false;

function onUserWantManual(e){
  if(!autoOn) return;
  const t=e && e.target;
  if(t && t.closest && (t.closest("#openGate") || t.closest(".gold-btn") || t.closest("a"))) return;

  if(e.type === "wheel"){
    stopAutoScroll();
    return;
  }
  if(e.type === "touchstart"){
    touchArmed=true;
    touchStartY=(e.touches && e.touches[0]) ? e.touches[0].clientY : 0;
    /* If auto is mid-animation, prepare to hand off instantly on move */
    return;
  }
  if(e.type === "touchmove" && touchArmed){
    const y=(e.touches && e.touches[0]) ? e.touches[0].clientY : touchStartY;
    const dy=Math.abs(y - touchStartY);
    /* Any real swipe → stop auto immediately so native scroll feels free */
    if(dy > 6){
      stopAutoScroll();
      touchArmed=false;
    }
  }
}

function screenVisibility(screen){
  if(!screen) return 0;
  const r=screen.getBoundingClientRect();
  const vh=window.innerHeight || 1;
  const visible=Math.min(r.bottom, vh) - Math.max(r.top, 0);
  return Math.max(0, visible) / Math.min(r.height || vh, vh);
}

function syncMusicWithScrollPosition(){
  if(!inviteOpened || !autoScreens.length) return;
  if(autoOn) return; /* never touch music during auto-scroll */
  const first=autoScreens[0];
  const last=autoScreens[autoScreens.length - 1];
  const firstVis=screenVisibility(first);
  const lastVis=screenVisibility(last);
  /* Only stop when clearly parked on the final screen */
  if(lastVis > 0.72 && firstVis < 0.15){
    if(musicPlaying){
      musicEndedAtBottom=true;
      stopMusic();
    }
    return;
  }
  if(firstVis > 0.55 && musicEndedAtBottom){
    resumeMusic();
  }
}

let musicScrollTick=false;
function onScrollMusicWatch(){
  if(musicScrollTick) return;
  musicScrollTick=true;
  requestAnimationFrame(()=>{
    musicScrollTick=false;
    syncMusicWithScrollPosition();
  });
}

function openInvitation(e){
  if(inviteOpened) return;
  if(e && e.target && e.target.closest && e.target.closest(".lang-switch, .lang-btn")) return;
  inviteOpened=true;

  const result=startMusicFromGesture();
  hideOpenGate();
  /* Prevent screen sleep until slideshow finishes */
  enableScreenWakeLock();
  /* Word animation on first page — only after gate opens */
  playOpeningReveal();
  window.setTimeout(playOpeningReveal, 80);

  ignoreInterruptUntil=Date.now() + 2000;
  window.setTimeout(()=>{
    startAutoScroll();
    scheduleFitScreens();
  }, 500);
  window.setTimeout(()=>{
    if(!autoOn) startAutoScroll();
  }, 1600);

  if(result && typeof result.then === "function"){
    result.then((ok)=>{
      if(ok) return;
      const retry=()=>{
        startMusicFromGesture().then((ok2)=>{
          if(ok2){
            document.removeEventListener("pointerdown", retry, true);
            document.removeEventListener("touchstart", retry, true);
            if(!autoOn) startAutoScroll();
          }
        });
      };
      document.addEventListener("pointerdown", retry, {capture:true, passive:true});
      document.addEventListener("touchstart", retry, {capture:true, passive:true});
      if(openGateHint) openGateHint.textContent=t("tap_again_music");
    });
  }
}

prepareHtmlAudio();

if(openGate){
  document.body.classList.add("gate-locked");
  openGate.addEventListener("pointerdown", openInvitation, {passive:true});
  openGate.addEventListener("touchstart", openInvitation, {passive:true});
  openGate.addEventListener("click", openInvitation);
}else if(bgMusic){
  playHtmlAudio();
  enableScreenWakeLock();
  startAutoScroll();
}

window.addEventListener("wheel", onUserWantManual, {passive:true});
window.addEventListener("touchstart", onUserWantManual, {passive:true});
window.addEventListener("touchmove", onUserWantManual, {passive:true});
window.addEventListener("scroll", onScrollMusicWatch, {passive:true});

let hideMusicTimer=0;
function onPageHidden(){
  if(!(document.hidden || document.visibilityState === "hidden")) return;
  /* Debounce — phones can flicker hidden during auto-scroll */
  if(hideMusicTimer) window.clearTimeout(hideMusicTimer);
  hideMusicTimer=window.setTimeout(()=>{
    hideMusicTimer=0;
    if(!(document.hidden || document.visibilityState === "hidden")) return;
    stopAutoScroll();
    if(musicPlaying || (bgMusic && !bgMusic.paused) || webSource){
      pauseMusicSoft();
      musicEndedAtBottom=true;
    }
  }, 450);
}

document.addEventListener("visibilitychange", ()=>{
  if(document.hidden || document.visibilityState === "hidden"){
    onPageHidden();
  }else{
    if(hideMusicTimer){
      window.clearTimeout(hideMusicTimer);
      hideMusicTimer=0;
    }
    /* Browser drops wake lock when tab hides — re-request if still playing */
    if(keepScreenAwake) requestScreenWakeLock();
  }
});
window.addEventListener("pagehide", ()=>{
  stopAutoScroll();
  stopMusic();
  musicEndedAtBottom=true;
  releaseScreenWakeLock();
});

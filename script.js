const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse=window.matchMedia("(pointer: coarse)").matches;

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
  root.dataset.split="1";
  const wantFoil=root.classList.contains("foil");
  const wantFoilSoft=root.classList.contains("foil-soft");
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
  if(wantFoil) root.classList.remove("foil");
  if(wantFoilSoft) root.classList.remove("foil-soft");
  root.classList.add("is-split");
  root.style.setProperty("--wc", String(Math.max(i, 1)));
}

document.querySelectorAll(".split-words").forEach(splitWords);

/*
  Upar scroll  = start → end (page scroll down)
  Neeche scroll = end → start (page scroll up)
*/
const reveals=[...document.querySelectorAll(".reveal")];
const screens=document.querySelectorAll("#invitation > .screen");

revealFirstScreens();

if(reduceMotion){
  reveals.forEach(showReveal);
  screens.forEach(s=>s.classList.add("is-visible"));
}else{
  const played=new WeakMap();
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
      /* Coming from bottom: fire a bit before mid-screen */
      return rect.top < vh * 0.88 && rect.bottom > vh * 0.08;
    }
    /* end → start: coming from top — fire early so words animate as section arrives */
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

/* Safari blocks autoplay after opening a link.
   Guests tap once on the open-gate → music starts + invitation opens. */
const bgMusic=document.getElementById("bgMusic");
const openGate=document.getElementById("openGate");
let musicPlaying=false;
let inviteOpened=false;

function musicSrc(){
  try{
    return new URL("assets/instrumental.mp3", window.location.href).href;
  }catch(e){
    return "assets/instrumental.mp3";
  }
}

function hideOpenGate(){
  if(!openGate) return;
  openGate.classList.add("is-gone");
  document.body.classList.remove("gate-locked");
  window.setTimeout(()=>{
    if(openGate && openGate.parentNode) openGate.parentNode.removeChild(openGate);
  }, 750);
}

function startMusicFromGesture(){
  if(!bgMusic || musicPlaying) return Promise.resolve(true);
  bgMusic.muted=false;
  bgMusic.volume=0.65;
  bgMusic.src=musicSrc();
  const p=bgMusic.play();
  if(p && typeof p.then === "function"){
    return p.then(()=>{
      musicPlaying=true;
      return true;
    }).catch(()=>false);
  }
  musicPlaying=true;
  return Promise.resolve(true);
}

function openInvitation(e){
  if(inviteOpened) return;
  if(e){
    e.preventDefault();
    e.stopPropagation();
  }
  inviteOpened=true;
  /* play() must stay inside this tap for Safari */
  const done=startMusicFromGesture();
  hideOpenGate();
  if(done && typeof done.then === "function"){
    done.then((ok)=>{
      if(!ok && bgMusic){
        /* rare retry still within same tick chain */
        bgMusic.play().then(()=>{ musicPlaying=true; }).catch(()=>{});
      }
    });
  }
}

if(bgMusic){
  bgMusic.loop=true;
  bgMusic.preload="auto";
  bgMusic.setAttribute("playsinline","");
  bgMusic.setAttribute("webkit-playsinline","");
  bgMusic.src=musicSrc();
}

if(openGate){
  document.body.classList.add("gate-locked");
  /* Prefer touchend/pointerup — most reliable unlock on iOS Safari */
  openGate.addEventListener("pointerup", openInvitation, {passive:false});
  openGate.addEventListener("touchend", openInvitation, {passive:false});
  openGate.addEventListener("click", openInvitation);
}else if(bgMusic){
  bgMusic.play().then(()=>{ musicPlaying=true; }).catch(()=>{});
}


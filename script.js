const nikahMap="https://www.google.com/maps/search/?api=1&query=Swaraj+Mangal+Karyalaya%2C+Telgaon+Road%2C+Dindrud%2C+Taluka+Majalgaon%2C+District+Beed";
const walimaMap="https://www.google.com/maps/search/?api=1&query=Rudra+Mangal+Karyalaya%2C+Pakhrud+Road%2C+Ieet%2C+Taluka+Bhoom%2C+District+Dharashiv";

// Put the family's WhatsApp number here, digits only, including country code.
// Example: const whatsappNumber="919876543210";
const whatsappNumber="";

function openMap(url){window.open(url,"_blank","noopener,noreferrer");}

const openBtn=document.getElementById("openBtn");
openBtn.addEventListener("click",()=>{
  document.body.classList.add("opened");
  setTimeout(()=>document.getElementById("invitation").scrollIntoView({behavior:"smooth"}),250);
});

const target=new Date("2026-09-27T11:30:00+05:30").getTime();
function tick(){
  let d=Math.max(0,target-Date.now());
  const days=Math.floor(d/86400000); d%=86400000;
  const hours=Math.floor(d/3600000); d%=3600000;
  const mins=Math.floor(d/60000); d%=60000;
  const secs=Math.floor(d/1000);
  document.getElementById("days").textContent=String(days).padStart(2,"0");
  document.getElementById("hours").textContent=String(hours).padStart(2,"0");
  document.getElementById("minutes").textContent=String(mins).padStart(2,"0");
  document.getElementById("seconds").textContent=String(secs).padStart(2,"0");
}
tick();setInterval(tick,1000);

const rsvp=document.getElementById("rsvpBtn");
rsvp.addEventListener("click",e=>{
  if(!whatsappNumber){
    e.preventDefault();
    alert("Please add the WhatsApp number in script.js before publishing.");
    return;
  }
  const text=encodeURIComponent("Assalamu Alaikum. I would like to RSVP for Mujif & Shabnam's wedding. In Sha Allah, I will be there.");
  rsvp.href=`https://wa.me/${whatsappNumber}?text=${text}`;
});

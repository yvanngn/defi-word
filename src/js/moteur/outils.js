/* ================= Outils ================= */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const R=()=>Math.random();
const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
const pickOne=a=>a[Math.floor(R()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z]/g,"");
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=s=>{s=Math.max(0,Math.round(s||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;};
const AVC=["var(--green)","var(--blue)","var(--pink)","#8B5CF6","#14B8A6","#F97316"];
const avatar=(id,name)=>`<span class="av" style="background:${AVC[hash(String(id))%AVC.length]}">${esc((name||"?")[0].toUpperCase())}</span>`;
const rankSort=(a,b)=>((b.done?1:0)-(a.done?1:0))||((b.total||0)-(a.total||0))||((a.time||999)-(b.time||999));
const $=s=>document.querySelector(s);
const app=$("#app");
const dateFr=ms=>new Date(ms).toLocaleString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});


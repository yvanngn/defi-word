/* ================= Multijoueur hors claude.ai : Supabase ================= */
// Même interface que window.claude (db.doc / db.collection / room) pour que le reste du jeu n'y voie aucune différence.
// Table defi_docs (path, coll, data, maj) : voir README. Temps réel par interrogation toutes les POLL_MS.
const SUPA={url:'https://hhyudxnkuoxzrkfkjipn.supabase.co',key:'sb_publishable_buAHqM4Mu-XuRKMM8uJaNQ_PYZhJZ23',table:'defi_docs'};
const POLL_MS=2000, PRESENCE_MS=8000, PRESENCE_TTL=25000;
const supaOn=()=>!!SUPA.key&&typeof fetch==="function"&&/^https?:$/.test(location.protocol);
const supaH=x=>({apikey:SUPA.key,"Content-Type":"application/json",...(x||{})});
const supaUrl=q=>`${SUPA.url}/rest/v1/${SUPA.table}${q||""}`;
const cloneJ=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));

function supaDb(){
  const cache=new Map();        // path → {data, maj}
  const subs=new Set();         // fonctions rappelées après chaque mise à jour du cache
  let dernier="1970-01-01T00:00:00Z",horloge=0;   // dernier maj serveur vu (lecture incrémentale)
  const snap=path=>{const r=cache.get(path);return {exists:!!r,id:path.split("/").pop(),data:()=>r?cloneJ(r.data):undefined};};
  const notifier=()=>subs.forEach(f=>{try{f();}catch{}});
  const ranger=rows=>{let chg=false;for(const r of rows){const old=cache.get(r.path);
      if(!old||JSON.stringify(old.data)!==JSON.stringify(r.data)||old.maj!==r.maj){cache.set(r.path,{data:r.data,maj:r.maj});chg=true;}
      if(r.maj>dernier)dernier=r.maj;const t=Date.parse(r.maj);if(t>horloge)horloge=t;}
    return chg;};
  async function lire(){
    const r=await fetch(supaUrl(`?select=path,data,maj&maj=gte.${encodeURIComponent(dernier)}&order=maj.asc`),{headers:supaH()});
    if(!r.ok)throw new Error("Supabase "+r.status);
    if(ranger(await r.json()))notifier();
  }
  async function ecrire(path,data){
    cache.set(path,{data:cloneJ(data),maj:cache.get(path)?.maj||dernier});notifier();
    const coll=path.split("/")[0];
    const r=await fetch(supaUrl("?on_conflict=path"),{method:"POST",headers:supaH({Prefer:"resolution=merge-duplicates,return=representation"}),body:JSON.stringify({path,coll,data})});
    if(!r.ok)throw new Error("Écriture refusée ("+r.status+")");
    ranger(await r.json());
  }
  // Abonnement : rappel immédiat puis à chaque changement réel du résultat
  const abonner=(calc,cb)=>{let prev=null;const f=()=>{const v=calc(),k=JSON.stringify(v.cle);if(k!==prev){prev=k;cb(v.snap);}};subs.add(f);setTimeout(f,0);return()=>subs.delete(f);};
  const coll=(name,filtre,tri,lim)=>{
    const docs=()=>{let d=[...cache.keys()].filter(k=>k.startsWith(name+"/")).map(snap).filter(s=>!filtre||filtre(s.data()));
      if(tri)d.sort((a,b)=>{const x=a.data()[tri.f],y=b.data()[tri.f];return (x>y?1:x<y?-1:0)*(tri.dir==="desc"?-1:1);});
      return lim?d.slice(0,lim):d;};
    return {
      where:(f,op,v)=>coll(name,d=>(!filtre||filtre(d))&&d&&d[f]===v,tri,lim),
      orderBy:(f,dir)=>coll(name,filtre,{f,dir},lim),
      limit:n=>coll(name,filtre,tri,n),
      get:async()=>{await lire().catch(()=>{});return {docs:docs()};},
      onSnapshot:cb=>abonner(()=>{const d=docs();return {cle:d.map(s=>[s.id,s.data()]),snap:{docs:d}};},cb)
    };
  };
  const db={
    doc:path=>({
      get:async()=>{await lire().catch(()=>{});return snap(path);},
      set:v=>ecrire(path,v),
      update:v=>ecrire(path,{...(cache.get(path)?.data||{}),...v}),
      onSnapshot:cb=>abonner(()=>({cle:cache.get(path)?.data??null,snap:snap(path)}),cb)
    }),
    collection:n=>coll(n),
    lire,
    maintenant:()=>horloge||Date.now(),   // horloge du serveur (dernier maj vu) pour la présence
    cache
  };
  setInterval(()=>lire().catch(()=>{}),POLL_MS);
  return db;
}

// Présence (remplace room) : presence/<uid> réécrit toutes les PRESENCE_MS ; présent si vu il y a moins de PRESENCE_TTL
function supaRoom(db){
  let pres=null,cbs=[];
  const peersDe=()=>{const now=db.maintenant();
    return [...db.cache.entries()].filter(([k,r])=>k.startsWith("presence/")&&now-Date.parse(r.maj)<PRESENCE_TTL&&r.data?.pseudo)
      .map(([k,r])=>({kind:"viewer",by:k.slice(9),presence:r.data,isMe:k.slice(9)===uid}));};
  db.collection("presence").onSnapshot(()=>{const p=peersDe();cbs.forEach(cb=>cb({peers:p}));});
  setInterval(()=>{if(pres)db.doc("presence/"+uid).set(pres).catch(()=>{});else{const p=peersDe();cbs.forEach(cb=>cb({peers:p}));}},PRESENCE_MS);
  return {
    onPeers:cb=>{cbs.push(cb);cb({peers:peersDe()});},
    presence:async data=>{pres=data;await db.doc("presence/"+uid).set(data);}
  };
}

// Identité locale (pas de compte) et droits d'admin par mot de passe (empreinte SHA-256 dans meta/admin)
function uidLocal(){let u=null;try{u=localStorage.getItem("defi:uid");}catch{}
  if(!u){u="u"+Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{localStorage.setItem("defi:uid",u);}catch{}}return u;}
async function empreinte(t){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("defi:"+t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function adminLocal(){
  let h=null;try{h=localStorage.getItem("defi:admin");}catch{}
  if(!h)return false;const a=await db.doc("meta/admin").get();return a.exists&&a.data().h===h;
}
// Premier mot de passe saisi = mot de passe admin ; ensuite il faut le même
async function devenirAdmin(mdp){
  mdp=String(mdp||"").trim();if(mdp.length<4)return "4 caractères minimum.";
  const h=await empreinte(mdp),a=await db.doc("meta/admin").get();
  if(a.exists&&a.data().h!==h)return "Mot de passe incorrect.";
  if(!a.exists)await db.doc("meta/admin").set({h});
  try{localStorage.setItem("defi:admin",h);}catch{}
  isAdmin=true;
  db.doc("meta/used").onSnapshot(s=>{usedMeta=s.exists?s.data():null;if(screen==="lobby")renderAdminInfo();},()=>{});
  return "";
}

async function initSupa(){
  db=supaDb();await db.lire();
  uid=uidLocal();
  room=supaRoom(db);
  user={id:async()=>uid,canEdit:adminLocal};
  enLigne=true;
}

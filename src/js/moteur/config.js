/* ================= Réglages de partie (administrables) ================= */
// jeux : ids du CATALOGUE dans l'ordre ; temps en secondes ; pts par épreuve ;
// bonusTemps : 1 pt par tranche de bonusPas secondes restantes, proportionnel aux points gagnés ; bonusParfait : points en plus si tout est réussi au maximum.
const CFG_DEFAUT={jeux:["wordle","boggle","semantix","calcul"],temps:TOTAL,pts:Object.fromEntries(Object.entries(CATALOGUE).map(([k,g])=>[k,g.pts])),bonusTemps:true,bonusPas:10,bonusParfait:0};
const borne=(v,a,b,d)=>{v=Math.round(Number(v));return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d;};
function cfgNorm(c){
  c=c||{};const D=CFG_DEFAUT;
  let jeux=(Array.isArray(c.jeux)?c.jeux:D.jeux).filter((id,i,a)=>CATALOGUE[id]&&a.indexOf(id)===i);
  if(!jeux.length)jeux=D.jeux.slice();
  const pts={};Object.keys(CATALOGUE).forEach(k=>pts[k]=borne(c.pts?.[k],1,100,D.pts[k]));
  return {jeux,temps:borne(c.temps,30,900,D.temps),pts,bonusTemps:c.bonusTemps!==undefined?!!c.bonusTemps:D.bonusTemps,bonusPas:borne(c.bonusPas,1,120,D.bonusPas),bonusParfait:borne(c.bonusParfait,0,100,D.bonusParfait)};
}
let cfg=cfgNorm(null);          // réglages affichés au salon (admin : modifiables)
function chargerCfgSolo(){try{cfg=cfgNorm(JSON.parse(localStorage.getItem("defi:cfg")));}catch{cfg=cfgNorm(null);}}
const rc=()=>cfgNorm(round?.p?.cfg);           // réglages de la manche en cours (anciennes parties : défaut)
const jeuxDe=c=>c.jeux.map(id=>({id,...CATALOGUE[id],pts:c.pts[id]}));
const maxDe=c=>c.jeux.reduce((s,id)=>s+c.pts[id],0);
const dureeTxt=s=>s%60?fmt(s):`${s/60} minute${s>60?"s":""}`;

/* ---- Écran de réglages ---- */
function renderConfig(){
  const c=cfgNorm(cfg);
  const ordre=[...c.jeux,...Object.keys(CATALOGUE).filter(k=>!c.jeux.includes(k))];
  app.innerHTML=`${logo()}<p class="tag">Réglages de la partie</p>
  <form class="card cfg" id="cf">
    <h2>Épreuves <small>coche, ordonne, note</small></h2>
    <ul class="cfg-jeux" id="cj">${ordre.map(id=>{const g=CATALOGUE[id];return `<li data-id="${id}" style="--c:${g.c}">
      <label class="chk"><input type="checkbox" name="on" ${c.jeux.includes(id)?"checked":""}> <b>${g.name}</b></label>
      <span class="cfg-ord"><button type="button" class="key mini" data-m="-1" aria-label="Monter ${g.name}">↑</button><button type="button" class="key mini" data-m="1" aria-label="Descendre ${g.name}">↓</button></span>
      <label class="cfg-pts"><input class="input" type="number" name="pts" min="1" max="100" value="${c.pts[id]}" aria-label="Points ${g.name}"> pts</label></li>`;}).join("")}</ul>
    <h2>Temps</h2>
    <label class="cfg-row">Durée de la partie <span><input class="input" type="number" id="ct" min="30" max="900" step="10" value="${c.temps}"> s</span></label>
    <h2>Bonus</h2>
    <label class="chk cfg-row"><span><input type="checkbox" id="cb" ${c.bonusTemps?"checked":""}> Bonus temps</span></label>
    <label class="cfg-row">1 pt par tranche de <span><input class="input" type="number" id="cp" min="1" max="120" value="${c.bonusPas}"> s restantes</span></label>
    <label class="cfg-row">Bonus sans-faute <span><input class="input" type="number" id="cz" min="0" max="100" value="${c.bonusParfait}"> pts</span></label>
    <p class="msg" id="cmsg"></p>
    <div class="row"><button type="button" class="btn ghost small" id="cr">Valeurs par défaut</button><button type="button" class="btn ghost small" id="cx">Annuler</button><button class="btn small" id="cs" style="--c:var(--green)">Enregistrer</button></div>
  </form>`;
  const ul=$("#cj");
  ul.onclick=e=>{const b=e.target.closest("[data-m]");if(!b)return;const li=b.closest("li");
    if(b.dataset.m<0&&li.previousElementSibling)ul.insertBefore(li,li.previousElementSibling);
    else if(b.dataset.m>0&&li.nextElementSibling)ul.insertBefore(li.nextElementSibling,li);};
  const retour=()=>{screen=solo?"offline":"lobby";render();};
  $("#cx").onclick=retour;
  $("#cr").onclick=()=>{cfg=cfgNorm(null);renderConfig();};
  $("#cf").onsubmit=async e=>{
    e.preventDefault();
    const lis=[...ul.children];
    const n=cfgNorm({jeux:lis.filter(li=>li.querySelector("[name=on]").checked).map(li=>li.dataset.id),
      pts:Object.fromEntries(lis.map(li=>[li.dataset.id,li.querySelector("[name=pts]").value])),
      temps:$("#ct").value,bonusTemps:$("#cb").checked,bonusPas:$("#cp").value,bonusParfait:$("#cz").value});
    if(!lis.some(li=>li.querySelector("[name=on]").checked)){$("#cmsg").textContent="Choisis au moins une épreuve.";$("#cmsg").className="msg ko";return;}
    cfg=n;
    if(solo){try{localStorage.setItem("defi:cfg",JSON.stringify(n));}catch{}}
    else{try{await db.doc("config/main").set(n);}catch(err){$("#cmsg").textContent="Enregistrement impossible : "+(err.message||"erreur");$("#cmsg").className="msg ko";return;}}
    retour();
  };
}

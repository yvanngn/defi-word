/* ================= Rendu général ================= */
function logo(){return `<div class="logo" aria-hidden="true"><span>D</span><span>É</span><span>F</span><span>I</span></div>`;}
function render(){
  clearInterval(timerId); if(screen!=="play")keyHandler=null;
  if(screen==="loading"){app.innerHTML=`${logo()}<p class="tag">Connexion au salon…</p>`;return;}
  if(screen==="pseudo")return renderPseudo();
  if(screen==="lobby")return renderLobby();
  if(screen==="offline")return renderOffline();
  if(screen==="play")return renderPlay();
  if(screen==="end")return renderEnd();
  if(screen==="config")return renderConfig();
}
function renderPseudo(){
  app.innerHTML=`${logo()}<p class="tag">${dureeTxt(cfg.temps)}, ${cfg.jeux.length} épreuve${cfg.jeux.length>1?"s":""}, un seul gagnant.</p>
  <div class="card"><h2>Choisis ton pseudo</h2>
  <form class="inrow" id="pf"><input class="input" id="pi" maxlength="18" autocomplete="nickname" placeholder="Ton pseudo" value="${esc(pseudo)}" aria-label="Pseudo"><button class="btn" style="--c:var(--green)">Entrer</button></form>
  <p class="muted" id="perr" style="margin:10px 0 0">Il s’affichera dans le salon et au classement.</p></div>`;
  const inp=$("#pi");inp.focus();
  $("#pf").onsubmit=async e=>{
    e.preventDefault();const v=inp.value.trim().replace(/\s+/g," ");
    if(v.length<2){$("#perr").textContent="2 caractères minimum.";return;}
    pseudo=v;localStorage.setItem("defi:pseudo",pseudo);
    try{await db.doc("players/"+uid).set({pseudo});}catch{canWrite=false;}
    screen="lobby";render();setPresence();
  };
}
function renderOffline(){
  app.innerHTML=`${logo()}<p class="tag">Mode solo</p>
  <div class="card"><p style="margin-top:0">Le salon multijoueur n’est pas disponible dans cette vue : ouvre le jeu depuis son lien claude.ai en étant connecté. En attendant, tu peux t’entraîner seul (hors classement).</p>
  <button class="btn big" id="solo" style="--c:var(--green)">Jouer en solo</button></div>
  <div class="card"><h2>Au programme <small>${maxDe(cfg)} pts max, ${dureeTxt(cfg.temps)}</small></h2>${stepsHtml()}<button class="btn ghost small" id="reglages" style="margin-top:10px">⚙ Réglages</button></div>`;
  $("#reglages").onclick=()=>{screen="config";render();};
  $("#solo").onclick=()=>{const {puzzle}=generatePuzzles(null);beginRound({id:"solo-"+Date.now(),number:0,startedAt:Date.now(),...puzzle,cfg});};
}
function stepsHtml(){
  const c=cfgNorm(cfg),bt=c.bonusTemps?`<li><span class="num" style="--c:var(--ink);color:var(--bg)">⏱</span><span><b>Bonus temps</b><small>Finis en avance : 1 pt par tranche de ${c.bonusPas} s restantes, proportionnel à tes points.</small></span><span class="pts">bonus</span></li>`:"";
  const bp=c.bonusParfait?`<li><span class="num" style="--c:var(--ink);color:var(--bg)">★</span><span><b>Bonus sans-faute</b><small>Toutes les épreuves réussies au maximum.</small></span><span class="pts">+${c.bonusParfait} pts</span></li>`:"";
  return `<ol class="steps">${jeuxDe(c).map((g,i)=>`<li><span class="num ${g.sun?"sun":""}" style="--c:${g.c}">${i+1}</span><span><b>${g.name}</b><small>${g.rule}</small></span><span class="pts">${g.pts} pts</span></li>`).join("")}${bt}${bp}</ol>`;
}

/* ================= Salon ================= */
function renderLobby(){
  app.innerHTML=`${logo()}<p class="tag">Salut ${esc(pseudo)} ! <button class="link" id="chg">Changer de pseudo</button></p>
  <div class="card" id="running" hidden></div>
  <div class="card"><h2>Salon <small id="pcount"></small></h2><ul class="people" id="people"></ul>
    <div class="lobby-actions" id="actions"></div></div>
  <div class="card"><h2>Au programme <small>${maxDe(cfg)} pts max, ${dureeTxt(cfg.temps)}</small></h2>${stepsHtml()}${isAdmin?`<button class="btn ghost small" id="reglages" style="margin-top:10px">⚙ Réglages de la partie</button>`:""}</div>
  <div class="card"><div class="tabs" role="tablist">
    <button class="tab" role="tab" data-t="records" aria-selected="${tab==="records"}">Records</button>
    <button class="tab" role="tab" data-t="history" aria-selected="${tab==="history"}">Dernières parties</button></div>
    <div id="tabbody"></div></div>
  <p class="muted center" id="admininfo"></p>
  ${enLigne&&!isAdmin?`<form class="center adm" id="adm"><button type="button" class="link" id="admo">Je suis l’admin</button><span id="admz" hidden><input class="input" type="password" id="admp" placeholder="Mot de passe admin" autocomplete="current-password"> <button class="btn small">Valider</button> <span class="msg ko" id="admm"></span></span></form>`:""}`;
  if($("#adm")){$("#admo").onclick=()=>{$("#admo").hidden=true;$("#admz").hidden=false;$("#admp").focus();};
    $("#adm").onsubmit=async e=>{e.preventDefault();const m=await devenirAdmin($("#admp").value).catch(()=>"Connexion impossible.");if(m)$("#admm").textContent=m;else render();};}
  $("#chg").onclick=()=>{screen="pseudo";render();};
  if($("#reglages"))$("#reglages").onclick=()=>{screen="config";render();};
  app.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{tab=b.dataset.t;app.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===b));renderTabs();});
  renderPeople();renderActions();renderRunning();renderTabs();renderAdminInfo();
}
function lobbyPeople(){
  const map=new Map();
  peers.filter(p=>p.kind==="viewer"&&p.presence&&p.presence.pseudo).forEach(p=>{const k=p.by||p.peer;map.set(k,{id:k,pseudo:String(p.presence.pseudo).slice(0,18),ready:!!p.presence.ready,state:p.presence.state,me:p.isMe});});
  if(!room&&pseudo)map.set(uid,{id:uid,pseudo,ready,me:true});
  return [...map.values()].sort((a,b)=>(b.me-a.me)||a.pseudo.localeCompare(b.pseudo));
}
function renderPeople(){
  const el=$("#people");if(!el)return;
  const list=lobbyPeople();
  el.innerHTML=list.map(p=>`<li class="person ${p.ready?"ready":""} ${p.me?"me":""}">${avatar(p.id,p.pseudo)}${esc(p.pseudo)}<small>${p.state==="play"?"en jeu":p.ready?"prêt":"…"}</small></li>`).join("")||`<li class="empty">Personne pour l’instant.</li>`;
  const r=list.filter(p=>p.ready).length;
  $("#pcount").textContent=`${r} prêt${r>1?"s":""} sur ${list.length}`;
  renderActions();
}
function renderActions(){
  const el=$("#actions");if(!el)return;
  const running=game&&game.status==="running";
  const list=lobbyPeople();const nReady=list.filter(p=>p.ready).length;
  let h=`<button class="btn ${ready?"ghost":""}" id="rdy" style="--c:var(--green)">${ready?"Je ne suis plus prêt":"Je suis prêt"}</button>`;
  if(isAdmin)h+=`<button class="btn big" id="launch" style="--c:var(--pink)" ${running||launching?"disabled":""}>${launching?"Lancement…":running?"Partie en cours":`Lancer la partie (${nReady}/${list.length} prêts)`}</button>`;
  else h+=`<div class="wait">${running?"Partie en cours : tu joueras la prochaine.":"L’admin lance la partie quand tout le monde est prêt."}</div>`;
  if(!canWrite)h+=`<p class="muted center" style="margin:0">Ton accès est en lecture seule : demande à l’admin le droit d’interagir pour apparaître au classement.</p>`;
  if(!room)h+=`<p class="muted center" style="margin:0">La liste des présents n’est pas disponible ici, mais tu recevras quand même le lancement.</p>`;
  el.innerHTML=h;
  $("#rdy").onclick=()=>{ready=!ready;setPresence();if(!room)renderPeople();else renderActions();};
  if($("#launch"))$("#launch").onclick=launch;
}
function renderRunning(){
  const el=$("#running");if(!el)return;
  if(!(game&&game.status==="running")){el.hidden=true;return;}
  el.hidden=false;
  const rows=liveRows.slice().sort(rankSort);
  el.innerHTML=`<h2>Partie n°${game.number} en direct <small>${rows.filter(r=>r.done).length}/${rows.length} terminé${rows.length>1?"s":""}</small></h2>${standingsHtml(rows,false)}`;
}
function standingsHtml(rows,final){
  if(!rows.length)return `<p class="empty">Aucun joueur pour l’instant.</p>`;
  let rank=0;const nbJ=cfgNorm(game?.cfg).jeux.length;
  return `<ol class="rank-list">${rows.map(r=>{if(r.done||final)rank++;const fin=r.done||final;
    return `<li class="${r.uid===uid?"me":""}"><span class="rk">${fin?(rank===1?"🏆":rank):"…"}</span>${avatar(r.uid,r.pseudo)}
    <span class="nm">${esc(r.pseudo||"Joueur")}${r.uid===uid?" (toi)":""}<small>${fin?`en ${fmt(r.time)}${r.bonus?`, bonus +${r.bonus}`:""}`:`épreuve ${Math.min((r.step||0)+1,nbJ)} sur ${nbJ}`}</small></span>
    <span class="sc">${r.total||0}</span></li>`;}).join("")}</ol>`;
}
function renderTabs(){
  const el=$("#tabbody");if(!el)return;
  if(tab==="records"){
    const P=stats?.players?Object.entries(stats.players).map(([id,p])=>({id,...p})):[];
    if(!P.length){el.innerHTML=`<p class="empty">Aucune partie terminée pour l’instant. Les records s’afficheront ici.</p>`;return;}
    P.sort((a,b)=>b.wins-a.wins||(b.points/b.games)-(a.points/a.games));
    const b=stats.best;
    el.innerHTML=`${b?`<div class="record"><span class="big">${b.total}</span><span><b>Record absolu</b><br>${esc(b.pseudo)}, en ${fmt(b.time)} (partie n°${b.number})</span></div>`:""}
    <p class="muted" style="margin:0 0 8px">${stats.games} partie${stats.games>1?"s":""} jouée${stats.games>1?"s":""}</p>
    <ol class="rank-list">${P.slice(0,20).map((p,i)=>`<li class="${p.id===uid?"me":""}"><span class="rk">${i+1}</span>${avatar(p.id,p.pseudo)}
      <span class="nm">${esc(p.pseudo)}<small>${p.games} partie${p.games>1?"s":""}, moyenne ${Math.round(p.points/p.games)} pts, meilleur ${p.best}</small></span>
      <span class="sc">${p.wins}<small>victoire${p.wins>1?"s":""}</small></span></li>`).join("")}</ol>`;
  }else{
    if(!history.length){el.innerHTML=`<p class="empty">L’historique des parties apparaîtra ici.</p>`;return;}
    el.innerHTML=`<ul class="history">${history.map(g=>{const s=g.standings||[];
      return `<li><b>Partie n°${g.number}</b> <span class="muted">${dateFr(g.endedAt)}, ${s.length} joueur${s.length>1?"s":""}</span>
      <span class="podium">${s.slice(0,3).map((r,i)=>`${["🥇","🥈","🥉"][i]} ${esc(r.pseudo)} ${r.total}`).join("&nbsp;&nbsp; ")||"Personne n’a joué"}</span>
      <span class="podium muted">Réponses : ${esc(Object.values(g.answers||{}).filter(Boolean).map(x=>String(x).toUpperCase()).join(", "))}</span></li>`;}).join("")}</ul>`;
  }
}
function renderAdminInfo(){
  const el=$("#admininfo");if(!el||!isAdmin)return;
  const u=usedMeta||{wordle:[],boggle:[],semantix:[]};
  const left=Math.min(WORDLE.filter(w=>w.length<=6).length-(u.wordle||[]).length,BOGGLE_POOL.length-(u.boggle||[]).length,SEM_POOL.length-(u.semantix||[]).length,PENDU_POOL.length-(u.pendu||[]).length);
  el.textContent=`Tu es admin. Encore ${left} parties avant qu’un mot déjà joué puisse revenir (calculs et grilles toujours inédits).`;
}


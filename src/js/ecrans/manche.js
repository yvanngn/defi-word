/* ================= Une manche ================= */
function beginRound(g){
  round={id:g.id,p:g,st:{start:Date.now(),step:0,scores:cfgNorm(g.cfg).jeux.map(()=>0),done:false,time:0}};
  ready=false;saveRound();startPlay();pushLive();
}
function startPlay(){screen="play";setPresence();render();startTimer();}
function remaining(){return rc().temps-(Date.now()-round.st.start)/1000;}
function startTimer(){
  clearInterval(timerId);
  const tick=()=>{
    const r=remaining();const c=$("#clock"),b=$("#bar");
    if(c){c.textContent=fmt(Math.ceil(Math.max(0,r)));c.classList.toggle("hurry",r<=20);}
    if(b){b.style.width=Math.max(0,r/rc().temps*100)+"%";b.style.background=r<=20?"var(--pink)":r<=60?"var(--sun)":"var(--green)";}
    if(r<=0)finishRound();
  };
  tick();timerId=setInterval(tick,250);
}
function renderPlay(){
  if(remaining()<=0){finishRound();return;}
  app.innerHTML=`<div class="hud"><div class="hud-top"><span class="clock" id="clock">3:00</span><span class="score" id="score">${total()} pts</span></div>
  <div class="bar"><i id="bar"></i></div><div class="track" id="track"></div></div><section id="stage"></section>`;
  renderStep();
}
function renderStep(){
  const s=round.st;
  const J=jeuxDe(rc());
  $("#track").innerHTML=J.map((g,i)=>`<span class="chip ${i===s.step?"now":""} ${i<s.step?"done":""} ${g.sun?"sun":""}" style="--c:${g.c}">${i<s.step?"✓ ":""}${g.name}</span>`).join("");
  const g=J[s.step];
  $("#stage").innerHTML=`<div class="stage-head"><h2>${g.name}</h2><span class="pts">${g.pts} pts</span></div><div id="game"></div><button class="link skip" id="skip">Passer cette épreuve (0 pt)</button>`;
  $("#skip").onclick=()=>advance(0);
  g.mount($("#game"),round.p,g.pts);
}
let advancing=false;
function advance(points){
  if(!round||round.st.done||advancing)return;
  const s=round.st;s.scores[s.step]=points;s.step++;saveRound();
  if(points>0)floatPts(points);
  if(s.step>=rc().jeux.length){finishRound();return;}
  pushLive();renderStep();
}
function later(fn,ms){advancing=true;setTimeout(()=>{advancing=false;if(round&&!round.st.done)fn();},ms);}
function floatPts(p){const s=$("#score");if(!s)return;s.textContent=total()+" pts";const f=document.createElement("span");f.className="float";f.textContent="+"+p;s.appendChild(f);setTimeout(()=>f.remove(),1100);}
function finishRound(){
  if(!round)return;
  clearInterval(timerId);keyHandler=null;
  if(!round.st.done){round.st.done=true;round.st.time=Math.min(rc().temps,(Date.now()-round.st.start)/1000);const b=bonusDe(round.st,rc());round.st.bonusT=b.temps;round.st.bonusP=b.parfait;round.st.bonus=b.temps+b.parfait;saveRound();pushLive();}
  screen="end";setPresence();render();
}
function renderEnd(){
  const t=total(),p=round.p,bonus=round.st.bonus||0,base=t-bonus;
  const c=rc(),J=jeuxDe(c),MAX=maxDe(c);
  const cheer=base>=MAX?"Sans faute, chapeau !":base>=MAX*.7?"Énorme performance !":base>=MAX*.45?"Belle partie !":base>0?"Pas mal, revanche à la prochaine ?":"Le chrono a gagné cette fois.";
  app.innerHTML=`${logo()}
  <div class="card"><div class="final"><div class="big">${t}<small> pts</small></div><p>${cheer}</p></div>
  <ul class="recap">${J.map((g,i)=>`<li style="--c:${g.c}"><span class="stripe"></span><span><b>${g.name}</b><small>${g.id==="calcul"?"Réponses":"Réponse"} : ${esc(g.sol(p))}</small></span><span class="sc">${round.st.scores[i]}/${g.pts}</span></li>`).join("")}
  ${c.bonusTemps?`<li style="--c:var(--ink)"><span class="stripe"></span><span><b>Bonus temps</b><small>${fmt(Math.max(0,c.temps-round.st.time))} restantes</small></span><span class="sc">+${round.st.bonusT??bonus}</span></li>`:""}
  ${c.bonusParfait?`<li style="--c:var(--ink)"><span class="stripe"></span><span><b>Bonus sans-faute</b><small>toutes les épreuves au maximum</small></span><span class="sc">+${round.st.bonusP||0}</span></li>`:""}</ul></div>
  ${solo?"":`<div class="card" id="standings"></div>`}
  <button class="btn big" id="back" style="--c:var(--blue)">${solo?"Retour":"Retour au salon"}</button>`;
  $("#back").onclick=()=>{round=null;screen=solo?"offline":"lobby";setPresence();render();};
  renderStandings();
}
function renderStandings(){
  const el=$("#standings");if(!el||!round)return;
  const fin=game&&game.id===round.id&&game.status==="finished";
  const rows=liveRows.slice().sort(rankSort);
  el.innerHTML=`<h2>Partie n°${round.p.number} <small>${fin?"classement final":"en attente des autres…"}</small></h2>${standingsHtml(rows,fin)}`;
}


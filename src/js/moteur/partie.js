/* ================= Partie partagée ================= */
function onGame(g){
  const prevId=game?.id;
  game=g;
  if(g&&g.id!==liveFor)watchLive(g.id);
  if(g&&g.status==="running"){
    const rec=loadRound(g.id);
    if(rec&&!round){round={id:g.id,p:g,st:rec};if(rec.done){screen="end";render();}else{startPlay();}}
    else if(!rec&&!firstGameSnap&&g.id!==prevId&&pseudo&&screen==="lobby"){beginRound(g);}
    else if(screen==="lobby")render();
  }else if(screen==="lobby"||screen==="end")render();
  firstGameSnap=false;
  if(isAdmin)armAdminTick();
}
function watchLive(gid){
  if(liveUnsub)liveUnsub();
  liveFor=gid;liveRows=[];
  liveUnsub=db.collection("live").where("gameId","==",gid).onSnapshot(s=>{
    liveRows=s.docs.map(d=>({uid:d.id,...d.data()}));
    if(screen==="end")renderStandings();
    if(screen==="lobby")renderRunning();
    if(isAdmin)checkFinish();
  },()=>{});
}
function pushLive(){
  if(!db||!uid||!round||solo)return;
  const s=round.st;
  const data={gameId:round.id,pseudo,total:total(),bonus:s.bonus||0,scores:s.scores,step:s.step,done:!!s.done,time:Math.round(s.time||0)};
  writeChain=writeChain.then(()=>db.doc("live/"+uid).set(data)).catch(()=>{canWrite=false;});
}
let writeChain=Promise.resolve();

/* ---- Admin : lancement et clôture ---- */
async function launch(){
  if(launching)return;launching=true;render();
  try{
    let used=null;try{const u=await db.doc("meta/used").get();used=u.exists?u.data():null;}catch{}
    const {puzzle,used:nu}=generatePuzzles(used);
    const number=(nu.count||0)+1;
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    await db.doc("meta/used").set({wordle:nu.wordle,boggle:nu.boggle,semantix:nu.semantix,count:number});
    await db.doc("game/current").set({id,number,status:"running",startedAt:Date.now(),...puzzle});
  }catch(e){alert("Impossible de lancer la partie : "+(e.message||e.code||"erreur"));}
  launching=false;
}
function armAdminTick(){
  clearInterval(adminTick);
  if(game&&game.status==="running")adminTick=setInterval(checkFinish,1000);
}
function checkFinish(){
  if(!isAdmin||!game||game.status!=="running"||finalizing)return;
  const age=(Date.now()-game.startedAt)/1000;
  const allDone=age>6&&liveRows.length>0&&liveRows.every(r=>r.done);
  if(allDone||age>TOTAL+GRACE)finalize(game);
}
async function finalize(g){
  finalizing=true;
  try{
    const snap=await db.collection("live").where("gameId","==",g.id).get();
    const rows=snap.docs.map(d=>({uid:d.id,...d.data()})).sort(rankSort);
    const standings=rows.map(r=>({uid:r.uid,pseudo:r.pseudo||"Joueur",total:r.total||0,bonus:r.bonus||0,time:r.time||TOTAL,scores:r.scores||[0,0,0,0]}));
    const endedAt=Date.now();
    await db.doc("games/"+g.id).set({id:g.id,number:g.number,startedAt:g.startedAt,endedAt,standings,answers:{wordle:g.wordle,boggle:g.boggle,sem:g.sem}});
    let st=null;try{const s=await db.doc("stats/main").get();st=s.exists?s.data():null;}catch{}
    st=st||{games:0,players:{},best:null};
    st.players=st.players||{};
    st.games=(st.games||0)+1;
    standings.forEach((r,i)=>{
      const p=st.players[r.uid]||{games:0,wins:0,podiums:0,points:0,best:0,bestTime:null};
      p.pseudo=r.pseudo;p.games++;p.points+=r.total;
      if(i===0&&r.total>0)p.wins++;
      if(i<3&&r.total>0)p.podiums++;
      if(r.total>p.best||(r.total===p.best&&(p.bestTime==null||r.time<p.bestTime))){p.best=r.total;p.bestTime=r.time;}
      st.players[r.uid]=p;
      if(!st.best||r.total>st.best.total||(r.total===st.best.total&&r.time<st.best.time))st.best={uid:r.uid,pseudo:r.pseudo,total:r.total,time:r.time,number:g.number,at:endedAt};
    });
    await db.doc("stats/main").set(st);
    await db.doc("game/current").update({status:"finished",endedAt});
  }catch(e){console.error(e);}
  finalizing=false;
}


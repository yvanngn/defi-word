/* ================= Connexion aux capacités ================= */
async function init(){
  render();
  const claude=!!(window.claude&&window.claude.use);
  if(!claude&&!supaOn()){offline();return;}
  const guard=setTimeout(()=>{if(!db)offline();},10000);
  try{
    if(claude)[db,user,room]=await Promise.all([window.claude.use("db"),window.claude.use("user"),window.claude.use("room")]);
    else await initSupa();
    clearTimeout(guard);
    if(!db||!user){offline();return;}
    uid=await user.id();
    isAdmin=!!(await user.canEdit());
    if(!uid){offline();return;}
    try{const p=await db.doc("players/"+uid).get();if(p.exists&&p.data().pseudo){pseudo=p.data().pseudo;localStorage.setItem("defi:pseudo",pseudo);}}catch{}
    screen=pseudo?"lobby":"pseudo";
    render();
    if(room){
      room.onPeers(ch=>{peers=ch.peers;if(screen==="lobby")renderPeople();});
      setPresence();
    }
    db.doc("config/main").onSnapshot(s=>{if(screen!=="config"){cfg=cfgNorm(s.exists?s.data():null);if(screen==="lobby"||screen==="pseudo")render();}},()=>{});
    db.doc("game/current").onSnapshot(s=>onGame(s.exists?s.data():null),()=>{});
    db.doc("stats/main").onSnapshot(s=>{stats=s.exists?s.data():null;if(screen==="lobby")renderTabs();},()=>{});
    db.collection("games").orderBy("endedAt","desc").limit(15).onSnapshot(s=>{history=s.docs.map(d=>d.data());if(screen==="lobby")renderTabs();},()=>{});
    if(isAdmin)db.doc("meta/used").onSnapshot(s=>{usedMeta=s.exists?s.data():null;if(screen==="lobby")renderAdminInfo();},()=>{});
  }catch{clearTimeout(guard);offline();}
}
function offline(){db=null;solo=true;chargerCfgSolo();screen="offline";render();}
function setPresence(){if(room&&pseudo)room.presence({pseudo,ready,state:screen==="play"?"play":"lobby"}).catch(()=>{});}


/* ================= État ================= */
let db=null,user=null,room=null,uid=null,isAdmin=false,canWrite=true,enLigne=false;
let pseudo=localStorage.getItem("defi:pseudo")||"";
let ready=false, screen="loading";
let game=null, firstGameSnap=true, peers=[], liveRows=[], liveFor=null, liveUnsub=null;
let stats=null, history=[], usedMeta=null, tab="records";
let round=null;                 // partie en cours de ce joueur
let timerId=null, keyHandler=null, adminTick=null, finalizing=false, launching=false;
let solo=false;

const recKey=id=>"defi:round:"+id;
function saveRound(){if(round)try{localStorage.setItem(recKey(round.id),JSON.stringify(round.st));}catch{}}
function loadRound(id){try{return JSON.parse(localStorage.getItem(recKey(id)));}catch{return null;}}
const total=()=>round?round.st.scores.reduce((a,b)=>a+b,0)+(round.st.bonus||0):0;
// Bonus : temps (1 pt par tranche de bonusPas s restantes, proportionnel aux points gagnés) + sans-faute (toutes les épreuves au maximum)
function bonusDe(st,c){
  const base=st.scores.reduce((a,b)=>a+b,0),max=maxDe(c),rem=Math.max(0,c.temps-(st.time||c.temps));
  const temps=c.bonusTemps&&max?Math.round(rem/c.bonusPas*base/max):0;
  const parfait=c.jeux.every((id,i)=>st.scores[i]>=c.pts[id])?c.bonusParfait:0;
  return {temps,parfait};
}

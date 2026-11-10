/* ================= 5. Pendu ================= */
const PENDU_ERR=7;
// Points : tout si aucune erreur, puis chaque erreur retire 1/14 des points (au moins la moitié si trouvé)
const penduPts=(pts,err)=>Math.max(1,Math.round(pts*(1-err/(PENDU_ERR*2))));
function mountPendu(el,P,PTS){
  const T=P.pendu.toUpperCase(),KB=["AZERTYUIOP","QSDFGHJKLM","WXCVBN"];
  const th=THEMES[LEX.get(P.pendu)?.t]?.key||"";
  let err=0,locked=false;const tried=new Set();
  el.innerHTML=`<p class="hint">Thème : <b>${esc(LABEL[th]||th)}</b>. ${T.length} lettres, ${PENDU_ERR} erreurs permises.</p>
  <svg class="gibet" viewBox="0 0 120 110" aria-hidden="true"><g id="pg"></g></svg>
  <div class="pmot" id="pm"></div><div class="msg" id="pmsg"></div>
  <div class="kb">${KB.map(r=>`<div class="kbrow">${[...r].map(k=>`<button class="key" data-k="${k}">${k}</button>`).join("")}</div>`).join("")}</div>`;
  const parts=['<line x1="10" y1="104" x2="70" y2="104"/>','<line x1="25" y1="104" x2="25" y2="8"/><line x1="25" y1="8" x2="80" y2="8"/>','<line x1="80" y1="8" x2="80" y2="22"/>',
    '<circle cx="80" cy="32" r="10"/>','<line x1="80" y1="42" x2="80" y2="72"/>','<line x1="80" y1="50" x2="66" y2="62"/><line x1="80" y1="50" x2="94" y2="62"/>','<line x1="80" y1="72" x2="68" y2="92"/><line x1="80" y1="72" x2="92" y2="92"/>'];
  const msg=(t,c="")=>{const m=$("#pmsg");m.textContent=t;m.className="msg "+c;};
  const draw=()=>{
    $("#pg").innerHTML=parts.slice(0,err).join("");
    $("#pm").innerHTML=[...T].map(ch=>`<span class="pl ${tried.has(ch)?"on":""}">${tried.has(ch)||locked?ch:""}</span>`).join("");
  };
  const press=k=>{
    if(locked||tried.has(k)||!/^[A-Z]$/.test(k))return;
    tried.add(k);const b=el.querySelector(`.key[data-k="${k}"]`);
    if(T.includes(k)){b?.classList.add("correct");}else{err++;b?.classList.add("absent");}
    if([...T].every(ch=>tried.has(ch))){const p=penduPts(PTS,err);locked=true;draw();msg(`Bravo ! +${p}`,"ok");later(()=>advance(p),1100);return;}
    if(err>=PENDU_ERR){locked=true;draw();msg(`Pendu ! C’était ${T}`,"ko");later(()=>advance(0),1600);return;}
    draw();msg(err?`${PENDU_ERR-err} erreur${PENDU_ERR-err>1?"s":""} restante${PENDU_ERR-err>1?"s":""}`:"");
  };
  el.querySelectorAll(".key").forEach(b=>b.onclick=()=>press(b.dataset.k));
  keyHandler=e=>{const k=e.key.normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase();if(k.length===1)press(k);};
  draw();
}

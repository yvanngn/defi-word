/* ================= 4. Calcul mental ================= */
function mountCalcul(el,P,PTS){
  const Q=P.quiz;let i=0,pts=0,locked=false;const res=[];
  el.innerHTML=`<div class="qcount" id="qc"></div><div class="qbig" id="qq"></div>
  <form class="inrow qform" id="qf"><input class="input" id="qa" inputmode="numeric" autocomplete="off" aria-label="Ta réponse" placeholder="?"><button class="btn small sun" style="--c:var(--sun)">Valider</button></form>
  <div class="msg" id="qmsg"></div><div class="dots" id="qd"></div>`;
  const draw=()=>{const k=Math.min(i,Q.length-1);$("#qc").textContent=`Calcul ${k+1} sur ${Q.length}`;$("#qq").textContent=Q[k].q+" = ?";$("#qd").innerHTML=Q.map((_,j)=>`<i class="${res[j]===true?"ok":res[j]===false?"ko":j===i?"cur":""}"></i>`).join("");};
  $("#qf").onsubmit=e=>{
    e.preventDefault();if(locked)return;
    const inp=$("#qa");const v=inp.value.trim().replace(",",".");if(v==="")return;
    const ok=Number(v)===Q[i].a;res[i]=ok;if(ok)pts++;
    const m=$("#qmsg");m.textContent=ok?"Juste !":`Raté, c’était ${Q[i].a}`;m.className="msg "+(ok?"ok":"ko");
    inp.value="";i++;draw();
    if(i>=Q.length){locked=true;later(()=>advance(Math.round(PTS*pts/Q.length)),900);}else inp.focus();
  };
  keyHandler=null;draw();setTimeout(()=>$("#qa")?.focus(),50);
}


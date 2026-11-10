/* ================= 1. Wordle ================= */
function mountWordle(el,P){
  const T=P.wordle,N=T.length,KB=["AZERTYUIOP","QSDFGHJKLM","↵WXCVBN⌫"];
  let row=0,cur="",locked=false;const keys={};
  const size=`min(${N<=5?"15vw":`calc((100vw - 40px) / ${N} - 6px)`},${N<=5?58:N<=7?50:42}px)`;
  el.innerHTML=`<p class="hint">Un mot de ${N} lettres. Vert : bonne place. Jaune : mauvaise place. Seuls les mots du dictionnaire sont acceptés.</p>
  <div class="wgrid">${Array.from({length:6},()=>`<div class="wrow" style="grid-template-columns:repeat(${N},${size})">${'<div class="tile"></div>'.repeat(N)}</div>`).join("")}</div>
  <div class="msg" id="wmsg"></div>
  <div class="kb">${KB.map(r=>`<div class="kbrow">${[...r].map(k=>`<button class="key ${k==="↵"||k==="⌫"?"wide":""}" data-k="${k}" aria-label="${k==="↵"?"Valider":k==="⌫"?"Effacer":k}">${k==="↵"?"Valider":k}</button>`).join("")}</div>`).join("")}</div>`;
  if(N>7)el.querySelectorAll(".tile").forEach(t=>t.style.fontSize=N>8?"1.15rem":"1.4rem");
  const rows=[...el.querySelectorAll(".wrow")];
  const msg=(t,c="")=>{const m=$("#wmsg");m.textContent=t;m.className="msg "+c;};
  const shake=()=>{rows[row].classList.remove("shake");void rows[row].offsetWidth;rows[row].classList.add("shake");};
  const draw=()=>[...rows[row].children].forEach((t,i)=>{t.textContent=cur[i]||"";t.classList.toggle("filled",!!cur[i]);});
  const submit=()=>{
    if(cur.length<N){msg(`Il faut ${N} lettres`,"ko");shake();return;}
    if(DICT&&!DICT.has(cur.toLowerCase())){msg("Ce mot n’est pas dans le dictionnaire","ko");shake();return;}
    const res=evaluate(cur,T);
    [...rows[row].children].forEach((t,i)=>setTimeout(()=>t.classList.add(res[i]),i*70));
    const rank={absent:1,present:2,correct:3};
    [...cur].forEach((ch,i)=>{if(!keys[ch]||rank[res[i]]>rank[keys[ch]])keys[ch]=res[i];});
    setTimeout(()=>el.querySelectorAll(".key").forEach(b=>{const s=keys[b.dataset.k];b.classList.remove("correct","present","absent");if(s)b.classList.add(s);}),N*70+100);
    if(cur===T){locked=true;msg("Bravo ! +15","ok");later(()=>advance(15),1100);return;}
    row++;cur="";msg("");
    if(row===6){locked=true;msg(`C’était ${T}`,"ko");later(()=>advance(0),1600);}
  };
  const press=k=>{if(locked)return;if(k==="⌫"){cur=cur.slice(0,-1);draw();}else if(k==="↵")submit();else if(/^[A-Z]$/.test(k)&&cur.length<N){cur+=k;draw();}};
  el.querySelectorAll(".key").forEach(b=>b.onclick=()=>press(b.dataset.k));
  keyHandler=e=>{if(e.key==="Enter")press("↵");else if(e.key==="Backspace")press("⌫");else{const k=e.key.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();if(/^[A-Z]$/.test(k))press(k);}};
}
function evaluate(g,t){
  const n=t.length,res=Array(n).fill("absent"),cnt={};
  for(let i=0;i<n;i++){if(g[i]===t[i])res[i]="correct";else cnt[t[i]]=(cnt[t[i]]||0)+1;}
  for(let i=0;i<n;i++){if(res[i]!=="correct"&&cnt[g[i]]>0){res[i]="present";cnt[g[i]]--;}}
  return res;
}


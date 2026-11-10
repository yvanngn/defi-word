/* ================= 2. Boggle ================= */
function mountBoggle(el,P,PTS){
  const T=P.boggle,G=[...P.grid];
  let sel=[],dragging=false,moved=false,locked=false,fails=0;
  // Case de départ d'un chemin valide pour le mot (sert à l'unique indice)
  const startCell=()=>{const L=[...T];const dfs=(i,c,used)=>{if(G[c]!==L[i])return false;if(i===L.length-1)return true;used.add(c);for(let n=0;n<16;n++)if(!used.has(n)&&adj(c,n)&&dfs(i+1,n,used))return true;used.delete(c);return false;};for(let c=0;c<16;c++)if(dfs(0,c,new Set()))return c;return -1;};
  el.innerHTML=`<p class="hint">Un mot de ${T.length} lettres est caché. Glisse le doigt ou touche les lettres une à une (diagonales permises).</p>
  <div class="bword" id="bw"></div>
  <div class="bgrid" id="bg">${G.map((l,i)=>`<button class="cell" data-i="${i}">${l}</button>`).join("")}</div>
  <div class="msg" id="bmsg"></div>
  <div class="row"><button class="btn ghost small" id="bclear">Effacer</button><button class="btn small" id="bok" style="--c:var(--blue)">Valider</button></div>`;
  const cells=[...el.querySelectorAll(".cell")];
  const msg=(t,c="")=>{const m=$("#bmsg");m.textContent=t;m.className="msg "+c;};
  const draw=()=>{
    cells.forEach((c,i)=>c.classList.toggle("on",sel.includes(i)));
    $("#bw").innerHTML=Array.from({length:Math.max(T.length,sel.length)},(_,i)=>`<span class="slot ${sel[i]!==undefined?"on":""}">${sel[i]!==undefined?G[sel[i]]:""}</span>`).join("");
  };
  const tryAdd=i=>{
    if(locked)return false;const last=sel[sel.length-1];
    if(!sel.length)sel.push(i);
    else if(sel.length>1&&sel[sel.length-2]===i)sel.pop();
    else if(!sel.includes(i)&&adj(last,i))sel.push(i);
    else return false;
    draw();return true;
  };
  const check=()=>{
    if(locked||!sel.length)return;
    const w=sel.map(i=>G[i]).join("");
    if(w===T){locked=true;sel.forEach(i=>cells[i].classList.add("win"));msg("Trouvé ! +"+PTS,"ok");later(()=>advance(PTS),1100);}
    else{
      if(w.length===T.length)fails++;
      if(fails===2){const c=startCell();if(c>=0)cells[c].classList.add("hint");msg("Indice : le mot commence par la lettre entourée");}
      else msg(w.length<T.length?`Il faut ${T.length} lettres`:"Pas le bon mot, essaie encore","ko");const g=$("#bg");g.classList.remove("shake");void g.offsetWidth;g.classList.add("shake");setTimeout(()=>{if(!locked&&el.isConnected&&$("#bw")){sel=[];draw();}},350);}
  };
  const grid=$("#bg");
  grid.addEventListener("pointerdown",e=>{
    const c=e.target.closest(".cell");if(!c||locked)return;e.preventDefault();
    const i=+c.dataset.i;
    if(sel[sel.length-1]===i){sel.pop();draw();}else if(!tryAdd(i)){sel=[i];draw();}
    dragging=true;moved=false;msg("");
  });
  grid.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const c=document.elementFromPoint(e.clientX,e.clientY)?.closest?.(".cell");
    if(c){const i=+c.dataset.i;if(i!==sel[sel.length-1]&&tryAdd(i))moved=true;}
  });
  const up=()=>{if(dragging){dragging=false;if(moved&&sel.length>=2)check();}};
  window.onpointerup=up;window.onpointercancel=up;
  $("#bclear").onclick=()=>{sel=[];draw();msg("");};
  $("#bok").onclick=check;
  keyHandler=e=>{if(e.key==="Enter")check();else if(e.key==="Backspace"){sel.pop();draw();}};
  draw();
}


/* ================= 3. Sémantix simplifié ================= */
function mountSemantix(el,P,PTS){
  const secret=P.sem;
  const guesses=(P.hints||[]).map(w=>({w,t:temperature(secret,w),hint:true}));
  let last=null,locked=false;
  el.innerHTML=`<p class="hint">Propose des mots : plus il fait chaud, plus tu es proche. Deux indices sont offerts.</p>
  <div class="secret" aria-label="Mot secret de ${secret.length} lettres">${"<span></span>".repeat(secret.length)}</div>
  <form class="inrow" id="sf"><input class="input sinput" id="si" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Ton mot…" aria-label="Ton mot"><button class="btn small" style="--c:var(--pink)">Essayer</button></form>
  <div class="msg" id="smsg"></div><ul class="glist" id="gl"></ul>`;
  const msg=(t,c="")=>{const m=$("#smsg");m.textContent=t;m.className="msg "+c;};
  const color=t=>t>=100?"var(--green)":t>=75?"var(--pink)":t>=50?"var(--sun)":t>=28?"#FFD36B":"var(--cold)";
  const emo=t=>t>=100?"🎉":t>=75?"🔥":t>=50?"😎":t>=28?"🙂":"🥶";
  const draw=()=>{$("#gl").innerHTML=guesses.slice().sort((a,b)=>b.t-a.t).map(g=>`<li class="${g.w===last?"last":""}"><span class="w">${esc(LABEL[g.w]||g.w)}${g.hint?"<small>indice</small>":""}</span><span class="therm"><i style="width:${g.t}%;background:${color(g.t)}"></i></span><span class="deg">${g.t}°C</span><span>${emo(g.t)}</span></li>`).join("");};
  $("#sf").onsubmit=e=>{
    e.preventDefault();if(locked)return;
    const inp=$("#si");const g=norm(inp.value);inp.value="";
    if(g.length<2){msg("Tape un mot","ko");return;}
    if(guesses.some(x=>x.w===g)){last=g;draw();msg("Déjà proposé");return;}
    if(g!==secret&&DICT&&!DICT.has(g)&&!LEX.has(g)&&!HEAD.has(g)){msg("Ce mot n’est pas dans le dictionnaire","ko");return;}
    if(g===secret||g===secret+"s"||g===secret+"x"){guesses.push({w:secret,t:100});last=secret;draw();locked=true;msg(`C’est « ${secret} » ! +${PTS}`,"ok");later(()=>advance(PTS),1300);return;}
    const t=temperature(secret,g);guesses.push({w:g,t});last=g;draw();
    msg(t>=75?"Brûlant !":t>=50?"Chaud":t>=28?"Tiède":"Glacial");inp.focus();
  };
  keyHandler=null;draw();setTimeout(()=>$("#si")?.focus(),50);
}


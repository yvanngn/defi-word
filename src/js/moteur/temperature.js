/* ================= Température Sémantix ================= */
function temperature(secret,g){
  if(g===secret)return 100;
  const a=LEX.get(secret),h=hash(secret+"|"+g),g1=g.replace(/(s|x)$/,"");
  const linked=t=>{const A=THEMES[a.t],B=THEMES[t];return A.links.includes(B.key)||B.links.includes(A.key);};
  let best=-1;
  const hd=HEAD.has(g)?HEAD.get(g):HEAD.get(g1);
  if(hd!==undefined)best=hd===a.t?70+h%15:linked(hd)?30+h%15:8+h%16;
  const b=LEX.get(g)||LEX.get(g1);
  let t2;
  if(!b)t2=2+h%20;
  else if(a.t===b.t&&a.s===b.s)t2=76+h%18;
  else if(a.t===b.t)t2=48+h%20;
  else t2=linked(b.t)?28+h%17:6+h%18;
  return Math.max(best,t2);
}


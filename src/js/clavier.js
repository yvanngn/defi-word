/* ================= Clavier global ================= */
document.addEventListener("keydown",e=>{
  if(screen!=="play"||!keyHandler)return;
  if(e.target.tagName==="INPUT"||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="Enter"||e.key==="Backspace")e.preventDefault();
  keyHandler(e);
});
init();
// pas de menu du navigateur au clic droit, nulle part dans le jeu, sauf dans les champs de saisie (skill interface-jeu)
document.getElementById('app').addEventListener('contextmenu',e=>{ if(!e.target.closest('input,textarea')) e.preventDefault(); });

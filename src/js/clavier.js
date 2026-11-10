/* ================= Clavier global ================= */
document.addEventListener("keydown",e=>{
  if(screen!=="play"||!keyHandler)return;
  if(e.target.tagName==="INPUT"||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="Enter"||e.key==="Backspace")e.preventDefault();
  keyHandler(e);
});
init();

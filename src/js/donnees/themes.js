let DICT=null;
(async()=>{try{
  const bin=Uint8Array.from(atob(DICT_B64),c=>c.charCodeAt(0));
  const txt=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  DICT=new Set(txt.split("\n"));WORDLE.forEach(w=>DICT.add(w.toLowerCase()));LEX.forEach((_,w)=>DICT.add(w));
}catch(e){DICT=null;}})();
const BOGGLE_EXCLUDE = new Set("jeuvideo arcenciel pontlevis tshirt hiphop breakdance speakerine aujourdhui".split(" "));

const THEMES=[], LEX=new Map();
LEXICON.trim().split("\n").forEach((line,ti)=>{
  const i=line.indexOf(":"); const [key,links]=line.slice(0,i).split(">");
  THEMES.push({key:key.trim(),links:(links||"").split(",").map(s=>s.trim())});
  line.slice(i+1).split("/").forEach((sub,si)=>sub.trim().split(/\s+/).forEach(w=>{if(w&&!LEX.has(w))LEX.set(w,{t:ti,s:si});}));
});
const ALLWORDS=[...LEX.keys()];
const SEM_POOL=ALLWORDS.filter(w=>w.length>=3&&w.length<=12);
// Boggle : mots de 4 à 6 lettres (lexique thématique + réserve courante)
const BOGGLE_POOL=[...new Set([...ALLWORDS.filter(w=>w.length>=4&&w.length<=6&&!BOGGLE_EXCLUDE.has(w)).map(w=>w.toUpperCase()),...WORDLE.filter(w=>w.length>=4&&w.length<=6)])];

// Catalogue des épreuves (l'admin choisit lesquelles, dans quel ordre et pour combien de points : moteur/config.js)
const CATALOGUE={
 wordle:{name:"Wordle",pts:15,c:"var(--green)",rule:"Un mot de 4 à 6 lettres en 6 essais.",mount:(e,p,n)=>mountWordle(e,p,n),sol:p=>p.wordle},
 boggle:{name:"Boggle",pts:15,c:"var(--blue)",rule:"Relie des lettres voisines pour former le mot caché.",mount:(e,p,n)=>mountBoggle(e,p,n),sol:p=>p.boggle},
 semantix:{name:"Sémantix",pts:15,c:"var(--pink)",rule:"Trouve le mot secret grâce à la température des mots.",mount:(e,p,n)=>mountSemantix(e,p,n),sol:p=>p.sem.toUpperCase()},
 pendu:{name:"Pendu",pts:15,c:"#8B5CF6",rule:"Devine le mot lettre par lettre, 7 erreurs maximum (chaque erreur coûte des points).",mount:(e,p,n)=>mountPendu(e,p,n),sol:p=>(p.pendu||"").toUpperCase()},
 calcul:{name:"Calcul",pts:10,c:"var(--sun)",rule:"5 calculs de tête, points partagés entre les bonnes réponses.",sun:true,mount:(e,p,n)=>mountCalcul(e,p,n),sol:p=>p.quiz.map(q=>q.a).join(", ")}
};

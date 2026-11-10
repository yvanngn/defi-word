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

const GAMES=[
 {name:"Wordle",pts:15,c:"var(--green)",rule:"Un mot de 4 à 6 lettres en 6 essais."},
 {name:"Boggle",pts:15,c:"var(--blue)",rule:"Relie des lettres voisines pour former le mot caché."},
 {name:"Sémantix",pts:15,c:"var(--pink)",rule:"Trouve le mot secret grâce à la température des mots."},
 {name:"Calcul",pts:10,c:"var(--sun)",rule:"5 calculs de tête, 2 points chacun.",sun:true}
];
const MAX=GAMES.reduce((s,g)=>s+g.pts,0);


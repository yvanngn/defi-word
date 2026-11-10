/* ================= Génération d'une partie ================= */
function adj(a,b){const ax=a%4,ay=a/4|0,bx=b%4,by=b/4|0;return a!==b&&Math.abs(ax-bx)<=1&&Math.abs(ay-by)<=1;}
function buildGrid(word){
  const L=[...word];
  for(let t=0;t<400;t++){
    const path=[],used=new Set();
    const dfs=(i,c)=>{path.push(c);used.add(c);if(i===L.length-1)return true;
      for(const n of shuffle([...Array(16).keys()].filter(n=>adj(c,n)&&!used.has(n))))if(dfs(i+1,n))return true;
      path.pop();used.delete(c);return false;};
    if(dfs(0,ri(0,15))){
      const pool="EEEEEEAAAAIIIIISSSSNNNNRRRRTTTTUUUOOOLLLDDCCMMPPGBVFH";
      const g=Array.from({length:16},()=>pickOne(pool));
      path.forEach((c,i)=>g[c]=L[i]);
      return g.join("");
    }
  }
  return null;
}
function buildQuiz(){
  const ops=[
    ()=>{const a=ri(23,96),b=ri(14,89);return{q:`${a} + ${b}`,a:a+b};},
    ()=>{const a=ri(60,180),b=ri(12,59);return{q:`${a} − ${b}`,a:a-b};},
    ()=>{const a=ri(3,9),b=ri(12,29);return{q:`${a} × ${b}`,a:a*b};},
    ()=>{const a=ri(3,9),b=ri(6,16);return{q:`${a*b} ÷ ${a}`,a:b};},
    ()=>{const p=pickOne([10,20,25,50,75]);const n=ri(2,24)*20;return{q:`${p} % de ${n}`,a:n*p/100};},
    ()=>{const a=ri(11,19),b=ri(11,19);return{q:`${a} × ${b}`,a:a*b};},
    ()=>{const a=ri(2,9),b=ri(2,9),c=ri(5,40);return{q:`${a} × ${b} + ${c}`,a:a*b+c};},
    ()=>{const a=ri(101,499),b=ri(101,399);return{q:`${a} + ${b}`,a:a+b};},
    ()=>{const n=ri(12,40);return{q:`triple de ${n}`,a:n*3};},
    ()=>{const n=ri(2,9)*ri(2,9);return{q:`moitié de ${n*2}`,a:n};}
  ];
  const kinds=[0,1,2,3,4];
  kinds[ri(0,4)]=ri(5,9);
  return shuffle(kinds).map(k=>ops[k]());
}
// Mots « chapeau » de chaque thème (ex. « fête » pour baptême) : très chauds pour tout le thème
const HEADS_SRC={mer:"mer ocean",randonnee:"randonnee marche",dessert:"dessert patisserie",petitdej:"petitdejeuner",fete:"fete celebration",television:"television tele",espace:"espace univers",ferme:"ferme campagne",savane:"savane jungle",animaux:"animal compagnie",transport:"transport vehicule",route:"route circulation",conte:"magie conte",emotion:"emotion sentiment",outils:"outil bricolage",calendrier:"calendrier date"};
const HEAD=new Map();
THEMES.forEach((th,i)=>(HEADS_SRC[th.key]||th.key).split(" ").forEach(w=>{if(!HEAD.has(w))HEAD.set(w,i);}));
const LABEL={petitdejeuner:"petit-déjeuner"};
// Indices : le mot chapeau du thème + un mot de la même petite famille
function semHints(secret){
  const me=LEX.get(secret);
  const heads=[...HEAD.entries()].filter(([w,t])=>t===me.t&&w!==secret).map(([w])=>w);
  const sub=ALLWORDS.filter(w=>{const x=LEX.get(w);return w!==secret&&x.t===me.t&&x.s===me.s;});
  const out=heads.slice(0,1);
  out.push(...shuffle(sub).slice(0,2-out.length));
  return out;
}
// Choisit des énigmes jamais jouées (en mémoire dans meta/used), puis remet à zéro une catégorie épuisée
function generatePuzzles(used){
  used={wordle:[],boggle:[],semantix:[],...(used||{})};
  const take=(pool,key,avoid)=>{
    const seen=new Set(used[key]);
    let avail=pool.filter(w=>!seen.has(w)&&!avoid.has(w));
    if(!avail.length){used[key]=[];avail=pool.filter(w=>!avoid.has(w));}
    const w=pickOne(avail); used[key]=[...used[key],w]; return w;
  };
  const avoid=new Set();
  const sem=take(SEM_POOL,"semantix",avoid); avoid.add(sem.toUpperCase()); avoid.add(sem);
  let boggle,grid;
  do{boggle=take(BOGGLE_POOL,"boggle",avoid);grid=buildGrid(boggle);}while(!grid);
  avoid.add(boggle);
  // Longueur tirée au hasard (4 à 6), puis un mot jamais joué de cette longueur
  const seenW=new Set(used.wordle);let wordle=null;
  for(const L of shuffle([4,5,6])){const avail=WORDLE.filter(w=>w.length===L&&!seenW.has(w)&&!avoid.has(w));if(avail.length){wordle=pickOne(avail);break;}}
  if(!wordle){used.wordle=[];wordle=pickOne(WORDLE.filter(w=>w.length<=6&&!avoid.has(w)));}
  used.wordle=[...used.wordle,wordle];
  return {puzzle:{wordle,boggle,grid,sem,hints:semHints(sem),quiz:buildQuiz()},used};
}


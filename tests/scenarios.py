#!/usr/bin/env python3
"""Tests du « Défi » : rejoue le jeu dans un vrai navigateur (Chromium via Playwright).
Usage : python3 tests/scenarios.py [groupe…]   (après python3 build.py)
Groupes : donnees solo epreuves reglages admin enligne mobile. Code de sortie 0 si tout passe, 1 sinon."""
import asyncio, os, sys
from playwright.async_api import async_playwright

PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist', 'index.html'))
ok = 0; echecs = []

def verif(cond, nom):
    global ok
    if cond: ok += 1
    else: echecs.append(nom); print('ÉCHEC :', nom)

async def ouvrir(nav, **opts):
    ctx = await nav.new_context(**opts)
    page = await ctx.new_page()
    erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)+(e.stack or '')[:300]))
    await page.goto(PAGE)
    await page.wait_for_function('DICT!==null', timeout=15000)
    return ctx, page, erreurs

async def lancer_solo(page):
    await page.click('#solo')
    await page.wait_for_selector('#stage')

async def etape(page):
    return await page.evaluate('round.st.step')

async def attendre_etape(page, n):
    await page.wait_for_function(f'!round||round.st.done||round.st.step>={n}', timeout=5000)

# ---------- Groupes ----------
async def donnees(nav):
    ctx, page, err = await ouvrir(nav)
    r = await page.evaluate('''()=>{
      const pb=[];
      for(let k=0;k<150;k++){
        const {puzzle:p}=generatePuzzles(null);
        if(!WORDLE.includes(p.wordle)||p.wordle.length<4||p.wordle.length>6) pb.push('wordle '+p.wordle);
        if(!BOGGLE_POOL.includes(p.boggle)) pb.push('boggle hors liste '+p.boggle);
        if(p.grid.length!==16) pb.push('grille '+p.grid);
        if(!SEM_POOL.includes(p.sem)) pb.push('sem '+p.sem);
        if(p.hints.length<1||p.hints.includes(p.sem)) pb.push('indices '+p.sem);
        if(p.quiz.length!==5||p.quiz.some(q=>!Number.isFinite(q.a))) pb.push('quiz');
        if(p.wordle===p.boggle||p.sem.toUpperCase()===p.boggle) pb.push('doublon');
        // le mot du Boggle est traçable dans la grille
        const G=[...p.grid],W=[...p.boggle];
        const dfs=(i,c,u)=>G[c]===W[i]&&(i===W.length-1||[...Array(16).keys()].some(n=>adj(c,n)&&!u.has(n)&&dfs(i+1,n,new Set([...u,n]))));
        if(![...Array(16).keys()].some(c=>dfs(0,c,new Set([c])))) pb.push('boggle introuvable '+p.boggle);
      }
      return pb;}''')
    verif(r == [], 'génération de 150 parties valides ' + str(r[:5]))
    # Pas de répétition tant qu'une catégorie n'est pas épuisée
    r = await page.evaluate('''()=>{let used=null;const vus=new Set();for(let k=0;k<30;k++){const o=generatePuzzles(used);used=o.used;vus.add(o.puzzle.wordle);}return vus.size;}''')
    verif(r == 30, 'mémoire des énigmes jouées (30 Wordle différents)')
    t = await page.evaluate('''()=>{const s="crabe";return {eg:temperature(s,s),fam:temperature(s,"meduse"),theme:temperature(s,"plage"),hors:temperature(s,"zzz")}}''')
    verif(t['eg'] == 100, 'température 100 pour le mot secret')
    verif(t['fam'] >= 76 and t['hors'] < 28, 'température : famille chaude, mot inconnu froid ' + str(t))
    verif(await page.evaluate('DICT.has("maison")&&DICT.has("abeille")&&!DICT.has("xqzt")'), 'dictionnaire décompressé')
    verif(await page.evaluate('norm("Été !")') == 'ete', 'normalisation des accents')
    verif(await page.evaluate('bonusDe({scores:[15,15,15,10],time:60},cfgNorm(null)).temps') == 12, 'bonus temps : 120 s restantes, sans faute = 12 pts')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

async def solo(nav):
    """Partie parfaite en solo, en passant par l'interface (clavier, clics, formulaires)."""
    ctx, page, err = await ouvrir(nav)
    verif(await page.is_visible('#solo'), 'hors claude.ai : écran mode solo')
    await lancer_solo(page)
    P = await page.evaluate('round.p')
    # 1. Wordle : un mauvais mot du dictionnaire puis le bon, au clavier
    await page.keyboard.type(P['wordle'])
    await page.keyboard.press('Enter')
    await attendre_etape(page, 1)
    verif(await page.evaluate('round.st.scores[0]') == 15, 'Wordle trouvé : 15 pts')
    # 2. Boggle : cliquer le chemin des lettres
    chemin = await page.evaluate('''()=>{const G=[...round.p.grid],W=[...round.p.boggle];let out=null;
      const dfs=(i,c,ch)=>{if(G[c]!==W[i])return false;if(i===W.length-1){out=ch;return true;}
        return [...Array(16).keys()].some(n=>adj(c,n)&&!ch.includes(n)&&dfs(i+1,n,[...ch,n]));};
      [...Array(16).keys()].some(c=>dfs(0,c,[c]));return out;}''')
    for i in chemin:
        await page.dispatch_event(f'.cell[data-i="{i}"]', 'pointerdown')
        await page.evaluate('window.onpointerup&&window.onpointerup()')
    await page.click('#bok')
    await attendre_etape(page, 2)
    verif(await page.evaluate('round.st.scores[1]') == 15, 'Boggle trouvé : 15 pts')
    # 3. Sémantix : un mot tiède puis le mot secret
    await page.fill('#si', 'zzz'); await page.press('#si', 'Enter')
    verif(await page.locator('#gl li').count() >= 1, 'Sémantix : essai affiché')
    await page.fill('#si', P['sem']); await page.press('#si', 'Enter')
    await attendre_etape(page, 3)
    verif(await page.evaluate('round.st.scores[2]') == 15, 'Sémantix trouvé : 15 pts')
    # 4. Calcul : 5 bonnes réponses
    for q in P['quiz']:
        await page.fill('#qa', str(q['a']).replace('.', ','))
        await page.press('#qa', 'Enter')
    await page.wait_for_function('screen==="end"', timeout=5000)
    tot = await page.evaluate('total()')
    verif(await page.evaluate('round.st.scores.join()') == '15,15,15,10', 'partie parfaite : 55 pts')
    verif(tot >= 55 and await page.evaluate('round.st.bonus') > 0, 'bonus temps ajouté')
    verif(str(tot) in await page.inner_text('.final'), 'écran de fin : total affiché')
    await page.click('#back')
    verif(await page.is_visible('#solo'), 'retour à l’écran solo')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

async def epreuves(nav):
    """Passer, échouer, chrono écoulé, sauvegarde."""
    ctx, page, err = await ouvrir(nav)
    await lancer_solo(page)
    # Wordle : mot hors dictionnaire refusé
    n = len(await page.evaluate('round.p.wordle'))
    await page.keyboard.type('Q' * n); await page.keyboard.press('Enter')
    verif('dictionnaire' in (await page.inner_text('#wmsg')).lower() or await page.inner_text('#wmsg') != '', 'Wordle : mot inconnu refusé')
    await page.click('#skip'); await attendre_etape(page, 1)
    verif(await page.evaluate('round.st.scores[0]') == 0, 'passer une épreuve : 0 pt')
    # Boggle : mauvaise longueur → message
    await page.dispatch_event('.cell[data-i="0"]', 'pointerdown'); await page.evaluate('window.onpointerup()')
    await page.click('#bok')
    verif('lettres' in await page.inner_text('#bmsg'), 'Boggle : trop court signalé')
    await page.click('#skip'); await attendre_etape(page, 2)
    await page.click('#skip'); await attendre_etape(page, 3)
    # Calcul : une fausse réponse
    await page.fill('#qa', '-1'); await page.press('#qa', 'Enter')
    verif('Raté' in await page.inner_text('#qmsg'), 'Calcul : erreur signalée')
    verif(await page.evaluate('!!localStorage.getItem(recKey(round.id))'), 'manche sauvegardée')
    # Chrono écoulé
    await page.evaluate('round.st.start=Date.now()-(TOTAL+1)*1000')
    await page.wait_for_function('screen==="end"', timeout=4000)
    verif(await page.evaluate('round.st.done&&round.st.bonus===0'), 'fin du chrono : manche close, pas de bonus')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

async def mobile(nav):
    ctx, page, err = await ouvrir(nav, viewport={'width': 360, 'height': 740}, has_touch=True, is_mobile=True)
    for nom in ['accueil', 'reglages', 'pendu', 'wordle']:
        if nom == 'reglages':
            await page.click('#reglages'); await page.wait_for_selector('#cf')
        if nom == 'pendu':
            await page.click('#cx'); await lancer_solo(page)
            await page.evaluate("round.p.pendu='hippopotame';round.p.cfg=cfgNorm({jeux:['pendu']});renderStep()")
        if nom == 'wordle':
            await page.evaluate("round.p.cfg=cfgNorm(null);round.p.wordle='ABAISSER';renderStep()")  # mot long : pire cas
        large = await page.evaluate('document.documentElement.scrollWidth')
        verif(large <= 360, f'mobile {nom} : pas de défilement horizontal ({large}px)')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

# Faux window.claude (base en mémoire, un seul joueur admin) pour tester le salon multijoueur
MOCK = r"""(()=>{const store=new Map(),subs=[];
const snap=(path)=>{const v=store.get(path);return {exists:v!==undefined,data:()=>v&&JSON.parse(JSON.stringify(v)),id:path.split('/').pop()};};
const notify=()=>subs.forEach(f=>f());
const coll=(name,filt)=>{const docs=()=>[...store.keys()].filter(k=>k.startsWith(name+'/')).map(snap).filter(d=>!filt||filt(d.data()));
  const q={where:(f,op,v)=>coll(name,d=>d[f]===v),orderBy:()=>q,limit:()=>q,get:async()=>({docs:docs()}),
    onSnapshot:(cb)=>{const f=()=>cb({docs:docs()});subs.push(f);setTimeout(f,0);return()=>{};}};return q;};
const db={doc:path=>({get:async()=>snap(path),set:async v=>{store.set(path,JSON.parse(JSON.stringify(v)));setTimeout(notify,0);},
  update:async v=>{store.set(path,{...store.get(path),...v});setTimeout(notify,0);},
  onSnapshot:(cb)=>{const f=()=>cb(snap(path));subs.push(f);setTimeout(f,0);return()=>{};}}),collection:n=>coll(n)};
window.__store=store;
window.claude={use:async k=>k==='db'?db:k==='user'?{id:async()=>'u1',canEdit:async()=>true}:null};
localStorage.setItem('defi:pseudo','Yvan');})()"""

async def reglages(nav):
    """Écran de réglages en solo : choix, ordre, points, temps, bonus ; épreuve du Pendu."""
    ctx, page, err = await ouvrir(nav)
    r = await page.evaluate('()=>{const c=cfgNorm({jeux:["pendu","zzz","pendu"],temps:5,pts:{wordle:999},bonusPas:0});return [c.jeux.join(),c.temps,c.pts.wordle,c.bonusPas]}')
    verif(r == ['pendu', 30, 100, 1], 'réglages : valeurs bornées et jeux inconnus ignorés ' + str(r))
    await page.click('#reglages')
    await page.wait_for_selector('#cf')
    li = lambda i: f'#cj li[data-id="{i}"]'
    # Pendu coché et remonté en 1re position, Boggle décoché, Wordle à 20 pts
    await page.check(li('pendu') + ' [name=on]')
    for _ in range(4): await page.click(li('pendu') + ' [data-m="-1"]')
    await page.uncheck(li('boggle') + ' [name=on]')
    await page.fill(li('wordle') + ' [name=pts]', '20')
    await page.fill(li('pendu') + ' [name=pts]', '14')
    await page.fill('#ct', '120'); await page.uncheck('#cb'); await page.fill('#cz', '5')
    await page.click('#cs')
    await page.wait_for_selector('#solo')
    c = await page.evaluate('JSON.parse(localStorage.getItem("defi:cfg"))')
    verif(c['jeux'] == ['pendu', 'wordle', 'semantix', 'calcul'], 'réglages : épreuves et ordre enregistrés ' + str(c['jeux']))
    verif(c['temps'] == 120 and c['pts']['wordle'] == 20 and not c['bonusTemps'] and c['bonusParfait'] == 5, 'réglages : temps, points, bonus enregistrés')
    t = await page.inner_text('#app')
    verif('2 minutes' in t and '59 pts max' in t, 'programme mis à jour (59 pts, 2 minutes)')
    # Aucune épreuve cochée : refusé
    await page.click('#reglages')
    for i in ['pendu', 'wordle', 'semantix', 'calcul']: await page.uncheck(li(i) + ' [name=on]')
    await page.click('#cs')
    verif('au moins' in await page.inner_text('#cmsg'), 'réglages : au moins une épreuve')
    await page.click('#cx')
    await page.reload(); await page.wait_for_function('DICT!==null')
    verif(await page.evaluate('cfg.jeux[0]') == 'pendu', 'réglages solo conservés après rechargement')
    # Partie : Pendu avec 1 erreur, calcul 4/5, pas de bonus temps, sans-faute manqué
    await lancer_solo(page)
    P = await page.evaluate('round.p')
    verif(await page.inner_text('.stage-head h2') == 'Pendu', 'Pendu en première épreuve')
    verif(await page.inner_text('#game .hint') == f"{len(P['pendu'])} lettres, 7 erreurs permises.", 'Pendu : nombre de lettres affiché, sans thème')
    faute = next(ch for ch in 'ZWXKQJY' if ch not in P['pendu'].upper())
    await page.keyboard.press(faute)
    verif(await page.locator('#pg > *').count() >= 1, 'Pendu : erreur dessinée')
    for ch in dict.fromkeys(P['pendu'].upper()):
        await page.click(f'#game .key[data-k="{ch}"]')
    await attendre_etape(page, 1)
    verif(await page.evaluate('round.st.scores[0]') == 13, 'Pendu : 14 pts − 1 erreur = 13 pts')
    await page.keyboard.type(P['wordle']); await page.keyboard.press('Enter'); await attendre_etape(page, 2)
    verif(await page.evaluate('round.st.scores[1]') == 20, 'Wordle à 20 pts')
    await page.fill('#si', P['sem']); await page.press('#si', 'Enter'); await attendre_etape(page, 3)
    for q in P['quiz'][:4]:
        await page.fill('#qa', str(q['a'])); await page.press('#qa', 'Enter')
    await page.fill('#qa', '-1'); await page.press('#qa', 'Enter')
    await page.wait_for_function('screen==="end"', timeout=5000)
    verif(await page.evaluate('round.st.scores.join()+"|"+round.st.bonus') == '13,20,15,8|0', 'scores réglés, calcul 4/5 = 8, pas de bonus')
    txt = await page.inner_text('.recap')
    verif('Bonus temps' not in txt and 'Bonus sans-faute' in txt and P['pendu'].upper() in txt, 'écran de fin : réponse du Pendu, bonus affichés selon réglages')
    r = await page.evaluate('''()=>{const c=cfgNorm({jeux:["pendu","calcul"],pts:{pendu:10,calcul:10},bonusTemps:true,bonusPas:10,bonusParfait:7,temps:100});
      return [bonusDe({scores:[10,10],time:50},c),bonusDe({scores:[9,10],time:50},c)]}''')
    verif(r[0] == {'temps': 5, 'parfait': 7} and r[1] == {'temps': 5, 'parfait': 0}, 'calcul des bonus temps et sans-faute ' + str(r))
    # Pendu perdu
    await page.click('#back'); await lancer_solo(page)
    P = await page.evaluate('round.p')
    for ch in [c for c in 'ZWXKQJYBVHFG' if c not in P['pendu'].upper()][:7]:
        await page.keyboard.press(ch)
    await attendre_etape(page, 1)
    verif(await page.evaluate('round.st.scores[0]') == 0, 'Pendu perdu après 7 erreurs : 0 pt')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

async def admin(nav):
    """Salon multijoueur simulé : l'admin règle la partie, la lance, les réglages suivent la partie."""
    ctx = await nav.new_context(); await ctx.add_init_script(MOCK)
    page = await ctx.new_page(); err = []
    page.on('pageerror', lambda e: err.append(str(e)))
    await page.goto(PAGE); await page.wait_for_function('DICT!==null&&screen==="lobby"', timeout=15000)
    await page.click('#reglages'); await page.wait_for_selector('#cf')
    await page.check('#cj li[data-id="pendu"] [name=on]')
    for i in ['wordle', 'boggle', 'semantix']: await page.uncheck(f'#cj li[data-id="{i}"] [name=on]')
    await page.fill('#ct', '90'); await page.click('#cs')
    await page.wait_for_function('screen==="lobby"')
    c = await page.evaluate('__store.get("config/main")')
    verif(c and c['jeux'] == ['calcul', 'pendu'] and c['temps'] == 90, 'admin : réglages enregistrés dans la base ' + str(c and c['jeux']))
    verif('1:30' in await page.inner_text('#app'), 'salon : durée affichée')
    await page.click('#launch')
    await page.wait_for_function('screen==="play"', timeout=5000)
    g = await page.evaluate('__store.get("game/current")')
    verif(g['cfg']['jeux'] == ['calcul', 'pendu'] and g.get('pendu'), 'partie lancée avec ses réglages et un mot de Pendu')
    verif(await page.evaluate('round.st.scores.length') == 2 and await page.inner_text('.stage-head h2') == 'Calcul', 'manche à 2 épreuves')
    await page.evaluate('round.st.start=Date.now()-91000')
    await page.wait_for_function('screen==="end"', timeout=4000)
    await page.wait_for_function('__store.get("game/current").status==="finished"', timeout=8000)
    h = await page.evaluate('__store.get("games/"+round.id)')
    verif('pendu' in h['answers'] and 'wordle' not in h['answers'], 'historique : réponses des épreuves jouées')
    verif(await page.evaluate('__store.get("meta/used").pendu.length') == 1, 'mot de Pendu mémorisé (pas de répétition)')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

# ---------- Faux Supabase (PostgREST minimal, en mémoire) pour le mode en ligne ----------
import json, datetime, urllib.parse
SITE = 'http://localhost:8765/'  # localhost = contexte sécurisé (WebCrypto), comme https

class FauxSupa:
    def __init__(self): self.rows = {}; self.n = 0
    def maj(self):
        self.n += 1
        return (datetime.datetime(2026, 1, 1) + datetime.timedelta(milliseconds=self.n)).isoformat(timespec='milliseconds') + '+00:00'
    async def route(self, route):
        req = route.request; u = urllib.parse.urlparse(req.url); q = urllib.parse.parse_qs(u.query)
        if req.method == 'GET':
            rows = list(self.rows.values())
            if 'maj' in q:
                d = datetime.datetime.fromisoformat(q['maj'][0][4:].replace('Z', '+00:00'))
                rows = [r for r in rows if datetime.datetime.fromisoformat(r['maj']) >= d]
            rows.sort(key=lambda r: r['maj'])
            return await route.fulfill(status=200, content_type='application/json', body=json.dumps(rows))
        if req.method == 'POST':
            b = json.loads(req.post_data); b['maj'] = self.maj(); self.rows[b['path']] = b
            return await route.fulfill(status=201, content_type='application/json', body=json.dumps([b]))
        await route.fulfill(status=204, body='')

async def ouvrir_en_ligne(nav, faux, pseudo):
    ctx = await nav.new_context()
    html = open(PAGE[7:], encoding='utf-8').read()
    await ctx.route(SITE + '**', lambda r: r.fulfill(status=200, content_type='text/html', body=html))
    await ctx.route('https://hhyudxnkuoxzrkfkjipn.supabase.co/**', faux.route)
    page = await ctx.new_page(); err = []
    page.on('pageerror', lambda e: err.append(str(e)))
    await page.goto(SITE)
    await page.wait_for_function('DICT!==null&&(screen==="pseudo"||screen==="lobby")', timeout=15000)
    if await page.evaluate('screen') == 'pseudo':
        await page.fill('#pi', pseudo); await page.press('#pi', 'Enter')
        await page.wait_for_function('screen==="lobby"')
    return ctx, page, err

async def enligne(nav):
    """GitHub Pages + Supabase : deux joueurs, présence, admin par mot de passe, partie commune et classement."""
    faux = FauxSupa()
    c1, a, ea = await ouvrir_en_ligne(nav, faux, 'Yvan')
    c2, b, eb = await ouvrir_en_ligne(nav, faux, 'Lucy')
    verif(await a.evaluate('enLigne&&!solo&&!isAdmin'), 'en ligne : salon multijoueur, pas encore admin')
    await a.wait_for_function('lobbyPeople().length===2', timeout=12000)
    verif(True, 'présence : chacun voit les 2 joueurs')
    # Admin : le premier mot de passe devient celui de l'admin ; un autre est refusé
    await a.click('#admo'); await a.fill('#admp', 'secret'); await a.press('#admp', 'Enter')
    await a.wait_for_selector('#launch')
    verif(await a.evaluate('isAdmin') and 'meta/admin' in faux.rows and 'secret' not in json.dumps(faux.rows), 'admin : mot de passe enregistré sous forme d’empreinte')
    await b.click('#admo'); await b.fill('#admp', 'autre'); await b.press('#admp', 'Enter')
    await b.wait_for_function('document.querySelector("#admm").textContent.includes("incorrect")')
    verif(not await b.evaluate('isAdmin'), 'admin : mauvais mot de passe refusé')
    # Lucy se déclare prête, Yvan règle (Pendu + Calcul) et lance
    await b.click('#rdy')
    await a.wait_for_function('lobbyPeople().some(p=>p.pseudo==="Lucy"&&p.ready)', timeout=12000)
    verif(True, 'présence : « prêt » transmis')
    await a.click('#reglages'); await a.wait_for_selector('#cf')
    await a.check('#cj li[data-id="pendu"] [name=on]')
    for i in ['wordle', 'boggle', 'semantix']: await a.uncheck(f'#cj li[data-id="{i}"] [name=on]')
    await a.click('#cs'); await a.wait_for_function('screen==="lobby"')
    await b.wait_for_function('cfg.jeux.join()==="calcul,pendu"', timeout=6000)
    verif(True, 'réglages de l’admin reçus par les joueurs')
    await a.click('#launch')
    await a.wait_for_function('screen==="play"', timeout=6000)
    await b.wait_for_function('screen==="play"', timeout=6000)
    verif(await b.evaluate('round.id') == await a.evaluate('round.id'), 'lancement reçu : même partie pour les deux')
    # Lucy réussit le calcul, puis tout le monde termine (chrono écoulé)
    P = await b.evaluate('round.p')
    for q in P['quiz']:
        await b.fill('#qa', str(q['a'])); await b.press('#qa', 'Enter')
    await b.wait_for_function('round.st.step===1', timeout=5000)
    await a.wait_for_function('liveRows.some(r=>r.pseudo==="Lucy"&&r.total===10)', timeout=8000)
    verif(True, 'classement en direct : score de Lucy visible chez l’admin')
    for p in (a, b): await p.evaluate('round.st.start=Date.now()-(rc().temps+1)*1000')
    await a.wait_for_function('history.length===1', timeout=15000)
    h = await a.evaluate('history[0]')
    verif(h['standings'][0]['pseudo'] == 'Lucy' and len(h['standings']) == 2, 'fin de partie : classement enregistré, Lucy 1re')
    await a.wait_for_function('game.status==="finished"', timeout=5000)
    await b.wait_for_function('game.status==="finished"', timeout=6000)
    verif(True, 'partie close, chez tous les joueurs')
    # Rechargement : l'admin le reste, l'identité est conservée
    uid = await a.evaluate('uid'); await a.reload()
    await a.wait_for_function('screen==="lobby"', timeout=15000)
    verif(await a.evaluate('isAdmin') and await a.evaluate('uid') == uid, 'rechargement : même joueur, toujours admin')
    verif(ea == [] and eb == [], 'aucune erreur JS ' + str(ea + eb))
    await c1.close(); await c2.close()

GROUPES = {'donnees': donnees, 'solo': solo, 'epreuves': epreuves, 'reglages': reglages, 'admin': admin, 'enligne': enligne, 'mobile': mobile}

async def main():
    noms = sys.argv[1:] or list(GROUPES)
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        for n in noms:
            print('—', n); await GROUPES[n](nav)
        await nav.close()
    print(f'{ok} vérifications réussies, {len(echecs)} échec(s)')
    sys.exit(1 if echecs else 0)

asyncio.run(main())

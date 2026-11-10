#!/usr/bin/env python3
"""Tests du « Défi » : rejoue le jeu dans un vrai navigateur (Chromium via Playwright).
Usage : python3 tests/scenarios.py [groupe…]   (après python3 build.py)
Groupes : donnees solo epreuves mobile. Code de sortie 0 si tout passe, 1 sinon."""
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
    page.on('pageerror', lambda e: erreurs.append(str(e)))
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
    verif(await page.evaluate('timeBonus({scores:[15,15,15,10],time:60})') >= 0, 'bonus temps calculable')
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
    for nom in ['accueil', 'wordle']:
        if nom == 'wordle':
            await lancer_solo(page)
            await page.evaluate("round.p.wordle='ABAISSER';renderStep()")  # mot long : pire cas
        large = await page.evaluate('document.documentElement.scrollWidth')
        verif(large <= 360, f'mobile {nom} : pas de défilement horizontal ({large}px)')
    verif(err == [], 'aucune erreur JS ' + str(err))
    await ctx.close()

GROUPES = {'donnees': donnees, 'solo': solo, 'epreuves': epreuves, 'mobile': mobile}

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

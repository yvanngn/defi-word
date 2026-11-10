#!/usr/bin/env python3
"""Assemble src/ en un seul fichier dist/index.html (la page publiée doit être autonome)."""
import os, subprocess
ICI=os.path.dirname(os.path.abspath(__file__)); SRC=os.path.join(ICI,'src')
def lire(p): return open(os.path.join(SRC,p),encoding='utf-8').read()
ordre=[l.strip() for l in lire('ordre.txt').splitlines() if l.strip() and not l.startswith('#')]
# Version : majeure.mineure dans VERSION (mineure +1 à chaque nouveau chapitre), patch = nombre de commits depuis le dernier changement de VERSION
def version():
    base=open(os.path.join(ICI,'VERSION')).read().strip()
    try:
        g=lambda *a: subprocess.run(['git','-C',ICI,*a],capture_output=True,text=True,check=True).stdout.strip()
        dernier=g('log','-1','--format=%H','--','VERSION'); patch=g('rev-list','--count',dernier+'..HEAD') if dernier else '0'
    except Exception: patch='0'
    return base+'.'+patch
VERSION=version()
html=lire('index.html').replace('/*@CSS*/\n',lire('css/style.css')).replace('/*@JS*/\n',''.join(lire(p) for p in ordre)).replace('__VERSION__',VERSION)
if '🆕' in html: raise SystemExit('Erreur : un marqueur 🆕 (relecture des dialogues) est resté dans le code. Le retirer de src/.')
os.makedirs(os.path.join(ICI,'dist'),exist_ok=True)
open(os.path.join(ICI,'dist','index.html'),'w',encoding='utf-8').write(html)
print('dist/index.html : v'+VERSION+',',len(html)//1024,'Ko,',len(ordre),'fichiers JS')

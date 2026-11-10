#!/bin/sh
# Assemble le jeu puis rejoue les tests : sh tester.sh solo   (sans argument : tout)
# Groupes : donnees solo epreuves mobile
cd "$(dirname "$0")" && python3 build.py && python3 tests/scenarios.py "$@"

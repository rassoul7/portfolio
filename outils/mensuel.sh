#!/usr/bin/env bash
# Mise à jour mensuelle du portfolio à partir du vault ~/CARRIERE (lancée par un minuteur systemd, le 1er du mois).
#   1. ~/CARRIERE : outils/generer.py régénère les CV (dont les versions web sans téléphone) et les notes Obsidian ;
#   2. publier.sh : export du profil (avec les gardes : téléphone, noms interdits, éléments « a_confirmer » exclus),
#      stats Chess.com du moment, build, puis mise en ligne sur rassoul7.github.io ;
#   3. les données mises à jour sont commitées et poussées sur github.com/rassoul7/portfolio.
# Journal : ~/.local/state/portfolio/mensuel.log. Une notification de bureau dit comment ça s'est passé.
set -euo pipefail

export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"
JOURNAL="$HOME/.local/state/portfolio/mensuel.log"
mkdir -p "$(dirname "$JOURNAL")"
exec >>"$JOURNAL" 2>&1
echo "=== $(date '+%F %T') ==="

alerte() { notify-send -a Portfolio "Portfolio" "$1" 2>/dev/null || true; echo "$1"; }
trap 'alerte "Mise à jour mensuelle échouée : voir $JOURNAL"' ERR

cd "$HOME/PORTFOLIO"
# Jamais de publication d'un chantier en cours : seuls les fichiers de données peuvent être modifiés.
if git status --porcelain | grep -vE ' (src/donnees/|contenu/echecs\.json|public/cv/)' | grep -q .; then
  alerte "Mise à jour mensuelle reportée : du travail non commité dans ~/PORTFOLIO. Commite-le puis relance outils/mensuel.sh."
  exit 0
fi

(cd "$HOME/CARRIERE" && python3 outils/generer.py)

SORTIE="$(mktemp)"
./publier.sh >"$SORTIE" 2>&1 || { cat "$SORTIE"; rm -f "$SORTIE"; false; }
cat "$SORTIE"
grep -q "TRADUCTION ANGLAISE MANQUANTE" "$SORTIE" \
  && alerte "Des éléments du vault n'ont pas encore de traduction anglaise (contenu/en.yaml) : voir $JOURNAL"
rm -f "$SORTIE"

git add src/donnees contenu/echecs.json public/cv
if git diff --cached --quiet; then
  alerte "Portfolio vérifié et republié : rien de nouveau dans le vault ce mois-ci."
else
  git commit -q -m "Mise à jour mensuelle du $(date +%F)"
  git push -q
  alerte "Portfolio mis à jour à partir du vault Carrière, publié et poussé sur GitHub."
fi

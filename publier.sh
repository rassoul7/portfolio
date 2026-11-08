#!/usr/bin/env bash
# Publie le portfolio sur https://rassoul7.github.io (à lancer par Rassoul).
set -e
cd ~/PORTFOLIO && npm run build
rm -rf ~/PORTFOLIO-pages/* && cp -r dist/. ~/PORTFOLIO-pages/ && touch ~/PORTFOLIO-pages/.nojekyll
cd ~/PORTFOLIO-pages
git add -A && git commit -q -m "Mise à jour du portfolio" || true
if ! gh repo view rassoul7/rassoul7.github.io >/dev/null 2>&1; then
  gh repo create rassoul7/rassoul7.github.io --public --description "Portfolio · Engineer, creator, explorer"
  git remote add origin https://github.com/rassoul7/rassoul7.github.io.git
  git push -u origin main
  gh api -X POST repos/rassoul7/rassoul7.github.io/pages -f "source[branch]=main" -f "source[path]=/"
else
  git push origin main
fi
echo "En ligne dans 1 à 2 minutes : https://rassoul7.github.io"

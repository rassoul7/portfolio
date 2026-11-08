#!/usr/bin/python3
"""Exporte le profil maître (~/CARRIERE/profil/profil.yaml) et la traduction anglaise (contenu/en.yaml)
vers src/donnees/profil.json, puis copie les CV PDF dans public/cv/.

Seul ce qui peut être public sort d'ici : pas de chemins locaux, pas de téléphone, pas d'élément « a_confirmer ».
"""
import json
import pathlib
import shutil
import urllib.request

import yaml

ICI = pathlib.Path(__file__).resolve().parent.parent
CARRIERE = pathlib.Path.home() / "CARRIERE"
PROFILS_CV = ["general", "genie_info", "ia_recherche", "secu_ot", "fullstack"]

# Preuves publiques : seul ce qui est réellement consultable en ligne reçoit un lien.
LIENS_PUBLICS = {
    "ayaqli": "https://github.com/rassoul7/AYAQLI",
}
# Projets du profil maître qu'on ne montre pas sur le portfolio (ils restent dans les CV).
# Coups brillants Chess.com (Stats > Brilliant Moves, « All »), relevé à la main le 8 novembre 2026 :
# l'API publique ne fournit pas ce chiffre. À mettre à jour ici.
BRILLANTS = 157
MASQUES_PORTFOLIO = {"sensante"}
PREUVE_PRIVEE = {"fr": "Dépôt privé, démonstration sur demande", "en": "Private repository, demo on request"}


def echecs() -> dict:
    """Statistiques publiques Chess.com (API officielle), avec une copie locale si le réseau manque."""
    copie = ICI / "contenu" / "echecs.json"
    try:
        req = urllib.request.Request("https://api.chess.com/pub/player/rassoul_name/stats",
                                     headers={"User-Agent": "portfolio-rassoul7 (build)"})
        d = json.load(urllib.request.urlopen(req, timeout=15))
        def cad(k):
            v = d.get(k, {})
            r = v.get("record", {})
            return {"actuel": v.get("last", {}).get("rating"), "meilleur": v.get("best", {}).get("rating"),
                    "parties": r.get("win", 0) + r.get("loss", 0) + r.get("draw", 0)}
        res = {"rapide": cad("chess_rapid"), "blitz": cad("chess_blitz"),
               "tactique": d.get("tactics", {}).get("highest", {}).get("rating"),
               "profil": "https://www.chess.com/member/RASSOUL_NAME"}
        copie.write_text(json.dumps(res, indent=1), encoding="utf-8")
        return res
    except Exception as err:  # réseau indisponible : dernière copie connue
        print("échecs : copie locale utilisée", err)
        return json.loads(copie.read_text(encoding="utf-8"))


def visible(e: dict) -> bool:
    c = e.get("cibles", ["tous"])
    return e.get("statut") != "a_confirmer" and ("tous" in c or "general" in c)


def main() -> None:
    p = yaml.safe_load((CARRIERE / "profil" / "profil.yaml").read_text(encoding="utf-8"))
    en = yaml.safe_load((ICI / "contenu" / "en.yaml").read_text(encoding="utf-8"))
    # Identifiants internes à ne jamais publier : remplacés par des alias neutres. La correspondance et la liste
    # des mots interdits vivent dans outils/prive.local.json, hors de git (le dépôt du code est public).
    prive = json.loads((ICI / "outils" / "prive.local.json").read_text(encoding="utf-8"))
    alias = lambda x: prive["alias"].get(x, x)
    for sec in ("formation", "experiences", "projets", "engagements"):
        for e in p[sec]:
            e["id"] = alias(e["id"])
    for c in p["competences"]:
        c["preuves"] = [alias(x) for x in c["preuves"]]
    i = p["identite"]

    def trad(section: str, id_: str, champ: str, defaut):
        return en.get(section, {}).get(id_, {}).get(champ, defaut)

    formation = [
        {"id": f["id"], "debut": str(f.get("debut", "")), "fin": str(f.get("fin", "")),
         "prevu": bool(f.get("fin_prevue")),
         "fr": {"titre": f["diplome"], "lieu": f["ecole"]},
         "en": {"titre": trad("formation", f["id"], "diplome", f["diplome"]),
                "lieu": trad("formation", f["id"], "ecole", f["ecole"])}}
        for f in p["formation"] if visible(f)
    ]
    experiences = []
    for e in p["experiences"]:
        if not visible(e):
            continue
        puces = [" ".join(x["texte"].split()) for x in e.get("puces", []) if visible(x)]
        experiences.append({
            "id": e["id"], "debut": str(e.get("debut", "")), "fin": str(e.get("fin", "")),
            "enCours": bool(e.get("en_cours")),
            "fr": {"titre": e["poste"], "lieu": e["organisation"], "puces": puces},
            "en": {"titre": trad("experiences", e["id"], "poste", e["poste"]),
                   "lieu": trad("experiences", e["id"], "organisation", e["organisation"]),
                   "puces": trad("experiences", e["id"], "puces", puces)},
        })
    experiences.sort(key=lambda e: e["debut"])
    projets = []
    for e in p["projets"]:
        if not visible(e) or e["id"] in MASQUES_PORTFOLIO:
            continue
        lien = LIENS_PUBLICS.get(e["id"])
        projets.append({
            "id": e["id"], "techno": e.get("techno", []), "lien": lien,
            "fr": {"titre": e["titre"], "role": e["role"], "texte": " ".join(e["texte"].split()),
                   "preuve": "Code public" if lien else PREUVE_PRIVEE["fr"]},
            "en": {"titre": trad("projets", e["id"], "titre", e["titre"]),
                   "role": trad("projets", e["id"], "role", e["role"]),
                   "texte": trad("projets", e["id"], "texte", e["texte"]),
                   "preuve": "Public code" if lien else PREUVE_PRIVEE["en"]},
        })
    engagements = [
        {"id": e["id"], "enCours": bool(e.get("en_cours")), "debut": str(e.get("debut", "")),
         "fr": {"role": e["role"], "lieu": e["organisation"]},
         "en": {"role": trad("engagements", e["id"], "role", e["role"]),
                "lieu": trad("engagements", e["id"], "organisation", e["organisation"])}}
        for e in p["engagements"] if visible(e)
    ]
    ids = {x["id"] for x in formation + experiences + projets + engagements}
    competences = []
    for c in p["competences"]:
        liens = [x for x in c["preuves"] if x in ids]
        if c.get("statut") == "a_confirmer" or not liens:
            continue
        competences.append({"id": c["id"], "nom": {"fr": c["nom"], "en": en.get("competences", {}).get(c["id"], c["nom"])},
                            "cat": {"fr": c["cat"], "en": en["categories"].get(c["cat"], c["cat"])},
                            "preuves": liens})
    sortie = {
        "identite": {"nom": i["nom"], "ville": i["ville"], "email": i["email"],
                     "linkedin": "https://www." + i["linkedin"].removeprefix("www."),
                     "github": "https://" + i["github"]},
        "titre": {"fr": p["cibles"]["general"]["titre"], "en": "Computer Engineering student"},
        "accroche": {"fr": " ".join(p["cibles"]["general"]["accroche"].split()),
                     "en": " ".join(en["accroche"].split())},
        "formation": formation, "experiences": experiences, "projets": projets,
        "engagements": engagements, "competences": competences,
        "langues": {"fr": [f"{x['langue']} ({x['niveau']})" for x in p["langues"]],
                    "en": [en["langues"].get(x["langue"], x["langue"]) for x in p["langues"]]},
        "cv": [],
        "echecs": {**echecs(), "brillants": BRILLANTS},
    }
    dest = ICI / "public" / "cv"
    dest.mkdir(parents=True, exist_ok=True)
    for profil in PROFILS_CV:
        src = CARRIERE / "cv" / profil / "web" / f"CV_Rassoul_NAME_{profil}.pdf"  # version sans téléphone
        if src.exists():
            shutil.copy2(src, dest / src.name)
            sortie["cv"].append({"profil": profil, "fichier": f"/cv/{src.name}"})
    texte = json.dumps(sortie, ensure_ascii=False, indent=1)
    assert "/home/" not in texte and i["telephone"] not in texte, "donnée privée dans l'export"
    bas = texte.lower()
    assert not [m for m in prive["interdits"] if m in bas], "nom interdit dans l'export"
    import subprocess
    for f in dest.glob("*.pdf"):
        brut = subprocess.run(["pdftotext", str(f), "-"], capture_output=True, text=True).stdout
        assert i["telephone"].replace(" ", "")[-6:] not in brut.replace(" ", ""), f"téléphone présent dans {f.name}"
        assert not [m for m in prive["interdits"] if m in brut.lower()], f"nom interdit dans {f.name}"
    (ICI / "src" / "donnees" / "profil.json").write_text(texte, encoding="utf-8")
    print(f"{len(experiences)} expériences, {len(projets)} projets, {len(competences)} compétences, {len(sortie['cv'])} CV")


if __name__ == "__main__":
    main()

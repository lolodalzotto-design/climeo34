#!/usr/bin/env python3
"""Vérifie le barème split Climeo34 : 140 € puis 90 € par split supplémentaire.

Totaux : n=1 → 140, n=2 → 230, n=3 → 320, n=4 → 410.
Le script échoue si une ancienne référence tarifaire (120 / 210 / 300)
subsiste, ou si un chiffre hors tarif (CSS, images, dépannage 200 €,
diagnostic +30 €) a été modifié dans les fichiers contrôlés.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {1: 140, 2: 230, 3: 320, 4: 410, 12: 1130}

STALE = [
    r"120 €",
    r"120€",
    r"120&nbsp;€",
    r"120 euros",
    r"210 €",
    r"210&nbsp;€",
    r"300 €",
    r"300&nbsp;€",
    r'"price": "120"',
    r'"price": "210"',
    r'"price": "300"',
    r"<strong>120</strong><span>€",
    r"<strong>210</strong><span>€",
    r"<strong>300</strong><span>€",
    r"120 \+ \((?:splitCount|nbSplits) - 1\) \* 90",
    r"\* 190",
    r"190 €",
    r"190€",
]

FORMULA_FILES = (
    "index.html",
    "apercu-vapeur.html",
    "apercu-vapeur-v2.html",
)
OFFER_FILES = (
    "nettoyage-clim-montpellier/index.html",
    "nettoyage-clim-carnon/index.html",
    "nettoyage-clim-palavas/index.html",
    "nettoyage-clim-la-grande-motte/index.html",
)
PRESERVED = {
    "index.html": (
        "padding: 120px",
        'content="1200"',
        "left:120%",
        "90 € TTC par split supplémentaire",
    ),
    "apercu-vapeur.html": ("+30 €", "90 € par split supplémentaire"),
    "apercu-vapeur-v2.html": ("+30 €", "90 € par split supplémentaire"),
    "depannage-clim-montpellier/index.html": ('"price": "200"', "200€"),
}


def price(n: int) -> int:
    if n < 1:
        raise ValueError(n)
    return 140 + (n - 1) * 90


def site_texts() -> list[tuple[str, str]]:
    skip = {".git", "node_modules", ".claude"}
    found = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in {".html", ".txt", ".js", ".xml", ".md", ".json"}:
            continue
        if any(part in skip for part in path.parts):
            continue
        found.append((str(path.relative_to(ROOT)), path.read_text(encoding="utf-8")))
    return found


def main() -> int:
    errors: list[str] = []

    for n, total in EXPECTED.items():
        got = price(n)
        if got != total:
            errors.append(f"formule n={n}: {got} au lieu de {total}")

    texts = dict(site_texts())
    for rel, text in texts.items():
        for pat in STALE:
            for match in re.finditer(pat, text):
                line = text[: match.start()].count("\n") + 1
                errors.append(f"référence périmée {rel}:{line} /{pat}/")

    formula = re.compile(r"140 \+ \((splitCount|nbSplits) - 1\) \* 90")
    for rel in FORMULA_FILES:
        text = texts[rel]
        found = formula.findall(text)
        needed = ["nbSplits"]
        if rel != "apercu-vapeur.html":
            needed.append("splitCount")
        for name in needed:
            if name not in found:
                errors.append(f"formule {name} absente de {rel}")
        for n, total in ((1, 140), (2, 230), (3, 320), (4, 410)):
            for var in found:
                local = {var: n}
                got = eval(f"140 + ({var} - 1) * 90", {}, local)  # noqa: S307 — expression figée
                if got != total:
                    errors.append(f"{rel} {var} n={n} → {got}")

    for rel in OFFER_FILES:
        text = texts[rel]
        for amount in ("140", "230", "320"):
            token = f'"price": "{amount}"'
            if token not in text:
                errors.append(f"{rel} sans {token}")
            card = f"<strong>{amount}</strong><span>€</span>"
            if card not in text:
                errors.append(f"{rel} sans carte {card}")
        if "1 split : 140 € TTC, 2 splits : 230 € TTC, 3 splits : 320 € TTC" not in text:
            errors.append(f"{rel} FAQ/JSON-LD sans le trio 140/230/320")

    home = texts["index.html"]
    if 'id="calc-price">140 €' not in home or 'value="140 € TTC"' not in home:
        errors.append("calculateur d'accueil : valeur initiale différente de 140 €")
    if "230 € pour deux splits et 320 € pour trois splits" not in home:
        errors.append("accueil : totaux 2 et 3 splits absents")
    if "puis 90 € TTC par split supplémentaire" not in home and "90 € TTC par split supplémentaire" not in home:
        errors.append("accueil : le palier 90 € a disparu")

    blog = texts["blog/prix-entretien-climatisation-montpellier.html"]
    for snippet in (
        "140 € TTC pour le premier split puis 90 € TTC par split supplémentaire",
        "1 split : 140 € TTC",
        "2 splits : 230 € TTC",
        "3 splits : 320 € TTC",
    ):
        if snippet not in blog:
            errors.append(f"article prix sans {snippet!r}")

    for rel, snippets in PRESERVED.items():
        text = texts[rel]
        for snippet in snippets:
            if snippet not in text:
                errors.append(f"élément hors tarif perdu dans {rel}: {snippet!r}")

    if errors:
        print(f"{len(errors)} échec(s)")
        for err in errors:
            print(" -", err)
        return 1

    print("OK barème 140 + 90 × (n-1)")
    for n in (1, 2, 3, 4):
        print(f"  {n} split(s) = {price(n)} €")
    print(f"  {len(texts)} fichiers inspectés, aucune référence 120/210/300 € tarifaire")
    return 0


if __name__ == "__main__":
    sys.exit(main())

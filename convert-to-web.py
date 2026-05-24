#!/usr/bin/env python3
"""
Outil de conversion d'images au format web (WebP + AVIF optionnel).
Usage :
  python3 convert-to-web.py                    # convertit tout le projet
  python3 convert-to-web.py image.jpg          # convertit un fichier
  python3 convert-to-web.py images/            # convertit un dossier
  python3 convert-to-web.py -q 80 -r image.png # qualité 80, remplace l'original
"""

import argparse
import os
import sys
from pathlib import Path
from PIL import Image

SUPPORTED = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif"}
SKIP_DIRS = {".git", "node_modules", "__pycache__"}


def human_size(n: int) -> str:
    for unit in ("o", "Ko", "Mo", "Go"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.1f} To"


def convert_file(src: Path, quality: int, replace: bool, dry_run: bool) -> dict:
    dst = src.with_suffix(".webp")

    if dry_run:
        print(f"  [dry-run] {src} → {dst}")
        return {"skipped": True}

    try:
        with Image.open(src) as img:
            # Préserve la transparence pour PNG
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")

            orig_size = src.stat().st_size
            img.save(dst, "WEBP", quality=quality, method=6)
            new_size = dst.stat().st_size
            saved = orig_size - new_size
            ratio = (1 - new_size / orig_size) * 100

        if replace:
            src.unlink()

        print(f"  ✓ {src.name} → {dst.name}  "
              f"{human_size(orig_size)} → {human_size(new_size)}  "
              f"({ratio:+.1f}%)")
        return {"orig": orig_size, "new": new_size, "saved": saved}

    except Exception as e:
        print(f"  ✗ {src.name}: {e}", file=sys.stderr)
        return {"error": True}


def collect_images(path: Path) -> list[Path]:
    if path.is_file():
        return [path] if path.suffix.lower() in SUPPORTED else []
    files = []
    for root, dirs, names in os.walk(path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in names:
            p = Path(root) / name
            if p.suffix.lower() in SUPPORTED:
                # Ignore si un .webp du même nom existe déjà
                if not p.with_suffix(".webp").exists():
                    files.append(p)
    return sorted(files)


def main():
    parser = argparse.ArgumentParser(
        description="Convertit les images en WebP pour le web."
    )
    parser.add_argument(
        "targets",
        nargs="*",
        default=["."],
        help="Fichiers ou dossiers à convertir (défaut : répertoire courant)",
    )
    parser.add_argument(
        "-q", "--quality",
        type=int,
        default=85,
        metavar="N",
        help="Qualité WebP 1-100 (défaut : 85)",
    )
    parser.add_argument(
        "-r", "--replace",
        action="store_true",
        help="Supprime l'original après conversion",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche ce qui serait converti sans rien faire",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Ignore les images dont un .webp existe déjà (défaut : activé)",
    )
    args = parser.parse_args()

    images: list[Path] = []
    for t in args.targets:
        p = Path(t)
        if not p.exists():
            print(f"Chemin introuvable : {t}", file=sys.stderr)
            continue
        images.extend(collect_images(p))

    if not images:
        print("Aucune image à convertir.")
        return

    print(f"\n{len(images)} image(s) à convertir → WebP (qualité {args.quality})\n")

    totals = {"orig": 0, "new": 0, "saved": 0, "ok": 0, "err": 0}
    for img in images:
        result = convert_file(img, args.quality, args.replace, args.dry_run)
        if "error" in result:
            totals["err"] += 1
        elif not result.get("skipped"):
            totals["ok"] += 1
            totals["orig"] += result["orig"]
            totals["new"] += result["new"]
            totals["saved"] += result["saved"]

    if not args.dry_run and totals["ok"]:
        ratio = (1 - totals["new"] / totals["orig"]) * 100 if totals["orig"] else 0
        print(f"\n{'─'*50}")
        print(f"  Converties : {totals['ok']}  |  Erreurs : {totals['err']}")
        print(f"  Avant      : {human_size(totals['orig'])}")
        print(f"  Après      : {human_size(totals['new'])}")
        print(f"  Économisé  : {human_size(totals['saved'])} ({ratio:.1f}%)")
        print(f"{'─'*50}\n")


if __name__ == "__main__":
    main()

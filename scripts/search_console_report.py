#!/usr/bin/env python3
"""Export Search Console performance and inspect sitemap URLs.

Authentication uses a Google service-account JSON value supplied through
GSC_SERVICE_ACCOUNT_JSON. The credential is never written to disk.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Iterable
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
DEFAULT_SITE = "sc-domain:climeo34.fr"
DEFAULT_SITEMAP = "https://climeo34.fr/sitemap.xml"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", default=os.getenv("GSC_SITE_URL", DEFAULT_SITE))
    parser.add_argument("--sitemap", default=os.getenv("GSC_SITEMAP_URL", DEFAULT_SITEMAP))
    parser.add_argument("--days", type=int, default=90)
    parser.add_argument("--output", type=Path, default=Path("seo-reports/search-console/latest"))
    parser.add_argument("--skip-inspection", action="store_true")
    return parser.parse_args()


def credentials_from_env():
    raw = os.getenv("GSC_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise RuntimeError("Le secret GSC_SERVICE_ACCOUNT_JSON est absent.")
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("GSC_SERVICE_ACCOUNT_JSON ne contient pas un JSON valide.") from exc
    return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)


def fetch_sitemap(url: str) -> list[str]:
    request = Request(url, headers={"User-Agent": "Climeo34-SEO-Audit/1.0"})
    with urlopen(request, timeout=30) as response:
        root = ElementTree.fromstring(response.read())
    namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    urls = [node.text.strip() for node in root.findall(f"{namespace}url/{namespace}loc") if node.text]
    if not urls:
        raise RuntimeError(f"Aucune URL trouvée dans {url}")
    return urls


def query_all(service, site: str, start: str, end: str, dimensions: list[str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    start_row = 0
    while True:
        body = {
            "startDate": start,
            "endDate": end,
            "dimensions": dimensions,
            "rowLimit": 25000,
            "startRow": start_row,
            "dataState": "final",
        }
        batch = service.searchanalytics().query(siteUrl=site, body=body).execute().get("rows", [])
        rows.extend(batch)
        if len(batch) < 25000:
            return rows
        start_row += len(batch)


def write_csv(path: Path, headers: list[str], rows: Iterable[list[Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(headers)
        writer.writerows(rows)


def export_performance(service, site: str, start: str, end: str, output: Path) -> tuple[list, list]:
    pages = query_all(service, site, start, end, ["page"])
    queries = query_all(service, site, start, end, ["query", "page"])
    metric_headers = ["clicks", "impressions", "ctr", "position"]
    write_csv(
        output / "pages.csv",
        ["page", *metric_headers],
        ([*row.get("keys", []), row.get("clicks", 0), row.get("impressions", 0), row.get("ctr", 0), row.get("position", 0)] for row in pages),
    )
    write_csv(
        output / "queries.csv",
        ["query", "page", *metric_headers],
        ([*row.get("keys", []), row.get("clicks", 0), row.get("impressions", 0), row.get("ctr", 0), row.get("position", 0)] for row in queries),
    )
    return pages, queries


def inspect_urls(service, site: str, urls: list[str], output: Path) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for url in urls:
        try:
            response = service.urlInspection().index().inspect(
                body={"inspectionUrl": url, "siteUrl": site, "languageCode": "fr-FR"}
            ).execute()
            status = response.get("inspectionResult", {}).get("indexStatusResult", {})
            results.append({
                "url": url,
                "verdict": status.get("verdict", "INCONNU"),
                "coverage": status.get("coverageState", ""),
                "indexing": status.get("indexingState", ""),
                "robots": status.get("robotsTxtState", ""),
                "last_crawl": status.get("lastCrawlTime", ""),
                "google_canonical": status.get("googleCanonical", ""),
                "user_canonical": status.get("userCanonical", ""),
            })
        except Exception as exc:  # keep the remaining URL checks useful
            results.append({"url": url, "verdict": "ERREUR", "coverage": str(exc), "indexing": "", "robots": "", "last_crawl": "", "google_canonical": "", "user_canonical": ""})
    headers = ["url", "verdict", "coverage", "indexing", "robots", "last_crawl", "google_canonical", "user_canonical"]
    write_csv(output / "indexation.csv", headers, ([row[h] for h in headers] for row in results))
    return results


def write_summary(output: Path, site: str, start: str, end: str, sitemap_count: int, pages: list, queries: list, inspections: list) -> None:
    clicks = sum(float(row.get("clicks", 0)) for row in pages)
    impressions = sum(float(row.get("impressions", 0)) for row in pages)
    passed = sum(row.get("verdict") == "PASS" for row in inspections)
    failed = sum(row.get("verdict") not in {"PASS", ""} for row in inspections)
    text = f"""# Rapport Google Search Console — Climeo34

- Période : {start} au {end}
- Propriété : `{site}`
- URL dans le sitemap : {sitemap_count}
- Pages ayant généré des impressions : {len(pages)}
- Requêtes/page recensées : {len(queries)}
- Clics organiques : {clicks:.0f}
- Impressions organiques : {impressions:.0f}
- URL validées par l’inspection : {passed}
- URL à examiner ou en erreur : {failed}

Les fichiers CSV du même dossier contiennent le détail. Une absence dans
`pages.csv` signifie seulement qu’aucune impression n’a été renvoyée sur la
période ; `indexation.csv` est la source à utiliser pour l’état d’indexation.
"""
    (output / "summary.md").write_text(text, encoding="utf-8")


def main() -> int:
    args = parse_args()
    if args.days < 2:
        raise RuntimeError("--days doit être supérieur ou égal à 2.")
    end = date.today() - timedelta(days=2)  # Search Console data can lag
    start = end - timedelta(days=args.days - 1)
    args.output.mkdir(parents=True, exist_ok=True)
    credentials = credentials_from_env()
    service = build("searchconsole", "v1", credentials=credentials, cache_discovery=False)
    urls = fetch_sitemap(args.sitemap)
    pages, queries = export_performance(service, args.site, start.isoformat(), end.isoformat(), args.output)
    inspections = [] if args.skip_inspection else inspect_urls(service, args.site, urls, args.output)
    write_summary(args.output, args.site, start.isoformat(), end.isoformat(), len(urls), pages, queries, inspections)
    print(f"Rapport généré dans {args.output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        raise SystemExit(1)

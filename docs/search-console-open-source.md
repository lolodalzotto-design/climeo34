# Connecteur Search Console open source — Climeo34

Ce connecteur interroge directement les API officielles Google Search Console.
Il n’ajoute aucune balise au site et n’utilise aucun service payant tiers.

## Autorisation unique

1. Dans Google Cloud Console, créer ou sélectionner un projet.
2. Activer **Google Search Console API** ; elle couvre aussi l’inspection des URL.
3. Créer un compte de service et télécharger sa clé JSON.
4. Dans Google Search Console, ouvrir la propriété `climeo34.fr`, puis
   **Paramètres > Utilisateurs et autorisations > Ajouter un utilisateur**.
5. Ajouter l’adresse e-mail du compte de service avec l’autorisation complète.
6. Dans GitHub, ouvrir le dépôt `lolodalzotto-design/climeo34`, puis
   **Settings > Secrets and variables > Actions > New repository secret**.
7. Nommer le secret `GSC_SERVICE_ACCOUNT_JSON` et coller le contenu complet
   du fichier JSON. Ne jamais ajouter ce fichier au dépôt.

## Exécution

Le workflow **Rapport SEO Search Console** peut être lancé manuellement dans
l’onglet Actions. Il s’exécute aussi chaque lundi matin et produit une archive
temporaire conservée pendant un jour, sans publier les données dans le dépôt :

- `pages.csv` : clics, impressions, CTR et position par page ;
- `queries.csv` : mêmes métriques par requête et page ;
- `indexation.csv` : verdict Google pour chaque URL du sitemap ;
- `summary.md` : synthèse lisible.

Les données portent par défaut sur les 90 derniers jours terminés. Le script
attend deux jours avant la date de fin afin de limiter les données partielles.

## Sécurité

La clé du compte de service reste dans les secrets chiffrés GitHub Actions.
Le script utilise uniquement l’accès Search Console en lecture seule. Les
requêtes et statistiques ne sont jamais enregistrées dans le dépôt public.

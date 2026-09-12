# climeo34

## Avis Google (`data/google-reviews.json`)

La section « Avis » du site charge en priorité un cache statique
(`data/google-reviews.json`), régénéré chaque jour par le workflow
[`update-google-reviews.yml`](.github/workflows/update-google-reviews.yml).
C'est la seule source qui garantit un tri par date réelle (les repos
navigateur — appel direct puis librairie JS Places — ne trient pas par date
et se limitent aux avis jugés « pertinents » par Google).

### État actuel : le workflow échoue depuis sa création

Toutes les exécutions du workflow échouent avec :

```
Google API a répondu status=REQUEST_DENIED
API keys with referer restrictions cannot be used with this API.
```

Cause : le secret `GOOGLE_PLACES_API_KEY` du dépôt contient la même clé que
celle utilisée côté navigateur dans `index.html`, restreinte par
« référent HTTP » (`climeo34.fr`). Google refuse catégoriquement ce type de
clé pour un appel serveur à cette API, quel que soit l'en-tête `Referer`
envoyé. Tant que ce secret n'est pas corrigé, `data/google-reviews.json`
n'existe jamais et le site retombe sur les repos navigateur (avis non triés
par date).

### Corriger le secret `GOOGLE_PLACES_API_KEY`

1. Dans [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   créer une **nouvelle** clé API (ne pas réutiliser celle du site).
2. La restreindre uniquement par API : **Places API** (legacy) — pas de
   restriction d'application/référent (ou, si possible, une restriction par
   adresses IP).
3. Dans le dépôt GitHub : **Settings → Secrets and variables → Actions**,
   mettre à jour le secret `GOOGLE_PLACES_API_KEY` avec cette nouvelle clé.
4. Relancer le workflow manuellement (**Actions → Update Google reviews
   cache → Run workflow**) pour vérifier que `data/google-reviews.json` est
   bien généré et commité.

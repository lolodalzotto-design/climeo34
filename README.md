# climeo34

Site vitrine [climeo34.fr](https://climeo34.fr).

## Cache des avis Google

`index.html` charge d’abord `/data/google-reviews.json` (même origine, pas de CORS).
Le workflow **Update Google reviews cache** régénère ce fichier chaque jour à 05:00 UTC,
et à la demande.

### Configurer le secret `GOOGLE_PLACES_API_KEY`

Ce n’est **pas** la clé navigateur déjà présente dans `index.html` (restriction
« référent HTTP » : Google la refuse pour tout appel serveur).

1. Ouvrir [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Activer **Places API (New)** sur le projet (APIs & Services → Library).
   Obligatoire : le job appelle `places.googleapis.com/v1/places/{id}`,
   pas l’ancien Place Details. L’ancienne « Places API » +
   `reviews_sort=newest` répond `NOT_FOUND` pour cette fiche.
3. Créer une clé API **serveur** :
   - restrictions d’API : `Places API (New)` (et éventuellement `Places API`) ;
   - **aucune** restriction « Sites web (référents HTTP) » ;
   - restriction par adresse IP possible si vous en avez une fixe.
4. Dans GitHub : dépôt `lolodalzotto-design/climeo34` →
   **Settings → Secrets and variables → Actions → New repository secret**.
5. Nom : `GOOGLE_PLACES_API_KEY`. Valeur : la clé serveur.

### Lancer une mise à jour manuelle

1. Onglet **Actions**.
2. Workflow **Update Google reviews cache**.
3. **Run workflow** (branche `main`).

Si l’appel API échoue, le JSON déjà commité est conservé : le bandeau du site
ne redevient pas une 404.

### Place ID

Les liens du site

- https://maps.app.goo.gl/kad8NLF7N8Bi8GSPA
- https://maps.app.goo.gl/LucxK36ZqRZLxfrQ9

redirigent vers la même fiche
`Climeo34 - Nettoyage Climatisation Montpellier et Hérault`,
CID `0x8d5a86d7c09bdba1:0x6d71c0fab6a83ff2`, soit
`ChIJodubwNeGWo0R8j-otvrAcW0`.

Cause racine du `NOT_FOUND` Actions : **mauvais endpoint**, pas un ID faux
et pas un secret manquant.

| Identifiant | Accepté comme `place_id` ? |
|---|---|
| `ChIJodubwNeGWo0R8j-otvrAcW0` | Oui — Place Details **(New)** uniquement |
| CID `7886296605541285874` / hex `0x8d5a86d7c09bdba1:0x6d71c0fab6a83ff2` | Non (`INVALID_ARGUMENT`) |
| ftid `/g/11z4c0c7p5` | Non (`INVALID_ARGUMENT`) |

Places API (New) renvoie `pureServiceAreaBusiness: true` pour cette fiche.
Place Details historique (`maps.googleapis.com/.../details/json`) répond
`NOT_FOUND` pour le même ChIJ. Changer le ChIJ pour la même chaîne ne
change rien : il faut l’endpoint New.

Ne pas substituer un homonyme (Climmed34, Climeo Energies, …).

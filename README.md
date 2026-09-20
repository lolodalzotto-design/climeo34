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
   L’ancienne « Places API » est optionnelle : elle permet `reviews_sort=newest`,
   mais ce Place ID peut répondre `NOT_FOUND` sur ce point d’accès.
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

C’est une **entreprise de zone de service** (pas de vitrine physique).
Places API (New) avec `includePureServiceAreaBusinesses=true` confirme
cette fiche (`climeo34.fr`, 5,0 / 53 avis). L’API Places historique
répond `NOT_FOUND` pour le même ID : ce n’est pas un mauvais identifiant,
c’est pour ça que le workflow appelle **Places API (New)** en premier.

Ne pas substituer un homonyme (Climmed34, Climeo Energies, …).

## FichesDeLecture

Application web dockerisée (LAN) pour créer de jolies fiches de lecture à partir de **templates**.

### Fonctionnalités
- **Choix d’un template** (page d’accueil)
- **Formulaire dynamique** selon le template + **aperçu en direct**
- **Personnalisation**: police + taille par zone, couleurs du template
- **Sauvegarde/reprise**: fichiers **JSON** persistés
- **Export PDF**: page “Impression” + `window.print()`

### Démarrage (Docker)
Pré-requis: Docker + Docker Compose.

```bash
docker compose up --build
```

Puis ouvrir:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api/templates`

Si le port 3000 est déjà pris, tu peux changer le port hôte:

```bash
API_HOST_PORT=3001 docker compose up --build
```

### Accès sur le réseau local
L’app écoute sur `0.0.0.0`. Depuis un autre appareil du LAN, utiliser l’IP de la machine hôte, ex:
- `http://192.168.1.10:5173`

### Données persistées
Les fiches sont stockées sur l’hôte dans `./data/` (monté dans le conteneur API).


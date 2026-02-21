# SolarInverter — Frontend

Interface web de visualisation des statistiques de production d'un onduleur solaire.
Consomme une API REST backend exposée sur `https://solar-back.kaminski.lu/api`.

## Stack

- **Angular 19** — Standalone Components, nouveau control-flow (`@if` / `@for`)
- **Angular Material 19** — composants MDC (datepicker, boutons, icônes)
- **RxJS 7** — gestion des flux HTTP et événements inter-composants
- **TypeScript 5.8**
- Graphique en barres : **SVG natif** (zéro dépendance externe de rendu)
- Formatage de dates : **API native** `Intl` / `toLocaleDateString`

## Commandes

```bash
npm start        # Serveur de développement → http://localhost:4200
npm run build    # Build de production → dist/solarInverter/
npm test         # Tests unitaires (Karma / Jasmine)
npm run lint     # ESLint
```

## Architecture

Application single-page sans routeur. Les deux composants sont rendus directement dans `AppComponent`.

```
AppComponent
├── LiveStatComponent   → GET /livedata
│     Cartes de stats : production du jour, 7j, 30j, année, facturable
│     Spinner inline pendant le chargement ; icône ✕ si valeur nulle
│
└── BarChartComponent   → GET /daily-prod?start=&end=
      Graphique SVG responsive (ResizeObserver)
      Sélecteurs de période, boutons Actualiser / Exporter
      Tooltip au survol (desktop) ou au tap (mobile, auto-dismiss 3s)
```

**Flux de données :**
1. `LiveStatComponent` interroge `/livedata` à l'init et sur chaque rafraîchissement
2. La valeur `dayProd` est émise via `ToolsBoxService`
3. `BarChartComponent` la reçoit et ne rappelle `/daily-prod` que si elle a changé

## Points notables

- `ToolsBoxService` sert de bus d'événements entre les deux composants via des `EventEmitter` Angular
- Le backend base URL est codé en dur dans `src/app/services/callApi.ts`
- Locale Material : `fr` (format de date français)
- Build de production : ~550 kB JS / ~123 kB gzippé

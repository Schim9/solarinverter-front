# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build → dist/solarInverter/
npm test           # Unit tests via Karma/Jasmine
npm run lint       # TSLint
npm run e2e        # End-to-end tests via Protractor
ng build --prod    # Production build (uses environment.prod.ts)
```

## Architecture

Single-page Angular 13 app that displays solar inverter production statistics. No routing is used — both components render directly in `AppComponent`.

**Data flow:**
1. `LiveStatComponent` polls `/livedata/` on init and on refresh events → emits `dayProd` via `ToolsBoxService.fireReceiveUpdatedValue`
2. `BarChartComponent` subscribes to that emitter and conditionally re-fetches `/daily-prod?start=&end=` if the day's production value has changed
3. `ToolsBoxService` acts as an event bus between the two components using Angular `EventEmitter`s (not a subject/store)

**Key files:**
- `src/app/services/callApi.ts` — centralized HTTP wrapper (`CallApi` service); backend base URL is hardcoded as `https://solar-back.kaminski.lu/api`
- `src/app/services/toolbox.ts` — `ToolsBoxService`, cross-component event bus (refresh trigger + data update trigger)
- `src/app/barChart/barChart.component.ts` — fetches date-range production data, renders Chart.js bar chart; supports date picker and JSON export
- `src/app/LiveStat/liveStat.component.ts` — fetches current live stats (day/week/month/year production)

**Locale:** `MAT_DATE_LOCALE` is set to `'fr'` (French), affecting Angular Material date picker formatting.

**Charting:** Uses Chart.js v2 (not v3+). The chart instance is created as `new Chart('canvas', ...)` — it targets the `<canvas id="canvas">` element directly without a wrapper directive.

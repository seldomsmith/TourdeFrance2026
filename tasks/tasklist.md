# Tour De France 2026 Tracker - Task List

- [x] Create static app shell and styling system (Vanilla CSS with CSS variables, light/dark themes)
- [x] Prepare comprehensive static dataset (21 stages starting from Barcelona, 23 teams, rider lists, mock stats generator for simulation)
- [x] Build key components:
  - [x] App Navbar, Tab controls, Theme Toggle
  - [x] Stage Roster & Profile Cards (Elevation & Climbs breakdown)
  - [x] Teams & Riders Grid (with Jersey dots and hover cards)
  - [x] Breakaway Analytics Dashboard (combative kilometers, breakaway predictions)
- [x] Integrate Visuals & Charts (Recharts/SVG):
  - [x] GC Top 20 interactive line chart with rider toggles
  - [x] Horizontal bar charts for Sprint/Points and Mountains jerseys
  - [x] White jersey young rider gaps
- [x] Integrate Stage Map (Mock Mapbox rendering and routing coordinates)
- [x] Build Step-by-Step Stage Simulator Engine (client-side state machine updating all datasets when advancing)
- [x] Implement scraper/backend template files flagged for GitHub Codespace deployment

## Phase 2: Enhanced Interactivity
- [x] Add dedicated White Jersey (Maillot Blanc) gap chart in Visualizations
- [x] Implement interactive mountain pass flags on SVG stage elevation charts
- [x] Create a chronological "DNF Wall" component showing rider abandonments and reasons
- [x] Animate a cyclist icon moving along the canvas route map as stages progress

## Phase 3: Advanced Analytics Visuals
- [x] Add Altitude vs. Power Degradation Curve comparison
- [x] Implement Peloton Time-Spread Histogram
- [x] Create Summit Finish Climb Overlay comparisons
- [x] Add Mountain Category Distribution Treemap
- [x] Build Breakaway Composition Flow (Sankey-style diagram)
- [x] Implement Team Value Scatterplot (Budget vs. Standing)
- [x] Build Jersey Ownership Timeline Ribbon

## Phase 4: Live Sync & Rider Drilldown
- [x] Build Rider Search & Details Overlay Modal (stage-by-stage progression charts)
- [x] Write production Cheerio Web Scraper in `codespace_backend/scraper.js`
- [x] Create Live Sync UI options in Stage Control Panel to pull API standings

## Phase 5: Cloud Deployment & Codespace Packaging
- [x] Configure `.devcontainer/devcontainer.json` for automated container builds & ports mapping
- [x] Set up root-level `package.json` for unified dev execution (`concurrently` + `sirv`)
- [x] Dockerize application with multi-stage `Dockerfile` serving both API + static UI
- [x] Adapt `codespace_backend/server.js` and `app.js` to run in Cloud Run context without configuration

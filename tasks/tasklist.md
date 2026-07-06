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

## Phase 6: Glassmorphism & Depth Stack (Visual Sophistication)
- [x] Add ambient blurry background gradient orbs in `style.css`
- [x] Upgrade `.team-card`, `.climb-card`, `.chart-wrapper`, `.stages-list`, `.stage-profile-detail`, and `.modal-content` to glass style
- [x] Add `jerseys-container` grid styling for horizontal 4-jersey layout
- [x] Implement Jersey Badge Hero Sections with radial glows, display fonts, and floating jersey SVGs
- [x] Track mouse movement on the 2D map canvas in `OverviewTab` to find close stage nodes
- [x] Render the interactive glassmorphic tooltip with a mini SVG elevation profile for the hovered stage
- [x] Wire up clicking a map node to set the active tab to stages and select the stage
- [x] Verify local rendering on Port 5000 and ensure UI elegance

## Phase 7: Fantasy Tab User Auth & Persistent Storage
- [x] Create portable JSON database file-backed model in `codespace_backend/db.js`
- [x] Implement secure salting/hashing & token generator using Node native `crypto`
- [x] Write REST authentication API endpoints in `codespace_backend/server.js`
- [x] Update frontend navbar to show "Fantasy League" tab option
- [x] Build login and registration form inputs inside `app.js` under Fantasy Tab
- [x] Hook frontend buy/sell transfers, budgets, and score history syncing to account
- [x] Verify local database writes, page sessions, and user transitions

## Phase 8: 3D Mapbox Terrain Route Visualizer
- [x] Implement Mapbox GL map initialization hook in `app.js` OverviewTab
- [x] Add 3D terrain DEM terrain source, sky, and exaggeration loading
- [x] Build GeoJSON route rendering layers for completed, active, and upcoming stages
- [x] Render 3D custom markers for Stage Starts, Finishes, and Summit Peaks
- [x] Build map controls toolbar: Pitch/Bearing sliders, 3D Horizon Preset, and Fullscreen toggle
- [x] Connect stage nodes clicking to trigger map flyTo transitions and open stage details
- [x] Validate Mapbox loading, local storage token overrides, and mobile responsive controls

## Phase 9: Breakaway Composition Sankey Flow
- [x] Build dynamic flow calculations separating rider specializations in breakaways
- [x] Construct custom SVG nodes and S-curve bezier path links representing flow streams
- [x] Implement path hover listeners, tooltip info updates, and highlight states
- [x] Integrate Sankey Flow card at the bottom of the Breakaway Tab
- [x] Verify chart rendering, responsive heights, and hover details on Port 5000

## Phase 10: Rider & Team Roster Updates
- [x] Update team names to official 2026 sponsors in data.js
- [x] Update rider rosters for Visma, UAE, Soudal-QuickStep, and Red Bull-Bora in data.js
- [x] Sync codespace_backend/scraper.js names with new rosters
- [x] Update app.js references to rider names in charts, values, and search defaults
- [x] Verify the application simulates and displays the updated roster list correctly

## Phase 11: Scraper Automation & Daily Live Sync
- [x] Add date-based auto-scrape scheduler checkAndAutoScrape() in codespace_backend/server.js
- [x] Verify that missing stages auto-scrape on startup based on the current calendar date
- [x] Verify results sync successfully from server database to frontend client



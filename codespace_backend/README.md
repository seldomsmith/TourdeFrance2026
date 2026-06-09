# TDF 2026 Scraper Backend Template

This directory contains the Node.js/Express server and web scraping script templates for when you migrate the application into a GitHub Codespace to connect to live 2026 Tour de France statistics.

## How it works

1. **Scraper (`scraper.js`)**:
   - Uses `cheerio` or `axios` to parse HTML daily statistics from cycling databases like ProCyclingStats or FirstCycling.
   - Saves current results to a database or local JSON file.

2. **Express Server (`server.js`)**:
   - Exposes REST API endpoints (`/api/stages`, `/api/riders`, `/api/results`) that the React frontend queries instead of running the simulator locally.

## Files included

- [server.js](file:///h:/Desktop/Antigravity%20Projects/The%20Tour%20De%20France/codespace_backend/server.js) - Express routing wrapper.
- [scraper.js](file:///h:/Desktop/Antigravity%20Projects/The%20Tour%20De%20France/codespace_backend/scraper.js) - Daily stats parser template.
- [package.json](file:///h:/Desktop/Antigravity%20Projects/The%20Tour%20De%20France/codespace_backend/package.json) - Node.js dependencies configuration.

## Deployment Instructions

When moving to GitHub Codespaces:
1. Open the repository in your Codespace.
2. Navigate to this directory: `cd codespace_backend`.
3. Install dependencies: `npm install`.
4. Launch the live scraper / API server: `npm run start` or `node server.js`.

// Express Web Server Template for Tour de France 2026 Live Scraper
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { runDailyScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend assets dynamically when in production
if (process.env.NODE_ENV === 'production' || process.env.PORT) {
  app.use(express.static(path.join(__dirname, '../')));
}

const DATA_FILE = path.join(__dirname, 'live_data.json');

// Helper to load live results database
function getLiveData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { currentStage: 0, riders: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// REST API Endpoints

// 1. Get current stage and standings
app.get('/api/results', (req, res) => {
  try {
    const data = getLiveData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database state" });
  }
});

// 2. Trigger scraper for a specific stage recap
app.post('/api/scrape/:stageId', async (req, res) => {
  const { stageId } = req.params;
  try {
    console.log(`[Scraper] Starting scrape query for Stage ${stageId}...`);
    const success = await runDailyScraper(parseInt(stageId));
    
    if (success) {
      res.json({ message: `Successfully scraped stage ${stageId} daily recap.` });
    } else {
      res.status(500).json({ error: "Scraping operation failed. Check logs." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend index.html for undefined routes in production context
if (process.env.NODE_ENV === 'production' || process.env.PORT) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
  });
}

// Start Web Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Tour de France 2026 API Server running on port ${PORT}`);
  console.log(`🔗 API routes: http://localhost:${PORT}/api/results`);
  console.log(`====================================================`);
});


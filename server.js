import express from 'express';
import { exec } from 'child_process';

const app = express();
const PORT = 3000;

// Endpoint to trigger scraper
app.get('/run-scraper', (req, res) => {
  console.log('🔁 Received request to run scraper...');

  // Run scraper.js as a subprocess
  exec('node scraper.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Scraper error: ${error.message}`);
      res.status(500).send('Scraper failed. Check terminal for details.');
      return;
    }

    if (stderr) {
      console.warn(`⚠️ Scraper stderr: ${stderr}`);
    }

    console.log(`✅ Scraper stdout: ${stdout}`);
    res.send('Scraper ran successfully');
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});

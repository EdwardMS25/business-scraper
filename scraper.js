import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Pretend to be a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    );

    // Go to the filtered business listings page
    await page.goto(
      'https://canada.businessesforsale.com/canadian/search/last-14-days-businesses-for-sale-in-british-columbia?Price.From=1M&Price.To=30M&Profit.From=250K&Profit.To=5M&Turnover.From=800K&Turnover.To=10M&PageSize=100',
      { waitUntil: 'networkidle2' }
    );

    // Take a screenshot for reference
    await page.screenshot({ path: 'page.png', fullPage: true });

    // Wait for listings to appear
    await page.waitForSelector('.listing-item', { timeout: 15000 });

    // Scrape the listings
    const listings = await page.evaluate(() => {
      const cards = document.querySelectorAll('.listing-item');
      return Array.from(cards).map(card => ({
        title: card.querySelector('h2')?.innerText?.trim() || null,
        location: card.querySelector('.listing-location')?.innerText?.trim() || null,
        price: card.querySelector('.price')?.innerText?.trim() || null,
        cashFlow:
          Array.from(card.querySelectorAll('.attribute-value')).find(el =>
            el.innerText.toLowerCase().includes('cash')
          )?.innerText?.trim() || null,
        revenue:
          Array.from(card.querySelectorAll('.attribute-value')).find(el =>
            el.innerText.toLowerCase().includes('revenue')
          )?.innerText?.trim() || null,
        url: card.querySelector('a')?.href || null
      }));
    });

    // Read screenshot file and convert to base64
    const screenshot = fs.readFileSync('page.png', { encoding: 'base64' });

    // Send to your n8n webhook
    await fetch('https://eddard.app.n8n.cloud/webhook/bc-listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listings,
        screenshot
      })
    });

    console.log(`✅ Sent ${listings.length} listings to n8n`);

    await browser.close();
  } catch (error) {
    console.error('❌ Scraper failed:', error.message);
  }
})();

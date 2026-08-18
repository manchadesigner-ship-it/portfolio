const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const sites = [
    { url: 'https://manchadesigner.com', name: 'beit-crm', width: 1280, height: 800 },
    { url: 'https://www.jsolar.com.br', name: 'j-solar', width: 1280, height: 800 },
    { url: 'https://www.andremaggiboff.com.br', name: 'andre-maggi', width: 1280, height: 800 },
  ];

  for (const site of sites) {
    console.log(`Capturing ${site.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: site.width, height: site.height });
    await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000)); // wait for animations/images
    const outPath = path.join(__dirname, `${site.name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`  -> ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log('Done!');
})();

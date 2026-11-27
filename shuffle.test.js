const test = require('node:test');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const path = require('path');

const launchOptions = { headless: true };
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH;
function launchBrowser() {
  return puppeteer.launch(launchOptions);
}

test('hero name is split into shuffle character wrappers', async () => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    const file = path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(`file:///${file}`, { waitUntil: 'load' });
    await page.waitForSelector('.hero h1 .shuffle-char-wrapper', { timeout: 2000 });
    const count = await page.$$eval('.hero h1 .shuffle-char-wrapper', els => els.length);
    assert.ok(count >= 11, `expected at least 11 wrappers, got ${count}`);
  } finally {
    await browser.close();
  }
});

test('shuffle keeps the hero title height unchanged', async () => {
  const browser = await launchBrowser();

  async function heightWithMotion(value) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value }]);
    const file = path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(`file:///${file}`, { waitUntil: 'load' });
    await new Promise(resolve => setTimeout(resolve, 1200));
    const height = await page.$eval('.hero h1', el => el.getBoundingClientRect().height);
    await page.close();
    return height;
  }

  try {
    const normal = await heightWithMotion('no-preference');
    const reduced = await heightWithMotion('reduce');
    assert.ok(
      Math.abs(normal - reduced) <= 8,
      `expected similar heights, got ${normal}px animated and ${reduced}px static`
    );
  } finally {
    await browser.close();
  }
});

test('forceMotion preview runs even with reduced motion', async () => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const file = path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(`file:///${file}?forceMotion=1`, { waitUntil: 'load' });
    await page.waitForSelector('.hero h1 .shuffle-char-wrapper', { timeout: 2000 });
  } finally {
    await browser.close();
  }
});

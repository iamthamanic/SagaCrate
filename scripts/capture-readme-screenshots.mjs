#!/usr/bin/env node
/**
 * capture-readme-screenshots — capture key SagaTree screens for README carousel.
 * Location: scripts/capture-readme-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });

const base = process.env.SAGATREE_BASE_URL || 'http://127.0.0.1:3004';
const user = process.env.E2E_USER || 'admin';
const password = process.env.E2E_PASSWORD || '1234';

const shots = [];

async function shot(page, name, label) {
  const file = resolve(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  shots.push({ name, label, file });
  console.log('✓', name, label);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot(page, '01-login', 'Login');

const loginTab = page.getByRole('tab', { name: 'Login' });
if (await loginTab.count()) {
  await loginTab.click();
  await page.getByPlaceholder('admin oder deine@email.de').fill(user);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Einloggen' }).click();
}

await page
  .getByRole('heading', { name: 'Dashboard' })
  .or(page.getByRole('button', { name: 'Dashboard' }))
  .first()
  .waitFor({ timeout: 45_000 });
await page.waitForTimeout(1000);
await shot(page, '02-dashboard', 'Dashboard');

const bib = page.getByRole('link', { name: /Bibliothek/i }).or(page.getByRole('button', { name: /Bibliothek/i }));
if (await bib.count()) {
  await bib.first().click();
  await page.waitForTimeout(1500);
  await shot(page, '03-bibliothek', 'Bibliothek');
}

// Character editor: edit first library character, else create flow
const editBtn = page.getByRole('button', { name: /Bearbeiten/i });
if (await editBtn.count()) {
  await editBtn.first().click();
  await page.waitForTimeout(1500);
  await shot(page, '04-character-editor', 'Charakter-Editor');
} else {
  const createBtn = page.getByRole('button', { name: /Charakter erstellen|Neuer Charakter/i });
  if (await createBtn.count()) {
    await createBtn.first().click();
    await page.waitForTimeout(800);
    const own = page.getByRole('button', { name: /Eigenen Charakter erstellen/i });
    if (await own.count()) {
      await own.first().click();
      await page.waitForTimeout(1200);
    }
    await shot(page, '04-character-editor', 'Charakter-Editor');
  }
}

const markt = page.getByRole('link', { name: /Marktplatz/i }).or(page.getByRole('button', { name: /Marktplatz/i }));
if (await markt.count()) {
  await markt.first().click();
  await page.waitForTimeout(1200);
  await shot(page, '05-marktplatz', 'Marktplatz');
}

// Session join surface
await page.goto(`${base}/session-join`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot(page, '06-session-join', 'Session beitreten');

await browser.close();

console.log(JSON.stringify({ outDir, count: shots.length, shots }, null, 2));
if (shots.length < 3) {
  console.error('Too few screenshots captured');
  process.exit(1);
}

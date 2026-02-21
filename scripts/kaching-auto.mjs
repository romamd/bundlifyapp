import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from 'fs';

const DIR = '/Users/romancaraus/projects/bundlifyapp/screenshots/kaching';
const SIGNAL = '/tmp/kaching-start.txt';
mkdirSync(DIR, { recursive: true });

const BASE = 'https://admin.shopify.com/store/bundlifydev/apps/bundle-deals';
const NOTES = [];
let ssn = 0;

async function ss(page, name) {
  ssn++;
  const fname = `${String(ssn).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: `${DIR}/${fname}`, fullPage: true });
  console.log(`SS[${ssn}]: ${fname}`);
  return fname;
}

function getAppFrame(page) {
  return page.frames().find(f =>
    f.url().includes('kaching') || f.url().includes('bundle-deals')
  ) || null;
}

async function getText(page) {
  const frame = getAppFrame(page);
  if (!frame) return '(no app frame)';
  try {
    return await frame.evaluate(() => document.body?.innerText?.slice(0, 20000) || '');
  } catch (e) { return `(err: ${e.message})`; }
}

async function fscroll(page, px) {
  const frame = getAppFrame(page);
  if (frame) {
    try { await frame.evaluate(p => window.scrollBy(0, p), px); } catch(_) {}
    await page.waitForTimeout(800);
  }
}

async function fscrollTop(page) {
  const frame = getAppFrame(page);
  if (frame) {
    try { await frame.evaluate(() => window.scrollTo(0, 0)); } catch(_) {}
    await page.waitForTimeout(500);
  }
}

async function fclick(page, text) {
  const frame = getAppFrame(page);
  if (!frame) return false;
  for (const role of ['link', 'button', 'tab', 'menuitem']) {
    try {
      await frame.getByRole(role, { name: text }).first().click({ timeout: 3000 });
      await page.waitForTimeout(3000);
      return true;
    } catch (_) {}
  }
  try {
    await frame.getByText(text, { exact: false }).first().click({ timeout: 3000 });
    await page.waitForTimeout(3000);
    return true;
  } catch (_) {}
  console.log(`  skip: could not click "${text}"`);
  return false;
}

async function clickSidebar(page, text) {
  try {
    await page.getByRole('link', { name: text }).first().click({ timeout: 5000 });
    await page.waitForTimeout(4000);
    return true;
  } catch (_) {}
  try {
    await page.getByText(text, { exact: true }).first().click({ timeout: 3000 });
    await page.waitForTimeout(4000);
    return true;
  } catch (_) {}
  return false;
}

async function goApp(page, path) {
  const url = path ? `${BASE}/${path}` : BASE;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  page.on('crash', () => console.log('PAGE CRASHED'));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for signal file to start
  console.log('WAITING - create /tmp/kaching-start.txt to begin exploration');
  while (!existsSync(SIGNAL)) {
    await new Promise(r => setTimeout(r, 500));
  }
  try { unlinkSync(SIGNAL); } catch(_) {}
  console.log('STARTING exploration...\n');

  // ===== 1. DASHBOARD =====
  console.log('=== 1. DASHBOARD ===');
  await ss(page, 'dashboard');
  let text = await getText(page);
  NOTES.push({ section: 'Dashboard', text });

  await fscroll(page, 600);
  await ss(page, 'dashboard-bottom');
  text = await getText(page);
  NOTES.push({ section: 'Dashboard (scrolled)', text });

  // ===== 2. EXISTING BUNDLE DEAL =====
  console.log('\n=== 2. EXISTING DEAL ===');
  await fscrollTop(page);
  if (await fclick(page, 'Bundle')) {
    await ss(page, 'deal-editor-top');
    text = await getText(page);
    NOTES.push({ section: 'Deal Editor', text });

    await fscroll(page, 500);
    await ss(page, 'deal-editor-mid');

    await fscroll(page, 500);
    await ss(page, 'deal-editor-bottom');

    await fscroll(page, 500);
    await ss(page, 'deal-editor-bottom2');

    // Try Design tab
    await fscrollTop(page);
    if (await fclick(page, 'Design')) {
      await ss(page, 'deal-design-top');
      text = await getText(page);
      NOTES.push({ section: 'Deal Design', text });

      await fscroll(page, 500);
      await ss(page, 'deal-design-mid');
      await fscroll(page, 500);
      await ss(page, 'deal-design-bottom');
      await fscroll(page, 500);
      await ss(page, 'deal-design-bottom2');
      await fscroll(page, 500);
      await ss(page, 'deal-design-bottom3');
    }

    // Try Deals tab (to go back to deal list within editor)
    await fscrollTop(page);
    if (await fclick(page, 'Deals')) {
      await ss(page, 'deal-deals-tab');
      text = await getText(page);
      NOTES.push({ section: 'Deal Deals Tab', text });
      await fscroll(page, 500);
      await ss(page, 'deal-deals-tab-scroll');
    }
  }

  // ===== 3. CREATE BUNDLE - SEE ALL TYPES =====
  console.log('\n=== 3. CREATE BUNDLE ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  if (await fclick(page, 'Create bundle deal')) {
    await ss(page, 'create-types-top');
    text = await getText(page);
    NOTES.push({ section: 'Create Bundle Types', text });

    await fscroll(page, 500);
    await ss(page, 'create-types-mid');
    await fscroll(page, 500);
    await ss(page, 'create-types-bottom');
    await fscroll(page, 500);
    await ss(page, 'create-types-bottom2');

    // Click into Single type
    await fscrollTop(page);
    if (await fclick(page, 'Single')) {
      await ss(page, 'single-builder-top');
      text = await getText(page);
      NOTES.push({ section: 'Single Builder', text });

      await fscroll(page, 500);
      await ss(page, 'single-builder-mid');
      await fscroll(page, 500);
      await ss(page, 'single-builder-bottom');

      // Design tab
      await fscrollTop(page);
      if (await fclick(page, 'Design')) {
        await ss(page, 'single-design-top');
        text = await getText(page);
        NOTES.push({ section: 'Single Design', text });

        await fscroll(page, 400);
        await ss(page, 'single-design-2');
        await fscroll(page, 400);
        await ss(page, 'single-design-3');
        await fscroll(page, 400);
        await ss(page, 'single-design-4');
        await fscroll(page, 400);
        await ss(page, 'single-design-5');
        await fscroll(page, 400);
        await ss(page, 'single-design-6');
      }
    }
  }

  // ===== 4. SETTINGS =====
  console.log('\n=== 4. SETTINGS ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  await clickSidebar(page, 'Settings');
  await ss(page, 'settings-top');
  text = await getText(page);
  NOTES.push({ section: 'Settings', text });

  await fscroll(page, 500);
  await ss(page, 'settings-mid');
  await fscroll(page, 500);
  await ss(page, 'settings-bottom');
  await fscroll(page, 500);
  await ss(page, 'settings-bottom2');

  // ===== 5. MORE UPSELLS =====
  console.log('\n=== 5. MORE UPSELLS ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  await clickSidebar(page, 'More Upsells');
  await ss(page, 'upsells-top');
  text = await getText(page);
  NOTES.push({ section: 'More Upsells', text });

  await fscroll(page, 500);
  await ss(page, 'upsells-mid');
  await fscroll(page, 500);
  await ss(page, 'upsells-bottom');

  // ===== 6. TRANSLATIONS =====
  console.log('\n=== 6. TRANSLATIONS ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  await clickSidebar(page, 'Translations');
  await ss(page, 'translations-top');
  text = await getText(page);
  NOTES.push({ section: 'Translations', text });

  await fscroll(page, 500);
  await ss(page, 'translations-bottom');

  // ===== 7. ANALYTICS =====
  console.log('\n=== 7. ANALYTICS ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  await clickSidebar(page, 'Analytics');
  await ss(page, 'analytics-top');
  text = await getText(page);
  NOTES.push({ section: 'Analytics', text });

  await fscroll(page, 500);
  await ss(page, 'analytics-bottom');

  // ===== 8. PLANS =====
  console.log('\n=== 8. PLANS ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  await clickSidebar(page, 'Plans');
  await ss(page, 'plans-top');
  text = await getText(page);
  NOTES.push({ section: 'Plans', text });

  await fscroll(page, 500);
  await ss(page, 'plans-mid');
  await fscroll(page, 500);
  await ss(page, 'plans-bottom');

  // ===== SAVE =====
  console.log('\n=== SAVING ===');
  writeFileSync(`${DIR}/notes.json`, JSON.stringify(NOTES, null, 2));
  console.log(`\nDONE! ${ssn} screenshots taken.`);
  console.log(`Notes: ${DIR}/notes.json`);

  // Signal completion
  writeFileSync('/tmp/kaching-done.txt', `DONE:${ssn} screenshots`);

  // Keep browser open briefly
  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  writeFileSync('/tmp/kaching-done.txt', `ERROR:${e.message}`);
  process.exit(1);
});

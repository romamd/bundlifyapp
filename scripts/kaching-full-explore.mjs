import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';

const DIR = '/Users/romancaraus/projects/bundlifyapp/screenshots/kaching';
mkdirSync(DIR, { recursive: true });

const BASE = 'https://admin.shopify.com/store/bundlifydev/apps/bundle-deals';
const NOTES = [];
let ssn = 0;

async function ss(page, name) {
  ssn++;
  const fname = `${String(ssn).padStart(2, '0')}-${name}.png`;
  const path = `${DIR}/${fname}`;
  await page.screenshot({ path, fullPage: true });
  console.log(`SS: ${fname}`);
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
  } catch (e) {
    return `(error: ${e.message})`;
  }
}

async function fscroll(page, px) {
  const frame = getAppFrame(page);
  if (frame) {
    await frame.evaluate(p => window.scrollBy(0, p), px);
    await page.waitForTimeout(800);
  }
}

async function fscrollTop(page) {
  const frame = getAppFrame(page);
  if (frame) {
    await frame.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  }
}

async function fclick(page, text) {
  const frame = getAppFrame(page);
  if (!frame) { console.log(`No frame for fclick "${text}"`); return false; }
  for (const role of ['link', 'button', 'tab']) {
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
  console.log(`Could not fclick "${text}"`);
  return false;
}

async function goApp(page, path) {
  const url = path ? `${BASE}/${path}` : BASE;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
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

  console.log('Navigating to Kaching app...');
  console.log('>>> PLEASE LOG IN IF NEEDED, then press ENTER <<<');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for user to press Enter (for login)
  await new Promise(r => { process.stdin.setEncoding('utf8'); process.stdin.once('data', r); });
  console.log('Starting exploration...');

  // ===== 1. DASHBOARD =====
  console.log('\n=== DASHBOARD ===');
  await ss(page, 'dashboard');
  let text = await getText(page);
  NOTES.push({ section: 'Dashboard', text: text.slice(0, 5000) });

  await fscroll(page, 600);
  await ss(page, 'dashboard-scroll');

  // ===== 2. CLICK INTO EXISTING BUNDLE DEAL =====
  console.log('\n=== DEAL EDITOR ===');
  await fscrollTop(page);
  const clicked = await fclick(page, 'Bundle');
  if (clicked) {
    await ss(page, 'deal-editor');
    text = await getText(page);
    NOTES.push({ section: 'Deal Editor', text: text.slice(0, 5000) });

    await fscroll(page, 600);
    await ss(page, 'deal-editor-scroll1');

    await fscroll(page, 600);
    await ss(page, 'deal-editor-scroll2');

    await fscroll(page, 600);
    await ss(page, 'deal-editor-scroll3');

    // Look for Design tab or section
    await fscrollTop(page);
    const designClicked = await fclick(page, 'Design');
    if (designClicked) {
      await ss(page, 'deal-design-tab');
      text = await getText(page);
      NOTES.push({ section: 'Deal Design Tab', text: text.slice(0, 5000) });

      await fscroll(page, 600);
      await ss(page, 'deal-design-scroll1');

      await fscroll(page, 600);
      await ss(page, 'deal-design-scroll2');

      await fscroll(page, 600);
      await ss(page, 'deal-design-scroll3');
    }

    // Look for other tabs in deal editor
    for (const tab of ['Products', 'Discount', 'Settings', 'Visibility', 'Advanced']) {
      await fscrollTop(page);
      const tabClicked = await fclick(page, tab);
      if (tabClicked) {
        await ss(page, `deal-tab-${tab.toLowerCase()}`);
        text = await getText(page);
        NOTES.push({ section: `Deal Tab: ${tab}`, text: text.slice(0, 3000) });

        await fscroll(page, 600);
        await ss(page, `deal-tab-${tab.toLowerCase()}-scroll`);
      }
    }
  }

  // ===== 3. CREATE NEW BUNDLE — see all discount types =====
  console.log('\n=== CREATE BUNDLE ===');
  await goApp(page, '');
  await page.waitForTimeout(2000);
  const createClicked = await fclick(page, 'Create bundle deal');
  if (createClicked) {
    await ss(page, 'create-discount-types');
    text = await getText(page);
    NOTES.push({ section: 'Create Bundle - Discount Types', text: text.slice(0, 5000) });

    await fscroll(page, 600);
    await ss(page, 'create-discount-types-scroll1');

    await fscroll(page, 600);
    await ss(page, 'create-discount-types-scroll2');

    // Click into "Single" type to explore the full builder
    const singleClicked = await fclick(page, 'Single');
    if (singleClicked) {
      await ss(page, 'create-single-builder');
      text = await getText(page);
      NOTES.push({ section: 'Single Bundle Builder', text: text.slice(0, 5000) });

      await fscroll(page, 800);
      await ss(page, 'create-single-builder-scroll1');

      await fscroll(page, 800);
      await ss(page, 'create-single-builder-scroll2');

      // Check for Design tab
      const designClicked2 = await fclick(page, 'Design');
      if (designClicked2) {
        await ss(page, 'create-single-design');
        text = await getText(page);
        NOTES.push({ section: 'Single Bundle Design', text: text.slice(0, 5000) });

        await fscroll(page, 600);
        await ss(page, 'create-single-design-scroll1');

        await fscroll(page, 600);
        await ss(page, 'create-single-design-scroll2');

        await fscroll(page, 600);
        await ss(page, 'create-single-design-scroll3');

        await fscroll(page, 600);
        await ss(page, 'create-single-design-scroll4');
      }
    }
  }

  // ===== 4. SETTINGS =====
  console.log('\n=== SETTINGS ===');
  await goApp(page, 'app/settings');
  await ss(page, 'settings');
  text = await getText(page);
  NOTES.push({ section: 'Settings', text: text.slice(0, 5000) });

  await fscroll(page, 600);
  await ss(page, 'settings-scroll1');

  await fscroll(page, 600);
  await ss(page, 'settings-scroll2');

  await fscroll(page, 600);
  await ss(page, 'settings-scroll3');

  // ===== 5. MORE UPSELLS =====
  console.log('\n=== MORE UPSELLS ===');
  await goApp(page, 'app/upsells');
  await ss(page, 'more-upsells');
  text = await getText(page);
  NOTES.push({ section: 'More Upsells', text: text.slice(0, 5000) });

  await fscroll(page, 600);
  await ss(page, 'more-upsells-scroll1');

  await fscroll(page, 600);
  await ss(page, 'more-upsells-scroll2');

  // ===== 6. TRANSLATIONS =====
  console.log('\n=== TRANSLATIONS ===');
  await goApp(page, 'app/translations');
  await ss(page, 'translations');
  text = await getText(page);
  NOTES.push({ section: 'Translations', text: text.slice(0, 5000) });

  await fscroll(page, 600);
  await ss(page, 'translations-scroll1');

  // ===== 7. ANALYTICS =====
  console.log('\n=== ANALYTICS ===');
  await goApp(page, 'app/analytics');
  await ss(page, 'analytics');
  text = await getText(page);
  NOTES.push({ section: 'Analytics', text: text.slice(0, 5000) });

  await fscroll(page, 600);
  await ss(page, 'analytics-scroll1');

  // ===== 8. PLANS =====
  console.log('\n=== PLANS ===');
  await goApp(page, 'app/plans');
  await ss(page, 'plans');
  text = await getText(page);
  NOTES.push({ section: 'Plans', text: text.slice(0, 5000) });

  await fscroll(page, 600);
  await ss(page, 'plans-scroll1');

  await fscroll(page, 600);
  await ss(page, 'plans-scroll2');

  // ===== SAVE NOTES =====
  console.log('\n=== SAVING NOTES ===');
  const notesPath = `${DIR}/exploration-notes.json`;
  writeFileSync(notesPath, JSON.stringify(NOTES, null, 2));
  console.log(`Notes saved to ${notesPath}`);
  console.log(`Total screenshots: ${ssn}`);

  // Keep browser open for manual inspection
  console.log('\nExploration complete. Press ENTER to close browser.');
  await new Promise(r => { process.stdin.once('data', r); });
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

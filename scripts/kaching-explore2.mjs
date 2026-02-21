import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';

const SCREENSHOTS_DIR = '/Users/romancaraus/projects/bundlifyapp/screenshots/kaching';
const CMD_FILE = '/tmp/kaching-cmd.txt';
const RESULT_FILE = '/tmp/kaching-result.txt';

mkdirSync(SCREENSHOTS_DIR, { recursive: true });
if (existsSync(CMD_FILE)) unlinkSync(CMD_FILE);
if (existsSync(RESULT_FILE)) unlinkSync(RESULT_FILE);

const APP_URL = 'https://admin.shopify.com/store/bundlifydev/apps/bundle-deals';

function writeResult(text) {
  writeFileSync(RESULT_FILE, text);
}

async function waitForCommand() {
  while (true) {
    if (existsSync(CMD_FILE)) {
      const cmd = readFileSync(CMD_FILE, 'utf8').trim();
      unlinkSync(CMD_FILE);
      if (cmd) return cmd;
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

/** Helper: find the Kaching app frame */
function getAppFrame(page) {
  return page.frames().find(f =>
    f.url().includes('kaching') || f.url().includes('bundle-deals')
  ) || null;
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // Try to close dev console if visible
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } catch (_) {}

  writeResult('READY');

  let screenshotCounter = 1;

  while (true) {
    const cmd = await waitForCommand();

    try {
      if (cmd === 'done') break;

      else if (cmd === 'ss' || cmd === 'screenshot') {
        const name = String(screenshotCounter++).padStart(2, '0');
        const path = `${SCREENSHOTS_DIR}/${name}-page.png`;
        await page.screenshot({ path, fullPage: true });
        writeResult(`SCREENSHOT:${path}`);
      }

      else if (cmd.startsWith('ss:')) {
        const name = cmd.slice(3).trim();
        const path = `${SCREENSHOTS_DIR}/${name}.png`;
        await page.screenshot({ path, fullPage: true });
        writeResult(`SCREENSHOT:${path}`);
      }

      else if (cmd.startsWith('goto:')) {
        const url = cmd.slice(5).trim();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);
        writeResult(`OK:${page.url()}`);
      }

      // Navigate within Shopify admin sidebar — clicks on the main page
      else if (cmd.startsWith('nav:')) {
        const text = cmd.slice(4).trim();
        try {
          await page.getByRole('link', { name: text }).first().click({ timeout: 8000 });
        } catch (_) {
          await page.getByText(text, { exact: false }).first().click({ timeout: 8000 });
        }
        await page.waitForTimeout(4000);
        writeResult(`OK:navigated to ${text}`);
      }

      // Click inside the app iframe
      else if (cmd.startsWith('appclick:')) {
        const text = cmd.slice(9).trim();
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        try {
          await frame.getByRole('link', { name: text }).first().click({ timeout: 8000 });
        } catch (_) {
          try {
            await frame.getByRole('button', { name: text }).first().click({ timeout: 5000 });
          } catch (_) {
            await frame.getByText(text, { exact: false }).first().click({ timeout: 5000 });
          }
        }
        await page.waitForTimeout(3000);
        writeResult(`OK:clicked ${text}`);
      }

      // Click a role inside app iframe
      else if (cmd.startsWith('approle:')) {
        const parts = cmd.slice(8).trim().split(':');
        const role = parts[0];
        const name = parts.slice(1).join(':');
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        await frame.getByRole(role, { name }).first().click({ timeout: 8000 });
        await page.waitForTimeout(3000);
        writeResult(`OK:clicked ${role}:${name}`);
      }

      // Get full visible text from app iframe
      else if (cmd === 'text') {
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        const text = await frame.evaluate(() => document.body?.innerText?.slice(0, 15000) || '');
        writeResult(text);
      }

      // Get all links/buttons from app iframe
      else if (cmd === 'elements') {
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        const els = await frame.evaluate(() => {
          const result = [];
          document.querySelectorAll('a, button, [role="tab"], [role="button"], input, select, textarea').forEach(el => {
            const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100);
            const tag = el.tagName;
            const type = el.getAttribute('type') || '';
            const href = el.getAttribute('href') || '';
            const role = el.getAttribute('role') || '';
            if (text || type) result.push({ tag, text, type, href, role });
          });
          return result.slice(0, 60);
        });
        writeResult(els.map(e => `[${e.tag}${e.type ? ':' + e.type : ''}${e.role ? '(' + e.role + ')' : ''}] ${e.text}${e.href ? ' -> ' + e.href : ''}`).join('\n'));
      }

      // Scroll inside the app iframe
      else if (cmd === 'scrolldown') {
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        await frame.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(1000);
        writeResult('OK:scrolled');
      }

      else if (cmd === 'scrollup') {
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        await frame.evaluate(() => window.scrollBy(0, -600));
        await page.waitForTimeout(1000);
        writeResult('OK:scrolled');
      }

      else if (cmd === 'scrolltop') {
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        await frame.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);
        writeResult('OK:scrolled to top');
      }

      else if (cmd === 'scrollbottom') {
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        await frame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        writeResult('OK:scrolled to bottom');
      }

      else if (cmd === 'esc') {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        writeResult('OK:escape');
      }

      else if (cmd === 'url') {
        writeResult(page.url());
      }

      else if (cmd === 'wait') {
        await page.waitForTimeout(3000);
        writeResult('OK');
      }

      // Tab navigation inside app iframe
      else if (cmd.startsWith('apptab:')) {
        const text = cmd.slice(7).trim();
        const frame = getAppFrame(page);
        if (!frame) { writeResult('ERROR:no app frame'); continue; }
        try {
          await frame.getByRole('tab', { name: text }).first().click({ timeout: 5000 });
        } catch (_) {
          await frame.getByText(text, { exact: true }).first().click({ timeout: 5000 });
        }
        await page.waitForTimeout(3000);
        writeResult(`OK:tab ${text}`);
      }

      else {
        writeResult(`UNKNOWN:${cmd}`);
      }
    } catch (e) {
      writeResult(`ERROR:${e.message.slice(0, 500)}`);
    }
  }

  await browser.close();
  writeResult('DONE');
}

main().catch(e => { writeResult(`FATAL:${e.message}`); process.exit(1); });

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';

const SCREENSHOTS_DIR = '/Users/romancaraus/projects/bundlifyapp/screenshots/kaching';
const CMD_FILE = '/tmp/kaching-cmd.txt';
const RESULT_FILE = '/tmp/kaching-result.txt';

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Clean up command files
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

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(APP_URL);
  writeResult('READY: Browser open, navigate to Kaching app and send commands via /tmp/kaching-cmd.txt');

  while (true) {
    const cmd = await waitForCommand();
    console.log(`CMD: ${cmd}`);

    try {
      if (cmd === 'done') {
        writeResult('CLOSING');
        break;
      } else if (cmd === 'screenshot') {
        const ts = Date.now();
        const path = `${SCREENSHOTS_DIR}/page-${ts}.png`;
        await page.screenshot({ path, fullPage: true });
        writeResult(`SCREENSHOT:${path}`);

      } else if (cmd.startsWith('screenshot:')) {
        const name = cmd.slice(11).trim();
        const path = `${SCREENSHOTS_DIR}/${name}.png`;
        await page.screenshot({ path, fullPage: true });
        writeResult(`SCREENSHOT:${path}`);

      } else if (cmd.startsWith('goto:')) {
        const url = cmd.slice(5).trim();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        writeResult(`NAVIGATED:${page.url()}`);

      } else if (cmd === 'url') {
        writeResult(`URL:${page.url()}`);

      } else if (cmd === 'title') {
        writeResult(`TITLE:${await page.title()}`);

      } else if (cmd === 'iframes') {
        const frames = page.frames();
        const result = frames.map(f => `${f.name() || '(main)'} -> ${f.url()}`).join('\n');
        writeResult(`FRAMES:\n${result}`);

      } else if (cmd === 'frameurl') {
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        writeResult(appFrame ? `FRAMEURL:${appFrame.url()}` : 'FRAMEURL:none');

      } else if (cmd.startsWith('framescreenshot:')) {
        const name = cmd.slice(16).trim();
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        if (appFrame) {
          // Find the iframe element and screenshot it
          const allIframes = page.locator('iframe');
          const count = await allIframes.count();
          let screenshotted = false;
          for (let i = 0; i < count; i++) {
            const iframe = allIframes.nth(i);
            const src = await iframe.getAttribute('src').catch(() => '');
            if (src && (src.includes('kaching') || src.includes('bundle'))) {
              const path = `${SCREENSHOTS_DIR}/${name}.png`;
              await iframe.screenshot({ path });
              writeResult(`SCREENSHOT:${path}`);
              screenshotted = true;
              break;
            }
          }
          if (!screenshotted) {
            // Fallback: screenshot the full page
            const path = `${SCREENSHOTS_DIR}/${name}.png`;
            await page.screenshot({ path, fullPage: true });
            writeResult(`SCREENSHOT:${path}`);
          }
        } else {
          const path = `${SCREENSHOTS_DIR}/${name}.png`;
          await page.screenshot({ path, fullPage: true });
          writeResult(`SCREENSHOT:${path}`);
        }

      } else if (cmd.startsWith('frameclick:')) {
        const text = cmd.slice(11).trim();
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        if (appFrame) {
          await appFrame.getByText(text, { exact: false }).first().click({ timeout: 10000 });
          await page.waitForTimeout(2000);
          writeResult(`CLICKED:${text}`);
        } else {
          // Try on main page
          await page.getByText(text, { exact: false }).first().click({ timeout: 10000 });
          await page.waitForTimeout(2000);
          writeResult(`CLICKED:${text}`);
        }

      } else if (cmd.startsWith('clicktext:')) {
        const text = cmd.slice(10).trim();
        await page.getByText(text, { exact: false }).first().click({ timeout: 10000 });
        await page.waitForTimeout(2000);
        writeResult(`CLICKED:${text}`);

      } else if (cmd.startsWith('click:')) {
        const selector = cmd.slice(6).trim();
        await page.click(selector, { timeout: 10000 });
        await page.waitForTimeout(2000);
        writeResult(`CLICKED:${selector}`);

      } else if (cmd === 'framenav') {
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        if (appFrame) {
          const nav = await appFrame.evaluate(() => {
            const items = document.querySelectorAll('a, button, [role="tab"], [role="menuitem"], nav *, [class*="nav"] *, [class*="Nav"] *, [class*="sidebar"] *, [class*="menu"] *, [class*="tab"] *');
            const seen = new Set();
            return Array.from(items)
              .map(el => {
                const text = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100);
                const tag = el.tagName;
                const href = el.getAttribute('href') || '';
                return { text, tag, href };
              })
              .filter(l => l.text && !seen.has(l.text) && (seen.add(l.text), true))
              .slice(0, 50);
          });
          const result = nav.map(n => `[${n.tag}] ${n.text}${n.href ? ' -> ' + n.href : ''}`).join('\n');
          writeResult(`FRAMENAV:\n${result}`);
        } else {
          writeResult('FRAMENAV:no app frame found');
        }

      } else if (cmd === 'frametext') {
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        if (appFrame) {
          const text = await appFrame.evaluate(() => {
            return document.body?.innerText?.slice(0, 10000) || '';
          });
          writeResult(`FRAMETEXT:\n${text}`);
        } else {
          writeResult('FRAMETEXT:no app frame found');
        }

      } else if (cmd === 'pagetext') {
        const text = await page.evaluate(() => {
          return document.body?.innerText?.slice(0, 10000) || '';
        });
        writeResult(`PAGETEXT:\n${text}`);

      } else if (cmd.startsWith('frameselector:')) {
        const selector = cmd.slice(14).trim();
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        if (appFrame) {
          const elements = await appFrame.evaluate((sel) => {
            const els = document.querySelectorAll(sel);
            return Array.from(els).map(el => ({
              tag: el.tagName,
              text: el.textContent?.trim().slice(0, 200),
              class: el.className?.toString().slice(0, 200),
            })).slice(0, 30);
          }, selector);
          const result = elements.map(e => `[${e.tag}] ${e.text} (class: ${e.class})`).join('\n');
          writeResult(`FRAMESELECTOR:\n${result}`);
        } else {
          writeResult('FRAMESELECTOR:no app frame found');
        }

      } else if (cmd === 'wait') {
        await page.waitForTimeout(3000);
        writeResult('WAITED');

      } else if (cmd.startsWith('scrollframe:')) {
        const direction = cmd.slice(12).trim();
        const frames = page.frames();
        const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
        if (appFrame) {
          await appFrame.evaluate((dir) => {
            if (dir === 'bottom') window.scrollTo(0, document.body.scrollHeight);
            else if (dir === 'top') window.scrollTo(0, 0);
            else window.scrollBy(0, parseInt(dir) || 500);
          }, direction);
          await page.waitForTimeout(1000);
          writeResult(`SCROLLED:${direction}`);
        } else {
          writeResult('SCROLL:no app frame found');
        }

      } else {
        writeResult(`UNKNOWN CMD: ${cmd}`);
      }
    } catch (e) {
      writeResult(`ERROR: ${e.message}`);
    }
  }

  await browser.close();
  writeResult('DONE');
}

main().catch(e => {
  writeResult(`FATAL: ${e.message}`);
  process.exit(1);
});

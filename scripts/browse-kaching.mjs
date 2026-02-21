import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SCREENSHOTS_DIR = '/Users/romancaraus/projects/bundlifyapp/screenshots/kaching';
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const APP_URL = 'https://admin.shopify.com/store/bundlifydev/apps/bundle-deals';

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Navigate to the Shopify admin app URL
  await page.goto(APP_URL);

  console.log('>>> Browser is open. Please log in to Shopify if needed.');
  console.log('>>> Once the Kaching app is loaded, press ENTER in this terminal...');

  // Wait for user to press Enter
  await new Promise((resolve) => {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', resolve);
  });

  console.log('>>> Taking screenshots of Kaching Bundles app...');

  // Save the current page (main app dashboard)
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-main-dashboard.png`, fullPage: true });
  console.log('  Saved: 01-main-dashboard.png');

  // Write marker so the outer process knows auth is done
  console.log('AUTH_READY');

  // Keep browser open — the outer process will send commands via stdin
  console.log('>>> Browser ready for navigation. Send URLs or commands via stdin.');
  console.log('>>> Type "done" to close the browser.');

  for await (const line of createLineReader()) {
    const cmd = line.trim();
    if (cmd === 'done') break;

    if (cmd.startsWith('goto:')) {
      const url = cmd.slice(5).trim();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('Navigation timeout, continuing...');
      }
    } else if (cmd.startsWith('click:')) {
      const selector = cmd.slice(6).trim();
      try {
        await page.click(selector, { timeout: 10000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`Click failed: ${e.message}`);
      }
    } else if (cmd.startsWith('clicktext:')) {
      const text = cmd.slice(10).trim();
      try {
        await page.getByText(text, { exact: false }).first().click({ timeout: 10000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`Click text failed: ${e.message}`);
      }
    } else if (cmd.startsWith('screenshot:')) {
      const name = cmd.slice(11).trim();
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: true });
      console.log(`  Saved: ${name}.png`);
    } else if (cmd === 'url') {
      console.log(`CURRENT_URL:${page.url()}`);
    } else if (cmd === 'title') {
      console.log(`TITLE:${await page.title()}`);
    } else if (cmd.startsWith('html:')) {
      const selector = cmd.slice(5).trim();
      try {
        const html = await page.locator(selector).first().innerHTML({ timeout: 5000 });
        console.log(`HTML_START\n${html}\nHTML_END`);
      } catch (e) {
        console.log(`HTML failed: ${e.message}`);
      }
    } else if (cmd === 'links') {
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]')).map(a => ({
          text: a.textContent?.trim().slice(0, 80),
          href: a.href,
        })).filter(l => l.text);
      });
      console.log('LINKS_START');
      for (const l of links) {
        console.log(`  ${l.text} -> ${l.href}`);
      }
      console.log('LINKS_END');
    } else if (cmd === 'buttons') {
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, [role="button"], a.Polaris-Button, [class*="Button"]')).map(b => ({
          text: b.textContent?.trim().slice(0, 80),
          tag: b.tagName,
        })).filter(b => b.text);
      });
      console.log('BUTTONS_START');
      for (const b of buttons) {
        console.log(`  [${b.tag}] ${b.text}`);
      }
      console.log('BUTTONS_END');
    } else if (cmd === 'nav') {
      // Try to find navigation elements in Kaching app
      const nav = await page.evaluate(() => {
        const items = document.querySelectorAll('nav a, [class*="nav"] a, [class*="Nav"] a, [class*="sidebar"] a, [class*="Sidebar"] a, [class*="menu"] a, [class*="Menu"] a');
        return Array.from(items).map(a => ({
          text: a.textContent?.trim().slice(0, 80),
          href: a.href,
        })).filter(l => l.text);
      });
      console.log('NAV_START');
      for (const n of nav) {
        console.log(`  ${n.text} -> ${n.href}`);
      }
      console.log('NAV_END');
    } else if (cmd === 'iframes') {
      const iframes = page.frames();
      console.log('FRAMES_START');
      for (const f of iframes) {
        console.log(`  ${f.name()} -> ${f.url()}`);
      }
      console.log('FRAMES_END');
    } else if (cmd === 'switchframe') {
      // Switch to the app iframe (Shopify embeds apps in an iframe)
      const frames = page.frames();
      const appFrame = frames.find(f => f.url().includes('kaching') || f.url().includes('bundle'));
      if (appFrame) {
        console.log(`Switched to frame: ${appFrame.url()}`);
        // We can't actually "switch" in Playwright — we use frameLocator
        // Store the frame URL for the user
      } else {
        console.log('No Kaching iframe found. Frames:');
        for (const f of frames) {
          console.log(`  ${f.url()}`);
        }
      }
    } else if (cmd.startsWith('framehtml:')) {
      const selector = cmd.slice(10).trim() || 'body';
      try {
        const frames = page.frames();
        // Find the app iframe
        const appFrame = frames.find(f =>
          f.url().includes('kaching') || f.url().includes('bundle-deals')
        );
        if (appFrame) {
          const html = await appFrame.locator(selector).first().innerHTML({ timeout: 5000 });
          console.log(`FRAMEHTML_START\n${html}\nFRAMEHTML_END`);
        } else {
          console.log('No app iframe found');
        }
      } catch (e) {
        console.log(`Frame HTML failed: ${e.message}`);
      }
    } else if (cmd === 'framescreenshot') {
      try {
        const frames = page.frames();
        const appFrame = frames.find(f =>
          f.url().includes('kaching') || f.url().includes('bundle-deals')
        );
        if (appFrame) {
          // Screenshot the iframe element
          const iframeEl = await page.locator('iframe').filter({ has: page.locator(`[src*="kaching"], [src*="bundle"]`) }).first();
          if (await iframeEl.isVisible()) {
            await iframeEl.screenshot({ path: `${SCREENSHOTS_DIR}/frame-screenshot.png` });
            console.log('  Saved: frame-screenshot.png');
          }
        }
      } catch (e) {
        console.log(`Frame screenshot failed: ${e.message}`);
      }
    }
  }

  await browser.close();
  console.log('Browser closed.');
}

async function* createLineReader() {
  process.stdin.setEncoding('utf8');
  let buffer = '';
  for await (const chunk of process.stdin) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      yield line;
    }
  }
  if (buffer) yield buffer;
}

main().catch(console.error);

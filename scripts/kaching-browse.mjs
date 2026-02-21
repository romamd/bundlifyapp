import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';

const DIR = '/Users/romancaraus/projects/bundlifyapp/screenshots/kaching';
const CMD = '/tmp/kaching-cmd.txt';
const RES = '/tmp/kaching-result.txt';

mkdirSync(DIR, { recursive: true });
if (existsSync(CMD)) unlinkSync(CMD);
if (existsSync(RES)) unlinkSync(RES);

function out(t) { writeFileSync(RES, t); }

async function waitCmd() {
  while (true) {
    if (existsSync(CMD)) {
      try {
        const c = readFileSync(CMD, 'utf8').trim();
        try { unlinkSync(CMD); } catch(_) {}
        if (c) return c;
      } catch(_) {}
    }
    await new Promise(r => setTimeout(r, 300));
  }
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

  // Prevent page from crashing on unhandled errors
  page.on('crash', () => out('PAGE_CRASHED'));
  page.on('close', () => out('PAGE_CLOSED'));

  await page.goto('https://admin.shopify.com/store/bundlifydev/apps/bundle-deals', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  out('READY - browser open. Commands: go <url>, ss <name>, click <text>, esc, scroll, text, done');

  let ssn = 0;

  while (true) {
    let cmd;
    try { cmd = await waitCmd(); } catch(_) { continue; }
    const [verb, ...rest] = cmd.split(' ');
    const arg = rest.join(' ').trim();

    try {
      switch (verb) {
        case 'done':
          await browser.close();
          out('CLOSED');
          return;

        case 'ss': {
          const name = arg || String(++ssn).padStart(2, '0');
          const p = `${DIR}/${name}.png`;
          await page.screenshot({ path: p, fullPage: true });
          out(`OK ${p}`);
          break;
        }

        case 'go': {
          await page.goto(arg, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);
          out(`OK ${page.url()}`);
          break;
        }

        case 'click': {
          // Try links first, then buttons, then any text
          let clicked = false;
          for (const role of ['link', 'button', 'tab']) {
            try {
              await page.getByRole(role, { name: arg }).first().click({ timeout: 3000 });
              clicked = true;
              break;
            } catch(_) {}
          }
          if (!clicked) {
            await page.getByText(arg, { exact: false }).first().click({ timeout: 5000 });
          }
          await page.waitForTimeout(3000);
          out(`OK clicked "${arg}" -> ${page.url()}`);
          break;
        }

        case 'fclick': {
          // Click inside any iframe
          const frames = page.frames();
          let clicked = false;
          for (const f of frames) {
            if (f === page.mainFrame()) continue;
            try {
              for (const role of ['link', 'button', 'tab']) {
                try {
                  await f.getByRole(role, { name: arg }).first().click({ timeout: 2000 });
                  clicked = true;
                  break;
                } catch(_) {}
              }
              if (clicked) break;
              await f.getByText(arg, { exact: false }).first().click({ timeout: 2000 });
              clicked = true;
              break;
            } catch(_) {}
          }
          await page.waitForTimeout(3000);
          out(clicked ? `OK fclicked "${arg}"` : `FAIL could not find "${arg}" in frames`);
          break;
        }

        case 'esc':
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
          out('OK');
          break;

        case 'scroll':
          if (arg === 'up') {
            await page.evaluate(() => window.scrollBy(0, -600));
          } else if (arg === 'top') {
            await page.evaluate(() => window.scrollTo(0, 0));
          } else if (arg === 'bottom') {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          } else {
            await page.evaluate(() => window.scrollBy(0, 600));
          }
          await page.waitForTimeout(500);
          out('OK');
          break;

        case 'fscroll': {
          const frames = page.frames();
          for (const f of frames) {
            if (f === page.mainFrame()) continue;
            if (f.url().includes('kaching') || f.url().includes('bundle')) {
              if (arg === 'top') {
                await f.evaluate(() => window.scrollTo(0, 0));
              } else if (arg === 'bottom') {
                await f.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
              } else {
                await f.evaluate((px) => window.scrollBy(0, px), parseInt(arg) || 600);
              }
              break;
            }
          }
          await page.waitForTimeout(500);
          out('OK');
          break;
        }

        case 'text': {
          const frames = page.frames();
          for (const f of frames) {
            if (f === page.mainFrame()) continue;
            if (f.url().includes('kaching') || f.url().includes('bundle')) {
              const t = await f.evaluate(() => document.body?.innerText?.slice(0, 15000) || '');
              out(t);
              break;
            }
          }
          break;
        }

        case 'url':
          out(page.url());
          break;

        case 'wait':
          await page.waitForTimeout(parseInt(arg) || 3000);
          out('OK');
          break;

        case 'frames': {
          const fs = page.frames().map(f => `${f.name() || '(main)'}: ${f.url().slice(0, 120)}`);
          out(fs.join('\n'));
          break;
        }

        default:
          out(`UNKNOWN: ${cmd}`);
      }
    } catch (e) {
      out(`ERR: ${e.message.slice(0, 300)}`);
    }
  }
}

main().catch(e => { out(`FATAL: ${e.message}`); process.exit(1); });

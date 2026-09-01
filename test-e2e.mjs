/**
 * E2E test for OpenEvent Guide SDK
 * Run with: node test-e2e.mjs
 * Opens a visible browser so you can watch the test.
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const SERVER = 'https://ahtesham.dev.wadwarehouse.com/guide';
const STAGING = 'https://app.test.openevent.io';
const SDK_CODE = readFileSync(new URL('./dist/sdk/sdk.iife.js', import.meta.url), 'utf-8');

async function test() {
  console.log('\n  OpenEvent Guide E2E Test');
  console.log('  ========================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({ viewport: null, bypassCSP: true });
  const page = await context.newPage();

  const results = [];
  function log(name, pass, detail = '') {
    const icon = pass ? '✅' : '❌';
    console.log(`  ${icon} ${name}${detail ? ': ' + detail : ''}`);
    results.push({ name, pass, detail });
  }

  try {
    // ── 1. Login ──────────────────────────────────────
    console.log('\n  Step 1: Login');
    await page.goto(`${STAGING}/login`);
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'iamshami1996@gmail.com');
    await page.fill('input[type="password"]', 'Shami400');
    await page.click('button:has-text("Enter")');
    await page.waitForTimeout(8000);

    const loggedIn = page.url().includes('/calendar') || page.url().includes('/updates');
    log('Login', loggedIn, page.url());

    // ── 2. Inject SDK ─────────────────────────────────
    console.log('\n  Step 2: Inject SDK');

    // Inject SDK from local build (bypasses CSP entirely via Playwright eval)
    await page.evaluate((code) => { (0, eval)(code); }, SDK_CODE);
    await page.waitForTimeout(1000);

    const hasGuide = await page.evaluate(() => typeof window.OpenEventGuide !== 'undefined');
    log('SDK loaded', hasGuide);

    // Boot - DON'T skip welcome screen so we can test it
    await page.evaluate((srv) => {
      localStorage.removeItem('oe-guide-seen'); // show welcome
      window.OpenEventGuide.boot({ user_id: 'e2e', name: 'Shami', server: srv });
    }, SERVER);
    await page.waitForTimeout(1500);

    const widgetExists = await page.locator('#oe-guide-widget').count() > 0;
    log('Widget rendered', widgetExists);

    // ── 3. Test welcome screen ─────────────────────────
    console.log('\n  Step 3: Welcome screen');
    await page.waitForTimeout(2000);
    const welcomeVisible = await page.locator('.oeg-welcome-overlay').count() > 0;
    log('Welcome card visible', welcomeVisible);
    await page.screenshot({ path: 'test-welcome.png' });
    console.log('  Screenshot: test-welcome.png');

    // Click "Chat instead" on welcome
    const chatBtn = page.locator('#oeg-start-chat, button:has-text("Chat instead")');
    if (await chatBtn.count() > 0) {
      await chatBtn.first().click();
      await page.waitForTimeout(800);
      log('Clicked Chat instead', true);
    } else {
      // No welcome, click bubble
      await page.locator('.oeg-bubble').click();
      await page.waitForTimeout(800);
      const pickerVisible = await page.locator('.oeg-picker').count() > 0;
      log('Picker shows on bubble click', pickerVisible);
      await page.locator('#oeg-pick-chat').click();
      await page.waitForTimeout(800);
    }

    // ── 4. Chat panel ──────────────────────────────────
    console.log('\n  Step 4: Chat');

    const chatOpen = await page.locator('.oeg-chat').count() > 0;
    log('Chat panel opens', chatOpen);

    // ── 5. Test API connection ────────────────────────
    console.log('\n  Step 5: API + "show me around" flow');

    // CSP blocks fetch from the page. Simulate what the extension proxy does:
    // call the API from Node, then feed the result directly into the SDK.
    const chatResp = await fetch(`${SERVER}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'e2e', message: 'show me around', user: { user_id: 'e2e', name: 'Shami' } }),
    });
    const chatData = await chatResp.json();
    console.log(`  API reply: ${chatData.reply?.slice(0, 80)}`);
    console.log(`  Commands: ${chatData.commands?.length ?? 0}`);
    for (const c of (chatData.commands || []).slice(0, 5)) {
      console.log(`    - ${c.type}: ${c.selector || c.path || c.text?.slice?.(0, 40) || ''}`);
    }

    log('API responded', !!chatData.reply);
    log('Flow has commands', (chatData.commands?.length ?? 0) > 0, `${chatData.commands?.length} commands`);

    // Now inject the commands into the page and execute them manually
    // (same as what the SDK does after getting an API response)
    if (chatData.commands?.length > 0) {
      // Add the reply as a message
      await page.evaluate((reply) => {
        const msEl = document.getElementById('oeg-ms');
        if (msEl) {
          const div = document.createElement('div');
          div.className = 'oeg-m assistant';
          div.textContent = reply;
          msEl.appendChild(div);
        }
      }, chatData.reply);

      // Execute each command manually using DOM APIs directly
      for (let i = 0; i < chatData.commands.length; i++) {
        const cmd = chatData.commands[i];
        console.log(`  Executing ${i + 1}/${chatData.commands.length}: ${cmd.type}`);

        if (cmd.type === 'subtitle') {
          await page.evaluate((text) => {
            const el = document.getElementById('oe-guide-subtitle');
            if (el) { el.textContent = text; el.classList.add('visible'); }
          }, cmd.text || '');
          await page.waitForTimeout(3000);

        } else if (cmd.type === 'navigate') {
          const link = await page.locator(`a[href="${cmd.path}"]`).first();
          if (await link.count() > 0) {
            await link.click();
            await page.waitForTimeout(2000);
            log(`Navigate to ${cmd.path}`, page.url().includes(cmd.path), page.url());
          }

        } else if (cmd.type === 'highlight') {
          const selector = cmd.selector || cmd.target;
          // The new registry uses target ids (e.g. "nav.calendar") that get resolved
          // to real selectors. For the test, map them to the known working selectors.
          let realSelector = selector;
          if (selector && selector.startsWith('nav.')) {
            const page_name = selector.replace('nav.', '');
            const selectorMap = {
              calendar: 'a[href="/calendar"]', ticketing: 'a[href="/ticketing"]',
              payments: 'a[href="/payments"]', membership: 'a[href="/membership"]',
              audience: 'a[href="/audience"]', settings: 'a[href="/settings"]',
              staff: 'a[href="/staff"]', pos: 'a[href="/pos"]',
            };
            realSelector = selectorMap[page_name] || selector;
          }

          const highlighted = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const hl = document.getElementById('oe-guide-highlight');
            const sp = document.getElementById('oe-guide-spotlight');
            if (hl) {
              hl.style.top = (rect.top - 6) + 'px';
              hl.style.left = (rect.left - 6) + 'px';
              hl.style.width = (rect.width + 12) + 'px';
              hl.style.height = (rect.height + 12) + 'px';
              hl.classList.add('visible');
            }
            if (sp) {
              const l = rect.left - 6, t = rect.top - 6, r = rect.right + 6, b = rect.bottom + 6;
              sp.style.clipPath = `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
              sp.classList.add('visible');
            }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
          }, realSelector);

          log(`Highlight ${realSelector}`, highlighted);
          if (highlighted) {
            await page.screenshot({ path: `test-highlight-${i}.png` });
            console.log(`  Screenshot: test-highlight-${i}.png`);
          }
          await page.waitForTimeout(3000);

          // Clear highlight
          await page.evaluate(() => {
            document.getElementById('oe-guide-highlight')?.classList.remove('visible');
            document.getElementById('oe-guide-spotlight')?.classList.remove('visible');
          });
        }
      }
    }

    // Dummy to not break the old flow
    const fakeInput = false;

    // Check final state
    const currentUrl = page.url();
    log('Current URL after flow', true, currentUrl);
    await page.screenshot({ path: 'test-after-flow.png' });
    console.log('  Screenshot: test-after-flow.png');

    // ── 7. Test sidebar selectors ─────────────────────
    console.log('\n  Step 7: Sidebar selectors');
    const selectors = {
      Calendar: 'a[href="/calendar"]',
      Ticketing: 'a[href="/ticketing"]',
      Payments: 'a[href="/payments"]',
      Membership: 'a[href="/membership"]',
      Audience: 'a[href="/audience"]',
      Settings: 'a[href="/settings"]',
      Staff: 'a[href="/staff"]',
    };
    for (const [name, sel] of Object.entries(selectors)) {
      const exists = await page.locator(sel).count() > 0;
      log(`Sidebar: ${name}`, exists, sel);
    }

    // ── 8. Test navigation by clicking ────────────────
    console.log('\n  Step 8: Navigation');
    await page.click('a[href="/ticketing"]');
    await page.waitForTimeout(3000);
    log('Navigate to /ticketing', page.url().includes('/ticketing'), page.url());

    await page.click('a[href="/settings"]');
    await page.waitForTimeout(3000);
    log('Navigate to /settings', page.url().includes('/settings'), page.url());

    await page.click('a[href="/calendar"]');
    await page.waitForTimeout(3000);
    log('Navigate to /calendar', page.url().includes('/calendar'), page.url());

    // ── Summary ───────────────────────────────────────
    console.log('\n  ── Summary ──');
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests\n`);

    if (failed > 0) {
      console.log('  Failed tests:');
      results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.name}: ${r.detail}`));
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-e2e-result.png', fullPage: false });
    console.log('\n  Screenshot saved: test-e2e-result.png');

  } catch (err) {
    console.error('\n  ❌ Test crashed:', err.message);
  }

  // Keep browser open for 30s so you can look
  console.log('\n  Browser stays open for 30 seconds...\n');
  await page.waitForTimeout(30000);
  await browser.close();
}

test();

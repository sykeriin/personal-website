import { Browser } from 'file:///C:/Users/sykeriin/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import fs from 'node:fs';
const browser = await Browser.launch();
const out = '.taste-skill/after';
fs.mkdirSync(out, { recursive: true });
const results = [];
try {
  const page = await browser.newPage();
  const errors = [];
  browser.on(page.sessionId, 'Runtime.exceptionThrown', e => errors.push(e.exceptionDetails.exception?.description || e.exceptionDetails.text));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewport({ width, height: width > 820 ? 900 : 844, mobile: width < 821 });
    for (const route of ['/', '/#/work', '/#/person', '/#/work/tread', '/#/contact', '/creative.html']) {
      await page.goto('http://127.0.0.1:4173' + route, { timeoutMs: 2500, settleMs: 700 });
      const data = await page.eval(() => ({
        title: document.title,
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1: document.querySelector('h1')?.textContent,
        brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
        text: document.body.innerText.length,
      }));
      results.push({ width, route, ...data });
      if (width === 1440 || width === 390) await page.screenshot({ path: `${out}/${width}-${route.replace(/[^a-z]/g, '') || 'home'}.jpg` });
      if (route === '/#/person') {
        await page.eval(() => document.querySelector('[data-class="2"]').click());
        results.push({ width, interaction: 'character selector', pass: await page.eval(() => document.getElementById('clsName').textContent === 'Musician') });
      }
      if (route === '/creative.html') {
        await page.eval(() => document.querySelector('[data-control="open"]').click());
        results.push({ width, interaction: 'creative work menu', pass: await page.eval(() => document.getElementById('mobile-screen').textContent.includes('SkillFuzz')) });
        await page.eval(() => document.querySelector('[data-control="next"]').click());
        await page.eval(() => document.querySelector('[data-control="open"]').click());
        results.push({ width, interaction: 'creative project', pass: await page.eval(() => document.getElementById('mobile-screen').textContent.includes('Code on GitHub')) });
      }
    }
  }
  for (const route of ['/about', '/work/tread', '/#/missing']) {
    await page.goto('http://127.0.0.1:4173' + route, { timeoutMs: 2500, settleMs: 300 });
    results.push({ route, title: await page.eval(() => document.querySelector('h1')?.textContent) });
  }
  fs.writeFileSync(`${out}/checks.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }));
} finally { await browser.close(); }

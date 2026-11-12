import fs from 'node:fs';

const backup = 'node_modules/.cache/pre-liquid-redesign';
fs.mkdirSync(backup, { recursive: true });
for (const file of ['index.html', 'mockup-liquid.html', 'mockup-creative.html']) {
  if (!fs.existsSync(`${backup}/${file}`)) fs.copyFileSync(file, `${backup}/${file}`);
}
fs.mkdirSync('src/liquid', { recursive: true });
let liquid = fs.readFileSync(`${backup}/mockup-liquid.html`, 'utf8');
let creative = fs.readFileSync(`${backup}/mockup-creative.html`, 'utf8');
let liquidCode = liquid.match(/<script>([\s\S]*?)<\/script>/)[1];
let creativeCode = creative.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const liquidStyle = liquid.match(/<style>([\s\S]*?)<\/style>/)[1];
const creativeStyle = creative.match(/<style>([\s\S]*?)<\/style>/)[1];

liquidCode = `import './liquid.css';\nimport './refinements.css';\nconst characters = import.meta.glob('../assets/ink/character/*.png', { eager: true, query: '?url', import: 'default' });\n` + liquidCode;
liquidCode = liquidCode.replaceAll('mockup-creative.html', '/creative.html').replaceAll('href="DurvaSharma_Resume.pdf"', 'href="/DurvaSharma_Resume.pdf"');
liquidCode = liquidCode.replace('src="/src/assets/ink/character/durva-${c.pose}.png"', 'src="${characters[`../assets/ink/character/durva-${c.pose}.png`]}"');
liquidCode = liquidCode.replace('<div class="top"><ul', '<nav class="top" aria-label="Main navigation"><ul').replace('Resume, PDF</a></div></div>`', 'Résumé ↗</a></div></nav>`');
liquidCode = liquidCode.replace('<div class="three px">', '<div class="three px" aria-hidden="true">');
liquidCode = liquidCode.replace('<h1 class="title cond">${o.title}</h1>', '<h1 class="title cond">${o.title}</h1><p class="hero-note">${o.cur === "Home" ? "Inference, agent security, and the systems underneath." : o.cur === "Work" ? "Experiments, shipped software, and what I learned building them." : o.cur === "Person" ? "A few different sides. All the same person." : "Good questions are a good place to start."}</p>');
liquidCode = liquidCode.replace('class="sheet hero ${o.tone}"', 'class="sheet hero ${o.tone} ${o.detail ? "detail-hero" : ""}"');
liquidCode = liquidCode.replace("tone: 'black', cur: 'Work', mark: 'katana', word: p.n", "detail: true, tone: 'black', cur: 'Work', mark: 'katana', word: p.n");
liquidCode = liquidCode.replace('<p class="say cond">I build the parts of AI systems that tend to break.</p>', '<h2 class="intro-heading">Built for the difficult parts.</h2><p class="lede">I build the parts of AI systems that tend to break: memory, trust, and everything between a promising idea and working software.</p>');
liquidCode = liquidCode.replace('<div class="sel2"><div', '<h2 class="person-heading">Choose your Durva.</h2><div class="class-tabs" aria-label="Choose an interest">${CLS.map((c,i) => `<button data-class="${i}" aria-pressed="${i === cls}">${c.n}</button>`).join(\'\')}</div><div class="sel2"><div');
liquidCode = liquidCode.replace("app.querySelectorAll('#vin .band')", "app.querySelectorAll('[data-class]').forEach((b,j) => b.setAttribute('aria-pressed', j === cls));\n  app.querySelectorAll('#vin .band')");
liquidCode = liquidCode.replace("<kbd>${'QECX'[j]}</kbd>", '<span aria-hidden="true">↗</span>');
liquidCode = liquidCode.replace("document.body.classList.add('flat'); document.getElementById('ab').addEventListener('click', e => { const f = document.body.classList.toggle('flat'); e.currentTarget.textContent = f ? 'Showing: flat. Switch to glossy' : 'Showing: glossy. Switch to flat'; });", "document.getElementById('ab').addEventListener('click', e => { const f = document.body.classList.toggle('flat'); e.currentTarget.textContent = f ? 'Liquid finish: matte' : 'Liquid finish: chrome'; e.currentTarget.setAttribute('aria-pressed', !f); });");
liquidCode = liquidCode.replace('function fly() {', 'function fly() { if (innerWidth <= 820 || reduce) return;');
liquidCode = liquidCode.replace('function stack() { live = 0;', 'function stack() { live = 0; if (reduce) return;');
liquidCode = liquidCode.replace("ptr = e; if (!ptrQ)", "if (reduce) return; ptr = e; if (!ptrQ)");
liquidCode = liquidCode.replace("function view() { const [a, b]", "function view() { const [a, b]");
liquidCode = liquidCode.replace("return (pages[a] || pages.home)();", "if (a === 'creative' || a === 'play') { location.replace('/creative.html'); return ''; }\n  if (a && !pages[a] || a === 'work' && b) return `<section class=\"sheet over grey missing\">${nav('')}<h1>Nothing on this track.</h1><p>That page doesn’t exist.</p><a class=\"bar\" href=\"#/\">Back to home ↗</a></section>`;\n  return (pages[a] || pages.home)();");
liquidCode = liquidCode.replace("function render() { app.innerHTML = view();", "function render() { app.innerHTML = view(); document.title = `${app.querySelector('h1')?.textContent || 'Durva Sharma'} — Durva Sharma`; app.querySelector('h1')?.setAttribute('tabindex', '-1');");
liquidCode = liquidCode.replace('function go() { if (reduce || !word) return render(); if (melting) return; animate(0, 1, 300, () => { render(); melt = 1; paint(); animate(1, 0, 520, () => { melting = false; }); }); }', "function go() { melt = 0; render(); app.querySelector('h1')?.focus({ preventScroll: true }); }");
liquidCode = liquidCode.replace("app.addEventListener('click', e => { const a", "app.addEventListener('click', e => { const choice = e.target.closest('[data-class]'); if (choice) setCls(+choice.dataset.class); const a");
liquidCode = liquidCode.replace('document.fonts.ready.then(render);', `const oldPath = location.pathname.replace(/\\/$/, '');
if (!location.hash && oldPath && oldPath !== '/index.html' && oldPath !== '/mockup-liquid.html') {
  const route = oldPath === '/about' ? '/person' : oldPath;
  history.replaceState(null, '', '/#' + route);
}
render();
document.fonts.ready.then(fit);`);
liquidCode = liquidCode.replace('<section class="fly"', '<a class="gallery-skip" href="#project-list">Skip the record gallery ↓</a><section class="fly"');
liquidCode = liquidCode.replace('<h2 class="cond" data-stretch>Projects</h2>', '<h2 class="cond" id="project-list" data-stretch>Projects</h2>');
// A normal anchor scrolls within the current page rather than entering the hash router.
liquidCode = liquidCode.replace("addEventListener('hashchange', go);", "addEventListener('hashchange', () => { if (!location.hash || location.hash.startsWith('#/')) go(); });");

creativeCode = `import './creative.css';\nimport './creative-refinements.css';\n` + creativeCode;
creativeCode = creativeCode.replaceAll('mockup-liquid.html', '/').replaceAll('mockup-creative.html', '/creative.html');
creativeCode = creativeCode.replace("const scr = document.createElement('div'); scr.className = 'scr';", "const scr = document.createElement('div'); scr.className = 'scr';\nconst mobileScr = document.getElementById('mobile-screen');");
creativeCode = creativeCode.replace('scr.innerHTML = h;', "scr.innerHTML = h; mobileScr.innerHTML = h; document.getElementById('selection-status').textContent = S.v === 'menu' ? MENU[S.i][0] : S.v === 'music' ? MUSIC[S.i] : S.v === 'work' || S.v === 'item' ? WORK[S.i].n : POSTS[S.i].title;");
creativeCode = creativeCode.replace("let S = { v: 'menu', i: 0 }, playing = 0", "let S = { v: 'menu', i: 0 }, playing = -1");
creativeCode = creativeCode.replace("'now playing'", "'selected'");
creativeCode = creativeCode.replace("else if (S.v === 'music') playing = S.i;", "else if (S.v === 'music') { playing = S.i; window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(MUSIC[S.i] + ' music'), '_blank', 'noopener'); }");
creativeCode = creativeCode.replace("scr.addEventListener('click', e =>", "[scr, mobileScr].forEach(surface => surface.addEventListener('click', e =>");
creativeCode = creativeCode.replace("press(); } });\naddEventListener('keydown'", "press(); } }));\ndocument.querySelectorAll('[data-control]').forEach(button => button.addEventListener('click', () => { const action = button.dataset.control; if(action === 'back') back(); else if(action === 'open') press(); else step(action === 'next' ? 1 : -1); }));\naddEventListener('keydown'");
creativeCode = creativeCode.replace("e => { if (e.key === 'ArrowDown'", "e => { if (e.target.closest('button,a,input,textarea')) return; if (e.key === 'ArrowDown'");
creativeCode = creativeCode.replace("wheelAcc += e.deltaY;", "if (innerWidth <= 820 || e.target.closest('.scr')) return; wheelAcc += e.deltaY;");
creativeCode = creativeCode.replace("const r = $('read');", "const r = (innerWidth <= 820 ? mobileScr : scr).querySelector('.read');");
creativeCode = creativeCode.replace("try { renderer = new THREE.WebGLRenderer", "function initRenderer() { if (renderer || innerWidth <= 820) return; try { renderer = new THREE.WebGLRenderer");
creativeCode = creativeCode.replace("$('fallback').style.display = 'grid';", "document.body.classList.add('no-webgl');");
creativeCode = creativeCode.replace('if (renderer) start();', "if (renderer) start(); }\ninitRenderer(); addEventListener('resize', initRenderer);");
creativeCode = creativeCode.replace('function frame(now) {', "function frame(now) {\n  if (document.hidden || innerWidth <= 820) { requestAnimationFrame(frame); return; }");
creativeCode = creativeCode.replace('swirl += kick * dt * 0.5;', 'swirl += reduce ? 0 : kick * dt * 0.5;');
creativeCode = creativeCode.replace('const NG = 46, NC = 22', 'const NG = 18, NC = 10');

function shell(html, kind) {
  return html.replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/<script(?: type="module")?>[\s\S]*?<\/script>/, `<script type="module" src="/src/liquid/${kind}.js"></script>`)
    .replace(/<title>.*?<\/title>/, `<title>Durva Sharma — ${kind === 'liquid' ? 'AI systems & other interests' : 'B-side'}</title>\n<meta name="theme-color" content="#e0122d"><meta name="description" content="Durva Sharma. AI systems, agent security, and a creative B-side. Explore projects, music, and the person behind the work."><link rel="icon" href="/favicon.svg">`)
    .replaceAll('mockup-liquid.html', '/').replaceAll('mockup-creative.html', '/creative.html');
}
liquid = shell(liquid, 'liquid').replace('<div id="app"></div>', '<a class="skip-link" href="#main-content">Skip to content</a><main id="app"></main><noscript>This portfolio needs JavaScript. Contact <a href="mailto:durva.s170@gmail.com">Durva by email</a>.</noscript>')
  .replace('Showing: flat. Switch to glossy', 'Liquid finish: chrome').replace('id="ab"', 'id="ab" aria-pressed="true"');
liquidCode = liquidCode.replace('class="title cond"', 'id="main-content" class="title cond"');
creative = shell(creative, 'creative').replace('<p class="px hint">Spin the record to move. Press its centre to open.</p>', '<div class="creative-intro"><h1>The B-side.</h1><p>Same person. A different frequency.</p></div><div class="player-controls" aria-label="Player controls"><button data-control="back" aria-label="Back to menu">↶</button><button data-control="previous" aria-label="Previous selection">←</button><button data-control="open">Open ↗</button><button data-control="next" aria-label="Next selection">→</button></div><p class="px hint">Turn the record, use the arrows, or choose a track.</p><span id="selection-status" class="sr-only" aria-live="polite"></span>')
  .replace('<p class="fallback"', '<main class="mobile-player"><div id="mobile-screen" class="scr"></div><div class="mobile-record" aria-hidden="true"><span>DURVA<br><b>B-side</b><br>33 RPM</span></div></main><p class="fallback"');
fs.writeFileSync('src/liquid/liquid.js', liquidCode);
fs.writeFileSync('src/liquid/creative.js', creativeCode);
fs.writeFileSync('src/liquid/liquid.css', liquidStyle);
fs.writeFileSync('src/liquid/creative.css', creativeStyle);
fs.writeFileSync('index.html', liquid);
fs.writeFileSync('mockup-liquid.html', liquid);
fs.writeFileSync('creative.html', creative);
fs.writeFileSync('mockup-creative.html', creative);

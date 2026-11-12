import './liquid.css';
const characters = import.meta.glob('../assets/ink/character/*.png', { eager: true, query: '?url', import: 'default' });

(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, app = document.getElementById('app');
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const gh = 'github.com/sykeriin/';
const P = [
  { s: 'tread', n: 'tread', t: 'Faster long-context prompts', q: 'Why re-read a document the model has already read?', what: 'Skips repeated prompt processing when documents are reused or rearranged, so the model starts generating sooner.', how: 'Content-addressed GPU and CPU KV-cache tiers, with exact RoPE re-rotation for reordered chunks. On Qwen2.5-0.5B, recomputing 20% improved time to first token 1.4× at 4K context and 1.6× at 8K.', stack: 'Python, PyTorch, Hugging Face Transformers', fact: '1.6× faster first token' },
  { s: 'skillfuzz', n: 'SkillFuzz', t: 'Fuzzing for agent tools', q: 'What does a tool do when nobody is watching?', what: "Checks what an agent's tools actually do, instead of trusting the permissions they claim to need.", how: 'A rootless sandbox with a network sinkhole and honeytokens. It runs skills under many conditions, traces file, network and process effects, and diffs versions to flag capability growth nobody declared. Signed attestations, 44 tests.', stack: 'Python, Linux namespaces, strace', fact: '44 tests' },
  { s: 'dpdp-guard', n: 'DPDP Guard', t: 'Privacy controls for AI apps', q: 'Can privacy rules be code?', what: 'Lets developers apply privacy rules consistently and gives users clearer control over their data.', how: 'A consent SDK with per-purpose policy checks, PII masking before anything is logged, and detection of data-rights requests, including in Hinglish. Backed by a tamper-evident audit ledger and a dashboard.', stack: 'Python, FastAPI, PostgreSQL, Next.js', fact: 'Reads Hinglish' },
  { s: 'taintmem', n: 'TaintMem', t: 'Trusted memory for agents', q: 'Who told the agent that?', what: 'Keeps the source and trust level of everything an agent remembers, so an untrusted instruction is never mistaken for reliable memory.', how: 'Sentence-level trust labels, provenance that survives LLM-style rewrites, and policy-gated retrieval.', stack: 'Python, SQLite', fact: 'Sentence-level trust' },
  { s: 'cloudsense', n: 'CloudSense', t: 'Cloud cost intelligence', q: 'Which service is eating the bill?', what: 'Shows teams which services drive their cloud bill and flags unusual changes.', how: 'A deployed FinOps platform on AWS Cost Explorer, with Isolation Forest anomaly detection, Prophet forecasting, an AI assistant and what-if cost analysis.', stack: 'Python, FastAPI, React, AWS', fact: 'Deployed on AWS' }
];
const JOBS = [
  { s: 'hawkeye', n: 'HAWKEYE', t: 'OpenCV preprocessing lead', when: 'May 2026 to now', where: 'Indian Air Force runway project', q: 'Is there something on the runway?', fact: 'Three camera feeds',
    what: 'A foreign-object-debris detection system for an Indian Air Force runway. A loose bolt or a strip of rubber on a runway can wreck an aircraft, so the system watches the surface and flags anything that should not be there. I led the computer-vision preprocessing pipeline.',
    how: 'Three Raspberry Pi cameras feed in at once, and the detector downstream needs one consistent stream of frames. I built that stage as a modular workflow: bilateral denoising to clean the image without smearing edges, CLAHE to recover contrast in flat light, region-of-interest cropping so the model only looks at runway, and frame skipping to hold the pace. I also structured the frontend so the model could be plugged in and the live feeds inspected.', stack: 'Python, OpenCV, Raspberry Pi' },
  { s: 'petally', n: 'PetAlly', t: 'Founding software and AI integration engineer', when: 'March to September 2026', where: 'The House of Vrindavan, Bengaluru', q: 'What does a pet app need to know about your pet?', fact: 'Founding engineer',
    what: 'A pet-care product on web and mobile. As the founding engineer I built its recommendation system and integrated the AI features across both, including an AI chatbot and a pet mood journal.',
    how: 'Beyond the AI features I developed pet-health tracking, engagement scoring, activity streaks and the PawPoints rewards system that keeps people coming back. I also worked on the app UI and the landing page, and set up the AWS CI/CD that ships it.', stack: 'AI integration, web, mobile, AWS CI/CD' }
];
const SHOTS = {
  tread: { file: 'bench: time to first token', rows: [['Full prefill', 1, '1.0×'], ['tread, 4K context', 1.4, '1.4×'], ['tread, 8K context', 1.6, '1.6×']], max: 1.6, note: 'Speed-up over full prefill. Qwen2.5-0.5B, 20% recompute. From the repo benchmarks.' },
  skillfuzz: { file: 'eval: dormant behaviours caught', rows: [['Fixed single run', 35, '35/90'], ['Static scan', 65, '65/90'], ['SkillFuzz', 90, '90/90']], max: 90, note: 'Hidden behaviours that only fire under certain conditions. From the repo README.' },
  'dpdp-guard': { file: 'quickstart.py', code: 'from dpdp_guard import Guard\n\nguard = Guard("acme", "Acme Store",\n              required_purposes=["order_updates"],\n              optional_purposes=["marketing"])\n\nr = guard(message, user_id, "whatsapp")\nsend(agent(r.message) if r.action == "forward" else r.reply_text)' },
  taintmem: { file: 'examples/demo_laundering.py', code: '$ python examples/demo_laundering.py\n# planted payload -> 2 rewrites -> BLOCK -> audit\n\nlabels, channels     integrity lattice\nstore, record        labelled spans, SQLite + HMAC\npropagate, rewrite   labels survive LLM rewrites\npolicy, agent/loop   retrieve > decide > gate > execute\nauditor              counterfactual re-runs' },
  cloudsense: { file: 'architecture', code: 'frontend/        React dashboard and UI workflows\nbackend/         FastAPI APIs, AWS integration, automation\n  ├── db/        database models and connection\n  ├── services/  anomaly_detection.py, aws_cost_fetcher.py ...\n  └── main.py    FastAPI application\nml_service/      anomaly detection and forecasting' },
  hawkeye: { file: 'preprocessing pipeline', code: 'cam 0 ─┐\ncam 1 ─┼─► bilateral denoise ─► CLAHE ─► ROI crop ─► frame skip ─► detector\ncam 2 ─┘' },
  petally: { file: 'what I built', code: 'recommendation system     AI chatbot        pet mood journal\npet-health tracking       engagement score  activity streaks\nPawPoints rewards         app UI            AWS CI/CD' }
};
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const shot = k => { const o = SHOTS[k]; return `<figure class="shot"><figcaption class="px"><i></i><i></i><i></i><span>${o.file}</span></figcaption>${o.code ? `<pre>${esc(o.code)}</pre>` : `<div class="bars">${o.rows.map(r => `<div><span>${r[0]}</span><em style="--w:${(r[1] / o.max * 100).toFixed(0)}"></em><b>${r[2]}</b></div>`).join('')}</div><small>${o.note}</small>`}</figure>`; };
/* disc art, one per piece of work */
const discs = { tread() { const R = rng(5); let o = '<rect x="-100" y="-100" width="200" height="200" fill="#cfd3d8"/>';
    for (let r = 0; r < 17; r++) { let x = -100; const y = -96 + r * 11.6; while (x < 100) { const w = 8 + R() * 36; o += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="6" fill="${r > 6 && r < 10 && x > -50 && x < 40 ? '#e0122d' : '#000'}"/>`; x += w + 4; } } return o; },
  skillfuzz() { let o = '<rect x="-100" y="-100" width="200" height="200" fill="#000"/>'; for (let y = 0; y < 17; y++) for (let x = 0; x < 17; x++) { const r = 0.7 + 5.2 * Math.abs(Math.sin(x * 0.62 + y * 0.2) * Math.cos(y * 0.48 - x * 0.1)); o += `<circle cx="${-96 + x * 12}" cy="${-96 + y * 12}" r="${r.toFixed(2)}" fill="${x === 12 && y === 5 ? '#e0122d' : '#cfd3d8'}"/>`; } return o; },
  'dpdp-guard'() { const R = rng(9); let o = '<rect x="-100" y="-100" width="200" height="200" fill="#e3e3e0"/>'; for (let r = 0; r < 16; r++) { let x = -92; const y = -90 + r * 12.5; while (x < 92) { const w = 10 + R() * 40, bar = R() < 0.4; o += `<rect x="${x.toFixed(1)}" y="${(y - (bar ? 3 : 0)).toFixed(1)}" width="${w.toFixed(1)}" height="${bar ? 9 : 3}" fill="${bar ? '#000' : '#8a8a86'}"/>`; x += w + 5; } }
    return o + '<g transform="rotate(-14 44 46)" fill="none" stroke="#e0122d" stroke-width="5"><circle cx="44" cy="46" r="30"/><path d="M30 46l10 10 20-22"/></g>'; },
  taintmem() { let o = '<rect x="-100" y="-100" width="200" height="200" fill="#e0122d"/>'; for (let r = 0; r < 18; r++) { const y = -96 + r * 11.5, from = 70 - Math.max(0, r - 4) * 20; o += `<rect x="-100" y="${y}" width="200" height="3" fill="#000"/>`; if (r > 4 && r < 12) o += `<rect x="${Math.max(-100, from)}" y="${y - 2}" width="${100 - Math.max(-100, from)}" height="7" fill="#fff"/>`; } return o + '<rect x="-100" y="42" width="200" height="7" fill="#000"/>'; },
  cloudsense() { let o = '<rect x="-100" y="-100" width="200" height="200" fill="#000"/><path d="M0 -62l62 106H-62z" fill="none" stroke="#cfd3d8" stroke-width="5"/><path d="M-100 34L-26 4" stroke="#cfd3d8" stroke-width="5"/>'; for (let i = 0; i < 6; i++) { const y = -2 + i * 9; o += i === 2 ? `<path d="M26 ${y}l20 5 8-34 9 40 37 7" fill="none" stroke="#e0122d" stroke-width="5"/>` : `<path d="M26 ${y}L100 ${y + 14 + i * 4}" stroke="#cfd3d8" stroke-width="3"/>`; } return o; },
  hawkeye() { let o = '<rect x="-100" y="-100" width="200" height="200" fill="#cfd3d8"/><path d="M-14 -100L-86 100M14 -100L86 100" stroke="#000" stroke-width="5"/>'; for (let i = 0; i < 7; i++) { const y = -92 + i * i * 4.4 + i * 6, h = 6 + i * 4; o += `<rect x="${-1.5 - i * 0.6}" y="${y.toFixed(1)}" width="${3 + i * 1.2}" height="${h}" fill="#000"/>`; } return o + '<circle cx="30" cy="52" r="7" fill="#e0122d"/><rect x="14" y="36" width="32" height="32" fill="none" stroke="#e0122d" stroke-width="2.5"/>'; },
  petally() { return '<rect x="-100" y="-100" width="200" height="200" fill="#e0122d"/><g fill="#000"><ellipse cx="0" cy="34" rx="40" ry="32"/><ellipse cx="-52" cy="-10" rx="17" ry="23" transform="rotate(-20 -52 -10)"/><ellipse cx="-19" cy="-42" rx="17" ry="24"/><ellipse cx="19" cy="-42" rx="17" ry="24"/><ellipse cx="52" cy="-10" rx="17" ry="23" transform="rotate(20 52 -10)"/></g>'; } };
const cd = k => `<div class="cd" data-k="${k}"><svg viewBox="-100 -100 200 200" aria-hidden="true">${discs[k]()}<circle r="27" fill="#d9dbde"/><circle r="27" fill="none" stroke="#8b8f96" stroke-width="1.5"/><circle r="14" fill="#f4f4f4" stroke="#8b8f96" stroke-width="1"/><circle r="7" fill="#000"/></svg></div>`;
const repo = { tread: 'tread', skillfuzz: 'SkillFuzz', 'dpdp-guard': 'dpdp-guard', taintmem: 'TaintMem', cloudsense: 'CloudSense' };
const CLS = [
  { n: 'Engineer', k: 'AI systems', pose: 'point', a: ['LLM inference: KV caching, RoPE', 'Agent security: sandboxes, fuzzing, provenance', 'Computer vision: OpenCV pipelines', 'Shipping: FastAPI, React, AWS, Docker'] },
  { n: 'Fighter', k: 'Muay Thai', pose: 'guard', a: ['Muay Thai', 'Discipline', 'Resilience'] },
  { n: 'Musician', k: 'Guitar, rock, loud', pose: 'guitar', a: ['Guitar', 'Drums', 'Linkin Park, Radiohead, Gorillaz, Nirvana'] },
  { n: 'Model', k: 'Fashion and the camera', pose: 'walk', a: ['Modelling', 'Styling', 'Photography', 'Directing shoots'] },
  { n: 'Poet', k: 'Published', pose: 'sit', a: ['Poetry, one published book', 'Journalling', 'Storyboards'] }
];

/* ---- quiet marks in the depth layer: the tattoos, uncaptioned ---- */
const marks = {
  lily() { const R = rng(11), s = 100; let o = `<path d="M16 330C30 210-16 160 0 4" stroke-width="5"/>`;
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + R() * 0.35; let ux = Math.cos(a), uy = Math.sin(a) * 0.55 - 0.28; const l = Math.hypot(ux, uy); ux /= l; uy /= l;
      const vx = -uy, vy = ux, bx = ux * 6, by = uy * 6, Q = (m, n, up = 0) => (bx + ux * m + vx * n).toFixed(1) + ' ' + (by + uy * m + vy * n - up).toFixed(1);
      for (let k = 0; k < 5; k++) { const sp = (0.12 + R() * 0.3) * (k % 2 ? 1 : -1), L = s * (0.34 + R() * 0.16); o += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)}C${Q(L*0.5, sp*L*0.15)} ${Q(L*1.02, sp*L*0.55)} ${Q(L*0.7, sp*L*1.25, L*0.2)}" stroke-width="${(3 + R() * 2.4).toFixed(1)}"/>`; }
      for (let k = 0; k < 6; k++) { const sp = (R() - 0.5) * 0.95, L = s * (0.6 + R() * 0.32); o += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)}C${Q(L*0.4, sp*L*0.2)} ${Q(L*0.88, sp*L*0.5, L*0.04)} ${Q(L*0.8, sp*L*0.72, L*0.46)}" stroke-width="1"/>`; } }
    return `<svg viewBox="-125 -125 250 460">${o}</svg>`; },
  katana: () => `<svg viewBox="0 0 1000 120"><path d="M190 64 Q620 30 992 8 Q640 62 190 84Z" fill="currentColor" stroke="none"/><path d="M200 70 Q620 40 960 16" stroke="#3b3d41" stroke-width="1.5"/><rect x="168" y="46" width="22" height="56" rx="4" fill="currentColor" stroke="none"/><path d="M168 66 L8 80 L10 98 L168 86Z" fill="currentColor" stroke="none"/><path d="M30 80l16 16M56 78l16 16M82 76l16 16M108 74l16 16M134 72l16 16" stroke="#3b3d41" stroke-width="2"/></svg>`,
  flies() { const R = rng(5); let o = ''; for (let i = 0; i < 6; i++) { const x = R() * 900, y = R() * 420, sc = 0.5 + R() * 1.1, r = R() * 70 - 35;
      o += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${r.toFixed(0)}) scale(${sc.toFixed(2)})" fill="currentColor" stroke="none"><path d="M0 0C-10-34-46-42-50-22-54-4-34 10 0 0ZM0 0C10-34 46-42 50-22 54-4 34 10 0 0ZM0 0C-18 4-40 16-34 32-28 46-6 34 0 0ZM0 0C18 4 40 16 34 32 28 46 6 34 0 0Z"/></g>`; }
    return `<svg viewBox="0 0 900 460">${o}</svg>`; },
  pick: () => `<svg viewBox="0 0 200 220"><path d="M100 8C168 8 198 38 187 88 172 150 126 192 100 204 74 192 28 150 13 88 2 38 32 8 100 8Z" fill="currentColor" stroke="none"/></svg>`
};
const markBox = { lily: 'right:6%;top:-4%;width:min(46vw,84vh);height:118%', katana: 'left:-4%;top:30%;width:112%;height:22%;transform:rotate(-13deg)', flies: 'left:4%;top:6%;width:90%;height:70%', pick: 'right:4%;top:6%;width:min(38vw,58vh);height:80%' };

/* ---- templates ---- */
const nav = cur => `<div class="top"><ul class="px">${[['', 'Home'], ['work', 'Work'], ['person', 'Person'], ['contact', 'Contact']].map(([h, l]) => `<li><a href="#/${h}"${cur === l ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul><div class="right px"><span class="mode" role="group" aria-label="Which site"><a href="#/"${cur === 'Creative' ? '' : ' aria-current="true"'}>Tech</a><a href="/creative.html">Creative</a></span><a class="pill" href="/DurvaSharma_Resume.pdf">Resume, PDF</a></div></div>`;
const hero = o => `<header class="sheet hero ${o.tone}">${nav(o.cur)}
  <div class="mark" style="${markBox[o.mark]}">${marks[o.mark]()}</div>
  <div class="three px">${o.three.map(t => `<span>${t}</span>`).join('')}<span></span></div>
  <h1 class="title cond">${o.title}</h1>
  <div class="liq" aria-hidden="true"><div class="goo"><div class="word"><span>${o.word}</span></div><i class="drop"></i></div>
    <svg class="loops" viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse cx="29" cy="50" rx="9" ry="44" transform="rotate(8 29 50)"/><ellipse cx="68" cy="52" rx="11" ry="40" transform="rotate(-10 68 52)"/></svg></div>
  <div class="four px">${o.four.map(t => `<span>${t}</span>`).join('')}</div>
  <a class="bar cond" href="${o.cta[1]}">${o.cta[0]}</a></header>`;
const foot = `<div class="foot px"><a href="mailto:durva.s170@gmail.com">durva.s170@gmail.com</a><a href="https://github.com/sykeriin">github.com/sykeriin</a><a href="https://linkedin.com/in/durva-s">linkedin.com/in/durva-s</a><span>Bengaluru, India</span></div>`;
const list = () => `<div class="rows">${P.map(p => `<a class="row" href="#/work/${p.s}"><b>${p.n}</b><span>${p.t}</span><span class="px">${p.fact}</span></a>`).join('')}</div>`;

const pages = {
  home: () => hero({ tone: 'red', cur: 'Home', mark: 'lily', word: 'Durva', three: ['Build', 'Break', 'Rebuild'], title: 'Durva Sharma<br>AI systems engineer',
      four: ['B.Tech CSE<br>MIT Bengaluru, 2029', 'Founding engineer<br>PetAlly', 'Computer vision lead<br>HAWKEYE, Indian Air Force', 'Bengaluru<br>India'], cta: ['See the work', '#/work'] }) +
    `<section class="sheet over black"><p class="say cond">I build the parts of AI systems that tend to break.</p>
      <div class="cols"><div><p class="px">Now</p><p>Leading computer-vision preprocessing on HAWKEYE, a runway debris detector for the Indian Air Force.</p></div><div><p class="px">Before</p><p>Founding software and AI integration engineer at PetAlly.</p></div><div><p class="px">Studying</p><p>Computer science at Manipal Institute of Technology, Bengaluru. Class of 2029.</p></div></div>
      <h2 class="cond" data-stretch style="margin-top:clamp(3rem,8vw,7rem)">Selected work</h2>${list()}</section>
    <section class="sheet over grey"><h2 class="cond" data-stretch>Off the clock</h2><p class="lede">Muay Thai. Guitar. A published book of poems. Photography. Fashion.</p><a class="bar cond" href="#/person" style="margin-top:2rem">Choose your Durva</a>${foot}</section>`,
  work: () => hero({ tone: 'black', cur: 'Work', mark: 'katana', word: 'Work', three: ['Inference', 'Agents', 'Privacy'], title: 'Five projects<br>two jobs',
      four: ['tread<br>SkillFuzz', 'DPDP Guard<br>TaintMem', 'CloudSense', 'HAWKEYE<br>PetAlly'], cta: ['Scroll', '#/work'] }) +
    `<section class="fly" id="fly" style="height:${[...P, ...JOBS].length * 80 + 100}vh" aria-label="Gallery of work"><div class="flyport">${[...P, ...JOBS].map(x => cd(x.s)).join('')}<div class="flyinfo" id="flyinfo"></div></div></section>
    <section class="sheet over grey"><h2 class="cond" data-stretch>Projects</h2>${list()}
      <h2 class="cond" data-stretch style="margin-top:clamp(3rem,8vw,7rem)">Jobs</h2>
      <div class="rows">${JOBS.map(j => `<a class="row" href="#/work/${j.s}"><b>${j.n}</b><span>${j.t}. ${j.where}.</span><span class="px">${j.when}</span></a>`).join('')}
        <div class="row"><b>NeuraAI</b><span>Vice President. Working committee, MAHE Innovation Centre.</span><span class="px">Campus</span></div></div>
      <ul class="chips cond"><li>1st, MAHE Mobility Hackathon 2026</li><li>2nd, PowerNext (CPRI)</li><li>2nd, UI/UX Sprint, Tech Solstice</li><li>Top 10, iQOO Hackathon</li><li>Top 10, Point Blank CTF</li><li>Top 32 of 1,000+, Zenith26</li></ul>${foot}</section>`,
  project(p) { const all = [...P, ...JOBS], nx = all[(all.indexOf(p) + 1) % all.length], job = !!p.when;
    return hero({ tone: 'black', cur: 'Work', mark: 'katana', word: p.n, three: [job ? 'Job' : 'Project', p.fact, ''], title: p.t, four: job ? [p.when, p.where, ...p.stack.split(', ').slice(0, 2)] : p.stack.split(', ').slice(0, 4), cta: ['All work', '#/work'] }) +
    `<section class="sheet over grey"><p class="say cond">${p.q}</p>${shot(p.s)}
      <div class="two"><div><h3 class="px">Built with</h3><p>${p.stack}</p>${job ? `<h3 class="px">When</h3><p>${p.when}</p><h3 class="px">Where</h3><p>${p.where}</p>` : `<h3 class="px">Source</h3><p><a href="https://${gh + repo[p.s]}">${gh + repo[p.s]}</a></p>`}</div>
        <div><h3 class="px">What it does</h3><p>${p.what}</p><h3 class="px">How</h3><p>${p.how}</p></div></div>
      <a class="bar cond" href="#/work/${nx.s}" style="margin-top:clamp(2.5rem,6vw,5rem)">Next: ${nx.n}</a>${foot}</section>`; },
  person: () => hero({ tone: 'black', cur: 'Person', mark: 'flies', word: 'Select', three: ['Five classes', 'One player', ''], title: 'Choose<br>your Durva',
      four: ['Engineer', 'Fighter<br>Musician', 'Model<br>Poet', 'B-side'], cta: ['Flip the record', '#/person'] }) +
    `<section class="sheet over grey" id="select"><div class="sel2"><div class="stage" id="stage"></div>
      <div><p class="cls cond" id="clsName" aria-live="polite"></p><p class="kind px" id="clsKind"></p><ul class="abil" id="abil"></ul></div>
      <div class="deck" id="deck"><div class="vin" id="vin"><i></i><svg viewBox="-50 -50 100 100">${CLS.map((c, j) => `<circle class="band" data-j="${j}" r="${(47.5 - 3.05 - j * 6.1).toFixed(2)}" stroke-width="5.3"><title>${c.n}</title></circle><circle class="gap" r="${(47.5 - (j + 1) * 6.1 + 0.4).toFixed(2)}"/>`).join('')}
          <circle r="15.6" fill="#e0122d"/><path id="arcB" d="M-11.6 0A11.6 11.6 0 0 1 11.6 0" fill="none"/><text><textPath href="#arcB" startOffset="50%">Durva Sharma</textPath></text><text class="bs" y="5.2">B-side</text><text y="11">33 rpm</text><circle r="1.4" fill="#e3e3e0"/></svg></div>
        <svg class="arm" viewBox="-50 -50 100 100"><circle cx="-60" cy="-42" r="7.5" fill="#cfd3d8" stroke="#000" stroke-width=".6"/>
          <g id="armG" tabindex="0" role="slider" aria-label="Tonearm" aria-valuemin="1" aria-valuemax="5"><rect x="-74" y="-45.5" width="11" height="7" rx="1.2" fill="#111"/><path d="M-60 -42H-6" stroke="transparent" stroke-width="9"/><path d="M-60 -42H-6" stroke="#111" stroke-width="2.3" stroke-linecap="round"/><rect x="-10" y="-45" width="9" height="6" rx="1" fill="#e0122d"/><circle cx="-60" cy="-42" r="3.4" fill="#111"/></g></svg></div></div>${foot}</section>`,
  creative: () => hero({ tone: 'black', cur: 'Creative', mark: 'flies', word: 'Creative', three: ['The other site', 'In 3D', 'Not built yet'], title: 'Same person<br>different site',
      four: ['Muay Thai', 'Guitar, drums', 'Poetry, photography', 'Fashion, modelling'], cta: ['Back to tech', '#/'] }),
  contact: () => hero({ tone: 'red', cur: 'Contact', mark: 'pick', word: 'Say hi', three: ['Research', 'Engineering', 'Good records'], title: 'Open to<br>talk',
      four: ['Email', 'GitHub', 'LinkedIn', 'Bengaluru, India'], cta: ['Write to me', 'mailto:durva.s170@gmail.com'] }) +
    `<section class="sheet over black"><a class="mail cond" href="mailto:durva.s170@gmail.com">durva.s170@gmail.com</a>
      <div class="rows"><a class="row" href="https://github.com/sykeriin"><b>GitHub</b><span>sykeriin</span><span class="px">Code</span></a><a class="row" href="https://linkedin.com/in/durva-s"><b>LinkedIn</b><span>durva-s</span><span class="px">Work</span></a><a class="row" href="/DurvaSharma_Resume.pdf"><b>Resume</b><span>One page, PDF</span><span class="px">Download</span></a></div></section>`
};

/* ---- liquid: fit, light, melt, scroll ---- */
document.body.classList.add('flat'); document.getElementById('ab').addEventListener('click', e => { const f = document.body.classList.toggle('flat'); e.currentTarget.textContent = f ? 'Showing: flat. Switch to glossy' : 'Showing: glossy. Switch to flat'; });
const blur2 = document.getElementById('blur2'), blur = document.getElementById('blur'), bump = document.getElementById('bump'), lamp = document.getElementById('lamp');
let liq, word, drop, base = 12, melt = 0, live = 0;
function fit() { liq = app.querySelector('.liq'); if (!liq) return; word = liq.querySelector('.word'); drop = liq.querySelector('.drop');
  word.style.fontSize = '100px'; const w = liq.clientWidth, fs = Math.min(100 * (w * 0.92) / word.firstElementChild.offsetWidth, innerHeight * 0.36);
  /* the liquid is drawn at half size and scaled up: a quarter of the pixels for the filter to chew through */
  word.style.fontSize = fs / 2 + 'px'; liq.style.height = fs * 0.96 + 'px'; base = Math.max(2, fs * 0.029);
  drop.style.width = drop.style.height = fs * 0.18 + 'px'; drop.style.margin = `${-fs * 0.09}px 0 0 ${-fs * 0.09}px`;
  liq.querySelectorAll('.goo i:not(.drop)').forEach(e => e.remove()); const R = rng(word.textContent.length * 7 + 3);
  for (let i = 0; i < 3; i++) { const d = document.createElement('i'), s = fs * (0.045 + R() * 0.05); d.style.cssText = `width:${s}px;height:${s}px;left:${(6 + R() * 86).toFixed(1)}%;top:${(R() < 0.5 ? 2 + R() * 10 : 70 + R() * 12).toFixed(1)}%`; liq.firstElementChild.appendChild(d); }
  bump.setAttribute('stdDeviation', (base * 0.5).toFixed(1)); paint(); }
function paint() { if (!word) return; blur.setAttribute('stdDeviation', (base * (1 + melt * 3.2)).toFixed(2)); blur2.setAttribute('stdDeviation', (base * (1 + melt * 3.2)).toFixed(2));
  word.style.transform = `skewX(-9deg) scale(${(1 + melt * 0.12).toFixed(3)},${(1 - melt * 0.55).toFixed(3)})`; }
let flyAt = -1;
function fly() { const f = document.getElementById('fly'); if (!f) return; const all = [...P, ...JOBS], n = all.length, r = f.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return; const sp = Math.max(0, Math.min(1, -r.top / (f.offsetHeight - innerHeight))) * (n - 1), W = innerWidth;
  f.querySelectorAll('.cd').forEach((el, i) => { const d = i - sp, near = Math.min(1, Math.abs(d)), side = i % 2 ? 1 : -1;
    const k = d > 0 ? 1 + d * 950 / 1100 : 1, xs = d < 0 ? -0.17 + d * 0.55 : d < 1 ? -0.17 + 0.33 * d : 0.16 + 0.125 * (d - 1), x = xs * W * k, z = -d * 950, ry = 16 - 44 * near; void side;
    const op = d < 0 ? Math.max(0, 1 + d * 2.2) : Math.max(0, Math.min(1, (4.2 - d) / 1.4));
    el.style.opacity = op.toFixed(3); el.style.visibility = op <= 0 ? 'hidden' : 'visible';
    el.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${(d > 0 ? -Math.min(d, 3) * 0.035 * innerHeight * k : 0).toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) rotate(${(sp * 70 + i * 40).toFixed(1)}deg)`; });
  const at = Math.round(sp); if (at !== flyAt) { flyAt = at; const p = all[at];
    document.getElementById('flyinfo').innerHTML = `<div><p class="px">${String(at + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</p><h3 class="cond">${p.n}</h3><p>${p.t}</p><a class="go px" href="#/work/${p.s}">Open ${p.n}</a></div>${shot(p.s)}`; } }
function stack() { live = 0; fly();
  app.querySelectorAll('[data-stretch]').forEach(e => { const q = Math.max(0, Math.min(1, (innerHeight - e.getBoundingClientRect().top) / (innerHeight * 0.8))); e.style.fontStretch = (62 + q * 63).toFixed(1) + '%'; }); }
addEventListener('scroll', () => { if (!live) live = requestAnimationFrame(stack); }, { passive: true });
/* the cursor is a drop and a light, but only while it is near the title, and at most once a frame */
let ptr = null, ptrQ = 0, away = true;
addEventListener('pointermove', e => { ptr = e; if (!ptrQ) ptrQ = requestAnimationFrame(() => { ptrQ = 0; if (!liq) return;
  const r = liq.getBoundingClientRect(), x = ptr.clientX - r.left, y = ptr.clientY - r.top, near = x > -60 && x < r.width + 60 && y > -90 && y < r.height + 90;
  if (!near) { if (!away) { away = true; drop.style.transform = 'translate(-30vw,-30vw)'; } return; } away = false;
  if (!document.body.classList.contains('flat')) { lamp.setAttribute('x', (x / 2).toFixed(0)); lamp.setAttribute('y', (y / 2 - r.height * 0.25).toFixed(0)); }
  drop.style.transform = ptr.pointerType === 'mouse' ? `translate(${x / 2}px,${y / 2}px)` : 'translate(-30vw,-30vw)'; }); });

/* ---- routes, with the title melting from one page into the next ---- */
let melting = false, cls = 0;
function view() { const [a, b] = location.hash.replace(/^#\/?/, '').split('/'); if (a === 'work' && b) { const p = [...P, ...JOBS].find(x => x.s === b); if (p) return pages.project(p); }
  if (a === 'creative' || a === 'play') { location.replace('/creative.html'); return ''; }
  return (pages[a] || pages.home)(); }
function render() { app.innerHTML = view(); scrollTo(0, 0); away = true; flyAt = -1; fit(); stack(); if (document.getElementById('deck')) deckInit(); }
function animate(from, to, ms, done) { const t0 = performance.now(); melting = true; (function f(now) { const k = Math.min(1, (now - t0) / ms); melt = from + (to - from) * (1 - Math.pow(1 - k, 3)); paint(); if (k < 1) requestAnimationFrame(f); else done(); })(t0); }
function go() { if (reduce || !word) return render(); if (melting) return; animate(0, 1, 300, () => { render(); melt = 1; paint(); animate(1, 0, 520, () => { melting = false; }); }); }
addEventListener('hashchange', go);
addEventListener('resize', () => { fit(); stack(); });
/* ---- the record is the only control: move the needle or turn the vinyl ---- */
const PX = -60, PY = -42, ARM = 54, BW = 6.1, distAt = t => Math.hypot(PX + ARM * Math.cos(t * Math.PI / 180), PY + ARM * Math.sin(t * Math.PI / 180));
const angleFor = rad => { let lo = 35.2, hi = 84; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (distAt(m) < rad) lo = m; else hi = m; } return lo; };
const bandT = CLS.map((c, j) => angleFor(47.5 - BW / 2 - j * BW));
let vinRot = 0;
function setCls(i, keepArm) { cls = (i + CLS.length) % CLS.length; const c = CLS[cls], arm = document.getElementById('armG');
  document.getElementById('stage').innerHTML = `<img src="${characters[`../assets/ink/character/durva-${c.pose}.png`]}" alt="Pixel art of Durva as ${c.n}">`;
  document.getElementById('clsName').textContent = c.n; document.getElementById('clsKind').textContent = c.k;
  document.getElementById('abil').innerHTML = c.a.map((a, j) => `<li><kbd>${'QECX'[j]}</kbd><span>${a}</span></li>`).join('');
  app.querySelectorAll('#vin .band').forEach((b, j) => b.classList.toggle('on', j === cls));
  arm.setAttribute('aria-valuenow', cls + 1); arm.setAttribute('aria-valuetext', c.n); if (!keepArm) arm.style.transform = `rotate(${bandT[cls].toFixed(2)}deg)`; }
function deckInit() { const deck = document.getElementById('deck'), vin = document.getElementById('vin'), arm = document.getElementById('armG'); let mode = null, a0 = 0, turn = 0, moved = false;
  const unit = e => { const r = deck.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 100 - 50, (e.clientY - r.top) / r.height * 100 - 50]; };
  arm.addEventListener('pointerdown', e => { mode = 'arm'; arm.classList.add('drag'); arm.setPointerCapture(e.pointerId); e.preventDefault(); });
  vin.addEventListener('pointerdown', e => { const [x, y] = unit(e); mode = 'vin'; a0 = Math.atan2(y, x) * 180 / Math.PI; turn = 0; moved = false; vin.setPointerCapture(e.pointerId); });
  deck.addEventListener('pointermove', e => { if (!mode) return; const [x, y] = unit(e);
    if (mode === 'arm') { const t = Math.max(bandT[4] - 1.5, Math.min(bandT[0] + 2, Math.atan2(y - PY, x - PX) * 180 / Math.PI)); arm.style.transform = `rotate(${t.toFixed(2)}deg)`;
      const j = Math.max(0, Math.min(4, Math.floor((47.5 - distAt(t)) / BW))); if (j !== cls) setCls(j, true); }
    else { const a = Math.atan2(y, x) * 180 / Math.PI; let d = a - a0; if (d > 180) d -= 360; if (d < -180) d += 360; a0 = a; vinRot += d; turn += d; if (Math.abs(turn) > 3) moved = true;
      vin.style.transform = `rotate(${vinRot.toFixed(1)}deg)`; if (turn > 55) { turn -= 55; setCls(cls + 1); } else if (turn < -55) { turn += 55; setCls(cls - 1); } } });
  const end = e => { if (mode === 'arm') { arm.classList.remove('drag'); setCls(cls); }
    else if (mode === 'vin' && !moved) { const b = document.elementFromPoint(e.clientX, e.clientY); if (b && b.classList.contains('band')) setCls(+b.dataset.j); } mode = null; };
  deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', end);
  arm.addEventListener('keydown', e => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { setCls(cls + d); e.preventDefault(); } });
  vin.style.transform = `rotate(${vinRot.toFixed(1)}deg)`; setCls(cls); }
app.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (a && a.getAttribute('href') === (location.hash || '#/')) { e.preventDefault(); const o = app.querySelector('.fly, .over'); if (o) o.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } });
document.fonts.ready.then(render);
})();

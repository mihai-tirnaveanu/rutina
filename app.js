(() => {
'use strict';
/* ============================================================
   Rutina de antrenament — date salvate într-un repo GitHub privat
   ============================================================ */

const DEFAULT_REPO = { owner: 'mihai-tirnaveanu', repo: 'rutina-date' };
const DEFAULT_ROUTINE = {
  subtitle: '4 zile · ordine: Leg press → Deadlift → Squat → Back extension · un set aproape de eșec / exercițiu',
  days: [
    { id: 'd1', title: 'Deadlift', exercises: [
      { id: 'd1e1', name: 'Deadlift', target: '5-8', superset: '' },
      { id: 'd1e2', name: 'Lat pullover', target: '6-10', superset: 'A' },
      { id: 'd1e3', name: 'Lat pulldown', target: '6-10', superset: 'A' },
      { id: 'd1e4', name: 'Reverse flye', target: '10-15', superset: '' },
      { id: 'd1e5', name: 'Wrist curl', target: '12-20', superset: '' },
      { id: 'd1e6', name: 'Decline crunch', target: '15-25', superset: '' } ] },
    { id: 'd2', title: 'Squat', exercises: [
      { id: 'd2e1', name: 'Leg extension', target: '12-20', superset: 'A' },
      { id: 'd2e2', name: 'Squat', target: '12-20', superset: 'A' },
      { id: 'd2e3', name: 'Chest flye', target: 'reps mici', superset: 'B' },
      { id: 'd2e4', name: 'Incline press', target: 'reps mici', superset: 'B' },
      { id: 'd2e5', name: 'Lateral raise', target: '12-20', superset: 'C' },
      { id: 'd2e6', name: 'OHP', target: '6-10', superset: 'C' } ] },
    { id: 'd3', title: 'Back extension', exercises: [
      { id: 'd3e1', name: 'Back extension', target: '15-25', superset: '' },
      { id: 'd3e2', name: 'Leg curl', target: '12-20', superset: '' },
      { id: 'd3e3', name: 'Kelso shrug', target: '12-20', superset: 'A' },
      { id: 'd3e4', name: 'Chest supported row 45°', target: '10-15', superset: 'A' },
      { id: 'd3e5', name: 'Chinup', target: '6-10', superset: '' },
      { id: 'd3e6', name: 'QL raise / side bend', target: '15-25', superset: '' } ] },
    { id: 'd4', title: 'Leg press', exercises: [
      { id: 'd4e1', name: 'Leg extension', target: '12-20', superset: 'A' },
      { id: 'd4e2', name: 'Leg press', target: '12-20', superset: 'A' },
      { id: 'd4e3', name: 'Calf raises', target: '15-25', superset: '' },
      { id: 'd4e4', name: 'Overhead extension', target: '6-10', superset: 'B' },
      { id: 'd4e5', name: 'Dips', target: '6-10', superset: 'B' },
      { id: 'd4e6', name: 'Push-up plus', target: '15-25', superset: '' } ] }
  ]
};
const MAX_FILE = 45 * 1024 * 1024;

/* ---------- small helpers ---------- */
const IC = {
  cam:'<svg class="i" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  x:'<svg class="i" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  up:'<svg class="i" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>',
  down:'<svg class="i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  trash:'<svg class="i" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  play:'<svg class="i" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  edit:'<svg class="i" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
};
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid = () => Math.random().toString(36).slice(2, 8);
const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const asDate = iso => { const [y, m, d] = String(iso || '').split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const fmtLong = iso => iso ? asDate(iso).toLocaleDateString('ro-RO', {weekday:'short', day:'numeric', month:'short', year:'numeric'}) : '—';
const fmtShort = iso => iso ? asDate(iso).toLocaleDateString('ro-RO', {day:'2-digit', month:'short'}) : '—';
const parseNum = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
const fmtKg = v => { if (v === '' || v == null) return ''; const n = parseNum(v); return n == null ? String(v) : n.toLocaleString('ro-RO', {maximumFractionDigits: 2}); };
const norm = s => String(s || '').trim().toLowerCase();
const slug = s => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'x';
const ls = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k){ try { localStorage.removeItem(k); } catch {} }
};
function bytesToB64(bytes){
  let s = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}
const textToB64 = t => bytesToB64(new TextEncoder().encode(t));
const b64ToText = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), c => c.charCodeAt(0)));
const EXT_TYPE = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif', heic:'image/heic', mp4:'video/mp4', mov:'video/quicktime', webm:'video/webm', m4v:'video/mp4', '3gp':'video/3gpp' };
const extOf = p => (String(p).split('.').pop() || '').toLowerCase();

/* ---------- IndexedDB: poze/videouri încă nesalvate ---------- */
const idb = {
  _db: null,
  open(){ if (this._db) return this._db; this._db = new Promise((res, rej) => { const r = indexedDB.open('rutina', 1); r.onupgradeneeded = () => r.result.createObjectStore('pending'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); return this._db; },
  async tx(mode, fn){ try { const db = await this.open(); return await new Promise((res, rej) => { const t = db.transaction('pending', mode); const st = t.objectStore('pending'); const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); } catch { return null; } },
  put(k, v){ return this.tx('readwrite', st => st.put(v, k)); },
  get(k){ return this.tx('readonly', st => st.get(k)); },
  del(k){ return this.tx('readwrite', st => st.delete(k)); }
};

/* ---------- GitHub API ---------- */
const GH = {
  cfg: ls.get('rt.gh'),
  enc: p => p.split('/').map(encodeURIComponent).join('/'),
  async req(method, path, body, accept){
    let r;
    try {
      r = await fetch('https://api.github.com' + path, {
        method, cache: 'no-store',
        headers: Object.assign({ Authorization: 'Bearer ' + this.cfg.token, Accept: accept || 'application/vnd.github+json' }, body ? {'Content-Type': 'application/json'} : {}),
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) { const err = new Error('offline'); err.status = 0; throw err; }
    if (!r.ok) { const err = new Error('http ' + r.status); err.status = r.status; try { err.data = await r.json(); } catch {} throw err; }
    return r;
  },
  base(){ return `/repos/${encodeURIComponent(this.cfg.owner)}/${encodeURIComponent(this.cfg.repo)}`; },
  async check(){ const r = await this.req('GET', this.base()); return r.json(); },
  async loadAll(){
    // un singur request GraphQL: rutina.json + toate antrenamentele
    try {
      const q = `query($o:String!,$r:String!){repository(owner:$o,name:$r){
        cfg:object(expression:"HEAD:rutina.json"){... on Blob{oid text}}
        ses:object(expression:"HEAD:antrenamente"){... on Tree{entries{name oid object{... on Blob{text}}}}}}}`;
      const r = await this.req('POST', '/graphql', {query: q, variables: {o: this.cfg.owner, r: this.cfg.repo}});
      const j = await r.json();
      if (j.errors || !j.data || !j.data.repository) throw new Error('graphql');
      const repo = j.data.repository;
      return {
        cfg: repo.cfg ? {sha: repo.cfg.oid, text: repo.cfg.text} : null,
        files: (repo.ses && repo.ses.entries || []).filter(e => e.name.endsWith('.json') && e.object && e.object.text != null)
          .map(e => ({path: 'antrenamente/' + e.name, sha: e.oid, text: e.object.text}))
      };
    } catch (e) {
      if (e.status === 401) throw e;
      return this.loadAllRest();
    }
  },
  async loadAllRest(){
    const out = {cfg: null, files: []};
    try { const r = await this.req('GET', this.base() + '/contents/rutina.json'); const j = await r.json(); out.cfg = {sha: j.sha, text: b64ToText(j.content)}; }
    catch (e) { if (e.status !== 404) throw e; }
    let list = [];
    try { const r = await this.req('GET', this.base() + '/contents/antrenamente'); list = await r.json(); }
    catch (e) { if (e.status !== 404) throw e; }
    for (const f of list.filter(f => f.type === 'file' && f.name.endsWith('.json'))) {
      const r = await this.req('GET', this.base() + '/contents/' + this.enc(f.path), null, 'application/vnd.github.raw+json');
      out.files.push({path: f.path, sha: f.sha, text: await r.text()});
    }
    return out;
  },
  // toate scrierile trec printr-o coadă: GitHub refuză commit-uri paralele pe aceeași ramură
  _q: Promise.resolve(),
  queue(fn){ const p = this._q.then(fn, fn); this._q = p.catch(() => {}); return p; },
  put(path, b64, message, sha){
    return this.queue(async () => {
      const go = s => this.req('PUT', this.base() + '/contents/' + this.enc(path), Object.assign({message, content: b64}, s ? {sha: s} : {}));
      let r;
      try { r = await go(sha); }
      catch (e) {
        if (e.status !== 409 && e.status !== 422) throw e;
        const cur = await this.sha(path); // fișierul s-a schimbat între timp: reîncerc cu sha-ul actual
        r = await go(cur);
      }
      const j = await r.json(); return j.content.sha;
    });
  },
  async sha(path){ try { const r = await this.req('GET', this.base() + '/contents/' + this.enc(path)); return (await r.json()).sha; } catch (e) { if (e.status === 404) return null; throw e; } },
  del(path, message, sha){
    return this.queue(async () => {
      const s = sha || await this.sha(path); if (!s) return;
      try { await this.req('DELETE', this.base() + '/contents/' + this.enc(path), {message, sha: s}); }
      catch (e) { if (e.status !== 404) throw e; }
    });
  },
  async raw(path){
    const r = await this.req('GET', this.base() + '/contents/' + this.enc(path), null, 'application/vnd.github.raw+json');
    return r.blob();
  }
};

/* ---------- media: încărcare cu cache ---------- */
const mediaURL = new Map();
async function mediaSrc(path){
  if (mediaURL.has(path)) return mediaURL.get(path);
  const p = (async () => {
    const key = 'https://rutina.local/' + GH.cfg.repo + '/' + path;
    let blob = null;
    try { const c = await caches.open('rutina-media'); const hit = await c.match(key); if (hit) blob = await hit.blob(); } catch {}
    if (!blob) {
      blob = await GH.raw(path);
      try { const c = await caches.open('rutina-media'); await c.put(key, new Response(blob)); } catch {}
    }
    const t = EXT_TYPE[extOf(path)];
    if (t && blob.type !== t) blob = new Blob([blob], {type: t});
    return URL.createObjectURL(blob);
  })();
  mediaURL.set(path, p);
  p.catch(() => mediaURL.delete(path));
  return p;
}
async function hydrateThumbs(root){
  for (const el of root.querySelectorAll('[data-hydrate]')) {
    const path = el.dataset.hydrate; el.removeAttribute('data-hydrate');
    try { const u = await mediaSrc(path); const img = document.createElement('img'); img.src = u; img.alt = ''; el.querySelector('.ph')?.remove(); el.prepend(img); }
    catch { const ph = el.querySelector('.ph'); if (ph) ph.textContent = 'nu se încarcă'; }
  }
}

/* ---------- state ---------- */
const S = { status: 'boot', days: [], subtitle: '', cfgSha: null, sessions: [], dayId: ls.get('rt.day'), loading: false, offline: false };
let E = null, LB = null;

let toastT;
function toast(msg, ms){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms || 2800); }

const curDay = () => S.days.find(d => d.id === S.dayId) || S.days[0] || null;
const sessionsOf = dayId => S.sessions.filter(s => s.dayId === dayId);
const hasData = e => e && (String(e.kg||'').trim() || String(e.reps||'').trim() || String(e.note||'').trim() || (e.media||[]).length);
function lastFor(day, ex, beforeDate, excludeId){
  for (const s of S.sessions) {
    if (excludeId && s.id === excludeId) continue;
    if (beforeDate && s.date > beforeDate) continue;
    const e = s.entries && s.entries[ex.id];
    if (s.dayId === day.id && e && (e.kg || e.reps)) return {s, e};
  }
  return null;
}
function historyByName(name){
  const out = [], n = norm(name);
  for (const s of S.sessions) {
    const day = S.days.find(d => d.id === s.dayId); if (!day) continue;
    for (const ex of (day.exercises || [])) {
      if (norm(ex.name) !== n) continue;
      const e = s.entries && s.entries[ex.id];
      if (hasData(e)) out.push({s, day, ex, e});
    }
  }
  return out;
}

/* ---------- load ---------- */
function applyData(d){
  let cfg = null;
  if (d.cfg) { try { cfg = JSON.parse(d.cfg.text); } catch {} }
  S.cfgSha = d.cfg ? d.cfg.sha : null;
  S.days = (cfg && Array.isArray(cfg.days)) ? cfg.days : [];
  S.subtitle = cfg ? (cfg.subtitle || '') : '';
  S.sessions = d.files.map(f => { try { const j = JSON.parse(f.text); return Object.assign({entries: {}}, j, {id: f.path.split('/').pop().replace(/\.json$/, ''), path: f.path, sha: f.sha}); } catch { return null; } })
    .filter(Boolean).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
async function load(quiet){
  if (S.loading) return; S.loading = true; setRefreshing(true);
  try {
    const d = await GH.loadAll();
    if (!d.cfg) {
      // prima pornire: creez rutina.json cu rutina din Excel
      const text = JSON.stringify(DEFAULT_ROUTINE, null, 2);
      const sha = await GH.put('rutina.json', textToB64(text), 'Rutina inițială', null);
      d.cfg = {sha, text};
    }
    applyData(d); S.status = 'ready'; S.offline = false;
    ls.set('rt.cache', {repo: GH.cfg.owner + '/' + GH.cfg.repo, d});
  } catch (e) {
    if (e.status === 401 || e.status === 403) { S.status = 'login'; S.loginErr = 'Tokenul nu mai e valid sau nu are acces la repo. Pune unul nou.'; }
    else if (e.status === 404) { S.status = 'login'; S.loginErr = `Nu găsesc repo-ul ${GH.cfg.owner}/${GH.cfg.repo}, sau tokenul nu are acces la el.`; }
    else { S.offline = true; if (S.status !== 'ready') S.status = 'ready'; if (!quiet) toast('Fără conexiune. Vezi ultimele date salvate pe telefon.'); }
  } finally { S.loading = false; setRefreshing(false); render(); }
}
function setRefreshing(on){ const b = $('#refreshBtn'); if (b) b.classList.toggle('spin', on); }

/* ---------- login screen ---------- */
function renderLogin(){
  $('#top').hidden = true; $('#fab').hidden = true;
  const c = GH.cfg || {};
  $('#main').innerHTML = `<form class="login" id="loginForm" autocomplete="off">
    <h1>Rutină de antrenament</h1>
    <p>Conectează aplicația la repo-ul tău privat de pe GitHub. Tokenul rămâne salvat doar pe acest telefon.</p>
    <ol>
      <li>Deschide <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → Fine-grained token nou</a>.</li>
      <li>La <b>Repository access</b> alege <b>Only select repositories</b> → <b>${esc(c.repo || DEFAULT_REPO.repo)}</b>.</li>
      <li>La <b>Permissions → Repository → Contents</b> alege <b>Read and write</b>.</li>
      <li>La <b>Expiration</b> alege cât vrei (poți pune și fără expirare), apoi <b>Generate token</b> și copiază-l aici.</li>
    </ol>
    <label class="f">Token<input class="inp" id="l-token" type="password" placeholder="github_pat_…" autocapitalize="off" spellcheck="false" required></label>
    <div class="kr"><label class="f">Cont<input class="inp" id="l-owner" value="${esc(c.owner || DEFAULT_REPO.owner)}" autocapitalize="off" spellcheck="false"></label>
    <label class="f">Repo date<input class="inp" id="l-repo" value="${esc(c.repo || DEFAULT_REPO.repo)}" autocapitalize="off" spellcheck="false"></label></div>
    ${S.loginErr ? `<div class="err">${esc(S.loginErr)}</div>` : ''}
    <button class="primary" type="submit" id="l-go">Conectează</button>
  </form>`;
}
async function doLogin(ev){
  ev.preventDefault();
  const token = $('#l-token').value.trim(), owner = $('#l-owner').value.trim(), repo = $('#l-repo').value.trim();
  if (!token) return;
  const btn = $('#l-go'); btn.disabled = true; btn.textContent = 'Se verifică…';
  GH.cfg = {token, owner, repo};
  try {
    const info = await GH.check();
    if (info.permissions && !info.permissions.push) throw Object.assign(new Error(), {status: 403});
    ls.set('rt.gh', GH.cfg); S.loginErr = ''; S.status = 'loading'; render();
    if (!info.private) toast('Atenție: repo-ul de date e public. Fă-l privat din setările GitHub.', 6000);
    await load();
  } catch (e) {
    S.loginErr = e.status === 401 ? 'Token greșit sau expirat.' : e.status === 404 ? `Nu găsesc ${owner}/${repo}, sau tokenul nu are acces la el.` : e.status === 403 ? 'Tokenul nu are drept de scriere (Contents: Read and write).' : 'Nu mă pot conecta. Verifică internetul.';
    GH.cfg = ls.get('rt.gh'); S.status = 'login'; render();
    $('#l-token').value = token; $('#l-owner').value = owner; $('#l-repo').value = repo;
  }
}

/* ---------- main render ---------- */
function render(){
  if (S.status === 'login') return renderLogin();
  $('#top').hidden = false;
  $('#subtitle').textContent = S.subtitle || '';
  renderTabs();
  const main = $('#main');
  $('#fab').hidden = true;
  if (S.status !== 'ready') { main.innerHTML = `<div class="skel" style="margin-top:22px"></div><div class="skel" style="margin-top:10px"></div>`; return; }
  const day = curDay();
  let h = S.offline ? `<div class="offline">Fără conexiune. Afișez ultimele date de pe telefon; salvarea merge când revine internetul.</div>` : '';
  if (!day) {
    main.innerHTML = h + `<div class="notice" style="margin-top:22px"><strong>Nicio zi de antrenament</strong>Adaugă prima zi și exercițiile ei.<button class="primary" data-act="add-day">Adaugă o zi</button></div>`;
    return;
  }
  const idx = S.days.indexOf(day) + 1, exs = day.exercises || [], sess = sessionsOf(day.id);
  h += `<div class="dayhead"><h2><small>ZIUA ${idx}</small>${esc(day.title || '')}</h2><button class="ghost" data-act="edit-day">${IC.edit} Editează</button></div>`;
  if (!exs.length) h += `<div class="notice"><strong>Ziua nu are exerciții</strong>Apasă „Editează” ca să le adaugi.</div>`;
  else {
    h += `<div class="exlist">`;
    exs.forEach((ex, i) => {
      const prevSS = i > 0 && ex.superset && exs[i-1].superset === ex.superset, nextSS = i < exs.length - 1 && ex.superset && exs[i+1].superset === ex.superset;
      const cls = ex.superset ? 'ssrow' + (!prevSS ? ' ssfirst' : '') + (!nextSS ? ' sslast' : '') : '';
      const last = lastFor(day, ex);
      h += `<button class="ex ${cls}" data-act="hist" data-name="${esc(ex.name)}">
        <span class="idx">${i+1}</span>
        <span class="nm">${esc(ex.name)}<span class="meta"><span class="pill num">${esc(ex.target || '—')} reps</span>${ex.superset ? `<span class="pill ss">superset ${esc(ex.superset)}</span>` : ''}</span></span>
        <span class="last">${last ? `<strong>${esc(fmtKg(last.e.kg) || '–')}<span style="color:var(--muted);font-size:.9rem"> kg × </span>${esc(last.e.reps || '–')}</strong><em>${esc(fmtShort(last.s.date))}</em>` : `<em>fără date</em>`}</span>
      </button>`;
    });
    h += `</div>`;
  }
  h += `<div class="sect"><h3>Istoric</h3><span>${sess.length ? sess.length + (sess.length === 1 ? ' antrenament' : ' antrenamente') : ''}</span></div>`;
  if (!sess.length) h += `<div class="notice">Niciun antrenament salvat pentru ziua asta.<br>Apasă „Antrenament nou” jos ca să-l notezi pe primul.</div>`;
  else {
    h += `<div class="gridbox"><table class="grid"><thead><tr><th class="exc">Exercițiu</th>`;
    sess.forEach(s => { h += `<th><button data-act="open-session" data-id="${esc(s.id)}">${esc(fmtShort(s.date))}</button></th>`; });
    h += `</tr></thead><tbody>`;
    exs.forEach(ex => {
      h += `<tr><td class="exc">${esc(ex.name)}</td>`;
      sess.forEach(s => {
        const e = s.entries && s.entries[ex.id];
        if (!hasData(e)) { h += `<td class="cell empty-c">·</td>`; return; }
        const m = (e.media || []).length;
        h += `<td class="cell"><b>${esc(fmtKg(e.kg) || '–')}</b><span class="x">×</span><b>${esc(e.reps || '–')}</b>${m ? `<span class="ic">${IC.cam}${m}</span>` : ''}${e.note ? `<span class="nt">${esc(e.note.length > 60 ? e.note.slice(0, 58) + '…' : e.note)}</span>` : ''}</td>`;
      });
      h += `</tr>`;
    });
    h += `</tbody></table></div>`;
  }
  main.innerHTML = h;
  $('#fab').hidden = !exs.length;
}
function renderTabs(){
  const t = $('#tabs');
  if (S.status !== 'ready') { t.innerHTML = ''; return; }
  const cur = curDay();
  t.innerHTML = S.days.map((d, i) => `<button class="tab" role="tab" aria-selected="${!!cur && d.id === cur.id}" data-act="day" data-id="${esc(d.id)}"><b>Z${i+1}</b><span>${esc(d.title || 'Ziua ' + (i+1))}</span></button>`).join('')
    + (S.days.length ? `<button class="tab add" data-act="add-day">+ Zi</button>` : '');
}

/* ---------- sheet plumbing ---------- */
function openSheet(title){ $('#sh-title').textContent = title; $('#sheet').hidden = false; $('#sh-body').scrollTop = 0; document.body.style.overflow = 'hidden'; }
function closeSheet(){
  if (E && E.kind === 'session') Object.values(E.local).forEach(u => URL.revokeObjectURL(u));
  $('#sheet').hidden = true; $('#sh-foot').hidden = true; $('#sh-inner').innerHTML = ''; document.body.style.overflow = ''; E = null;
}
function setFoot(html){ $('#sh-foot-row').innerHTML = html; $('#sh-foot').hidden = !html; }

/* ---------- session editor ---------- */
async function openSession(id){
  const isNew = !id;
  const src = isNew ? null : S.sessions.find(s => s.id === id);
  const day = isNew ? curDay() : S.days.find(d => d.id === (src || {}).dayId);
  if (!day) { toast('Ziua acestui antrenament a fost ștearsă.'); return; }
  const dkey = isNew ? 'rt.draft.new.' + day.id : 'rt.draft.' + id;
  const draft = ls.get(dkey);
  const base = src ? JSON.parse(JSON.stringify({date: src.date, entries: src.entries || {}, note: src.note || ''})) : {date: todayISO(), entries: {}, note: ''};
  const st = draft && draft.dayId === day.id ? draft : base;
  E = { kind: 'session', isNew, id: isNew ? null : id, src, dkey, dayId: day.id, date: st.date || todayISO(), entries: st.entries || {}, note: st.note || '',
        removed: new Set(draft?.removed || []), local: {}, errors: {}, dirty: !!draft, saving: false, progress: '', confirmDel: false, confirmClose: false };
  // recuperez fișierele nesalvate din IndexedDB
  for (const e of Object.values(E.entries)) for (const m of (e.media || [])) {
    if (m.tmp) { const b = await idb.get(m.tmp); if (b) E.local[m.tmp] = URL.createObjectURL(b); else m.lost = true; }
  }
  for (const e of Object.values(E.entries)) if (e.media) e.media = e.media.filter(m => !m.lost);
  openSheet(isNew ? 'Antrenament nou' : fmtLong(E.date));
  renderSessionEditor();
  if (draft) toast('Am recuperat modificările nesalvate');
}
const entry = exId => E.entries[exId] || (E.entries[exId] = {kg: '', reps: '', note: '', media: []});
function saveDraft(){ if (!E || E.kind !== 'session') return; E.dirty = true; ls.set(E.dkey, {dayId: E.dayId, date: E.date, entries: E.entries, note: E.note, removed: [...E.removed]}); updateFoot(); }
function renderSessionEditor(){
  const day = S.days.find(d => d.id === E.dayId), exs = day.exercises || [];
  let h = `<div class="kr"><label class="f">Data<input class="inp" type="date" id="f-date" value="${esc(E.date)}"></label><label class="f">Ziua<input class="inp" id="f-day" value="${esc('Z' + (S.days.indexOf(day)+1) + ' · ' + (day.title||''))}" disabled></label></div>`;
  exs.forEach((ex, i) => {
    const e = E.entries[ex.id] || {}, last = lastFor(day, ex, E.date, E.id);
    h += `<div class="card ${ex.superset ? 'ss' : ''}">
      <div class="card-h"><div class="t">${i+1}. ${esc(ex.name)}<small><span class="pill num">țintă ${esc(ex.target || '—')}</span>${ex.superset ? `<span class="pill ss">superset ${esc(ex.superset)}</span>` : ''}</small></div>
      <div class="prev">${last ? `data trecută<br><b>${esc(fmtKg(last.e.kg) || '–')} kg × ${esc(last.e.reps || '–')}</b>` : 'prima dată'}</div></div>
      <div class="kr"><label class="f">Kg<input class="inp big num" inputmode="decimal" id="kg-${esc(ex.id)}" data-f="kg" data-ex="${esc(ex.id)}" value="${esc(e.kg || '')}" placeholder="${last ? esc(fmtKg(last.e.kg)) : '0'}"></label>
      <label class="f">Reps<input class="inp big num" inputmode="numeric" id="reps-${esc(ex.id)}" data-f="reps" data-ex="${esc(ex.id)}" value="${esc(e.reps || '')}" placeholder="${last ? esc(last.e.reps) : '0'}"></label></div>
      <label class="f">Observații<textarea class="inp" id="note-${esc(ex.id)}" data-f="note" data-ex="${esc(ex.id)}" rows="2" placeholder="Formă, senzații, setări aparat…">${esc(e.note || '')}</textarea></label>
      <div class="media" id="media-${esc(ex.id)}"></div><div class="err" id="err-${esc(ex.id)}" hidden></div>
    </div>`;
  });
  h += `<label class="f">Notă generală<textarea class="inp" id="f-note" rows="3" placeholder="Somn, energie, durere…">${esc(E.note)}</textarea></label>`;
  if (!E.isNew) h += `<div id="delzone"></div>`;
  $('#sh-inner').innerHTML = h;
  exs.forEach(ex => renderMedia(ex.id));
  if (!E.isNew) renderDelZone();
  updateFoot();
}
function renderDelZone(){
  const z = $('#delzone'); if (!z) return;
  z.innerHTML = E.confirmDel
    ? `<div class="confirm"><span style="flex:1">Ștergi definitiv antrenamentul și pozele lui?</span><button class="no" data-act="del-no">Nu</button><button class="yes" data-act="del-yes">Șterge</button></div>`
    : `<button class="danger" data-act="del-ask">Șterge antrenamentul</button>`;
}
function thumbHtml(m, act, attrs){
  if (m.tmp) {
    const u = E && E.local[m.tmp];
    const inner = m.kind === 'video' ? `<video src="${u}#t=0.1" preload="metadata" muted playsinline></video><span class="play">${IC.play}</span>` : `<img src="${u}" alt="">`;
    return `<button class="thumb" data-act="${act}" ${attrs}>${inner}<span class="pend">nesalvat</span>`;
  }
  if (m.kind === 'video') return `<button class="thumb" data-act="${act}" ${attrs}><span class="play" style="background:var(--sunk);color:var(--muted)">${IC.play.replace('<svg', '<svg style="fill:var(--muted)"')}</span>`;
  return `<button class="thumb" data-act="${act}" ${attrs} data-hydrate="${esc(m.path)}"><span class="ph">…</span>`;
}
function renderMedia(exId){
  const box = document.getElementById('media-' + exId); if (!box) return;
  const e = E.entries[exId] || {};
  let h = (e.media || []).map((m, i) => thumbHtml(m, 'view', `data-ex="${esc(exId)}" data-i="${i}"`) + `<span class="rm" data-act="rm-media" data-ex="${esc(exId)}" data-i="${i}" aria-label="Elimină">${IC.x}</span></button>`).join('');
  h += `<button class="addmedia" data-act="pick" data-ex="${esc(exId)}">${IC.cam}Poză / video</button>`;
  box.innerHTML = h;
  hydrateThumbs(box);
  const er = document.getElementById('err-' + exId); if (er) { er.textContent = E.errors[exId] || ''; er.hidden = !E.errors[exId]; }
}
function updateFoot(){
  if (!E || E.kind !== 'session') return;
  if (E.confirmClose) { setFoot(`<span class="status" style="flex:1">Renunți la modificările nesalvate?</span><button class="ghost" data-act="keep-edit">Rămân</button><button class="danger" style="width:auto" data-act="discard">Renunț</button>`); return; }
  setFoot(`<span class="status">${E.saving ? esc(E.progress || 'Se salvează…') : E.dirty ? 'Nesalvat' : 'Salvat'}</span><button class="primary" data-act="save-session" ${E.saving ? 'disabled' : ''}>${E.saving ? 'Se salvează…' : 'Salvează'}</button>`);
}
async function saveSession(){
  if (!E || E.saving) return;
  const ed = E;
  ed.saving = true; ed.progress = ''; updateFoot();
  const day = S.days.find(d => d.id === ed.dayId);
  const date = ed.date || todayISO();
  const id = ed.id || `${date}-z${S.days.indexOf(day) + 1}-${rid()}`;
  try {
    // 1. urc pozele/videourile noi
    const pend = [];
    for (const [exId, e] of Object.entries(ed.entries)) (e.media || []).forEach(m => { if (m.tmp) pend.push({exId, m}); });
    let n = 0;
    for (const {exId, m} of pend) {
      n++; ed.progress = `Se încarcă ${m.kind === 'video' ? 'video' : 'poza'} ${n}/${pend.length}…`; updateFoot();
      const blob = await idb.get(m.tmp);
      if (!blob) { entry(exId).media = entry(exId).media.filter(x => x !== m); continue; }
      const ex = (day.exercises || []).find(x => x.id === exId);
      const path = `media/${date}-${slug(ex ? ex.name : exId)}-${rid()}.${m.ext}`;
      const b64 = bytesToB64(new Uint8Array(await blob.arrayBuffer()));
      await GH.put(path, b64, `Media ${date} ${ex ? ex.name : ''}`.trim(), null);
      try { const c = await caches.open('rutina-media'); await c.put('https://rutina.local/' + GH.cfg.repo + '/' + path, new Response(blob)); } catch {}
      const i = entry(exId).media.indexOf(m);
      entry(exId).media[i] = {path, kind: m.kind};
      await idb.del(m.tmp);
      saveDraft();
    }
    // 2. salvez antrenamentul
    ed.progress = 'Se salvează antrenamentul…'; updateFoot();
    const entries = {};
    for (const [k, v] of Object.entries(ed.entries)) {
      if (!hasData(v)) continue;
      const ex = (day.exercises || []).find(x => x.id === k);
      entries[k] = {name: ex ? ex.name : (v.name || ''), kg: String(v.kg||'').trim(), reps: String(v.reps||'').trim(), note: String(v.note||'').trim(), media: (v.media || []).filter(m => m.path).map(m => ({path: m.path, kind: m.kind}))};
    }
    const prev = ed.src;
    const body = {date, dayId: ed.dayId, day: `Ziua ${S.days.indexOf(day) + 1} — ${day.title}`, note: ed.note.trim(), entries, createdAt: prev?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()};
    const path = prev ? prev.path : `antrenamente/${id}.json`;
    const sha = await GH.put(path, textToB64(JSON.stringify(body, null, 2)), `${prev ? 'Modific' : 'Antrenament'} ${date} — ${day.title}`, prev ? prev.sha : null);
    // 3. șterg fișierele scoase din antrenament
    for (const p of ed.removed) { try { await GH.del(p, `Șterg ${p}`); } catch {} }
    ls.del(ed.dkey);
    const rec = Object.assign({}, body, {id, path, sha});
    S.sessions = S.sessions.filter(s => s.id !== id).concat(rec).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    cacheNow();
    if (E === ed) closeSheet();
    render(); toast('Antrenament salvat');
  } catch (e) {
    ed.saving = false; ed.progress = ''; if (E === ed) updateFoot();
    toast(e.status === 0 ? 'Fără internet. Modificările rămân pe telefon; încearcă din nou.' : e.status === 413 || e.status === 422 ? 'Fișier prea mare pentru GitHub.' : e.status === 401 ? 'Tokenul a expirat. Conectează-te din nou din Setări.' : 'Nu s-a salvat. Încearcă din nou.', 4500);
  }
}
function cacheNow(){
  ls.set('rt.cache', {repo: GH.cfg.owner + '/' + GH.cfg.repo, d: {
    cfg: {sha: S.cfgSha, text: JSON.stringify({subtitle: S.subtitle, days: S.days})},
    files: S.sessions.map(s => { const {id, path, sha, ...rest} = s; return {path, sha, text: JSON.stringify(rest)}; })
  }});
}
async function discardSession(){
  const tmps = []; for (const e of Object.values(E.entries)) (e.media || []).forEach(m => m.tmp && tmps.push(m.tmp));
  ls.del(E.dkey); closeSheet();
  for (const t of tmps) await idb.del(t);
}
async function deleteSession(){
  const s = E.src; if (!s) return;
  E.saving = true; E.progress = 'Se șterge…'; updateFoot();
  try {
    await GH.del(s.path, `Șterg antrenamentul ${s.date}`, s.sha);
    const paths = []; Object.values(s.entries || {}).forEach(e => (e.media || []).forEach(m => m.path && paths.push(m.path)));
    for (const p of paths) { try { await GH.del(p, `Șterg ${p}`); } catch {} }
  } catch (e) { E.saving = false; updateFoot(); toast('Nu s-a putut șterge. Încearcă din nou.'); return; }
  const tmps = []; for (const e of Object.values(E.entries)) (e.media || []).forEach(m => m.tmp && tmps.push(m.tmp));
  for (const t of tmps) await idb.del(t);
  ls.del(E.dkey);
  S.sessions = S.sessions.filter(x => x.id !== s.id); cacheNow();
  closeSheet(); render(); toast('Antrenament șters');
}

/* ---------- alegere fișiere ---------- */
let pickFor = null;
async function toJpeg(file){
  if (!/^image\//.test(file.type) || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file, {imageOrientation: 'from-image'});
    const sc = Math.min(1, 2048 / Math.max(bmp.width, bmp.height));
    if (sc === 1 && file.size < 1.5e6 && /jpeg|png|webp/.test(file.type)) { bmp.close?.(); return file; }
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
    return (await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85))) || file;
  } catch { return file; }
}
async function addFiles(exId, files){
  if (!E) return;
  E.errors[exId] = '';
  for (const f of files) {
    const kind = f.type.startsWith('video') || /\.(mp4|mov|webm|m4v|3gp)$/i.test(f.name) ? 'video' : 'image';
    let blob = f;
    if (kind === 'image') blob = await toJpeg(f);
    if (blob.size > MAX_FILE) { E.errors[exId] = `„${f.name}” are ${(blob.size / 1048576).toFixed(0)} MB. Maximul e 45 MB: filmează mai scurt sau la 720p.`; continue; }
    const ext = blob.type === 'image/jpeg' ? 'jpg' : (extOf(f.name) || (kind === 'video' ? 'mp4' : 'jpg'));
    const tmp = 't' + Date.now().toString(36) + rid();
    await idb.put(tmp, blob);
    E.local[tmp] = URL.createObjectURL(blob);
    entry(exId).media = [...(entry(exId).media || []), {tmp, kind, ext}];
  }
  saveDraft(); renderMedia(exId);
}
async function removeMedia(exId, i){
  const e = entry(exId), m = (e.media || [])[i]; if (!m) return;
  e.media = e.media.filter((_, j) => j !== i);
  if (m.tmp) { await idb.del(m.tmp); URL.revokeObjectURL(E.local[m.tmp]); delete E.local[m.tmp]; }
  else E.removed.add(m.path);
  saveDraft(); renderMedia(exId);
}

/* ---------- lightbox ---------- */
function openLB(list, i, local){ LB = {list, i, local: local || {}}; $('#lb').hidden = false; drawLB(); }
async function drawLB(){
  const st = $('#lb-stage'), m = LB.list[LB.i], me = LB;
  $('#lb-count').textContent = LB.list.length > 1 ? `${LB.i + 1} / ${LB.list.length}` : '';
  st.innerHTML = `<span class="loading">Se încarcă…</span>`;
  let u;
  try { u = m.tmp ? LB.local[m.tmp] : await mediaSrc(m.path); } catch { if (LB === me) st.innerHTML = `<span class="loading">Nu s-a putut încărca.</span>`; return; }
  if (LB !== me || LB.list[LB.i] !== m) return;
  st.innerHTML = m.kind === 'video' ? `<video src="${u}" controls playsinline autoplay></video>` : `<img src="${u}" alt="">`;
}
function closeLB(){ $('#lb').hidden = true; $('#lb-stage').innerHTML = ''; LB = null; }

/* ---------- istoric exercițiu ---------- */
function openHistory(name){
  const rows = historyByName(name);
  E = {kind: 'hist', rows};
  openSheet(name); setFoot('');
  if (!rows.length) { $('#sh-inner').innerHTML = `<div class="notice">Nimic notat încă la ${esc(name)}.</div>`; return; }
  let h = `<div class="hist">`;
  rows.forEach((r, ri) => {
    const nx = rows[ri + 1]; let trend = '';
    if (nx) {
      const a = parseNum(r.e.kg), b = parseNum(nx.e.kg), ra = parseInt(r.e.reps), rb = parseInt(nx.e.reps);
      if (a != null && b != null && a !== b) trend = a > b ? '<span class="trend-up">▲</span>' : '<span class="trend-down">▼</span>';
      else if (a === b && ra && rb && ra !== rb) trend = ra > rb ? '<span class="trend-up">▲</span>' : '<span class="trend-down">▼</span>';
    }
    h += `<div class="hrow"><div class="top2"><span class="d">${esc(fmtLong(r.s.date))} · Z${S.days.indexOf(r.day) + 1}</span><span class="v">${esc(fmtKg(r.e.kg) || '–')} kg × ${esc(r.e.reps || '–')} ${trend}</span></div>
      ${r.e.note ? `<p>${esc(r.e.note)}</p>` : ''}
      ${(r.e.media || []).length ? `<div class="media">${r.e.media.map((m, i) => thumbHtml(m, 'hview', `data-r="${ri}" data-i="${i}"`) + `</button>`).join('')}</div>` : ''}</div>`;
  });
  $('#sh-inner').innerHTML = h + `</div>`;
  hydrateThumbs($('#sh-inner'));
}

/* ---------- editor zi ---------- */
function openDayEditor(dayId, isNew){
  const d = isNew ? {id: 'd' + rid(), title: '', exercises: []} : S.days.find(x => x.id === dayId);
  if (!d) return;
  E = {kind: 'day', isNew, id: d.id, title: d.title || '', exercises: JSON.parse(JSON.stringify(d.exercises || [])), confirmDel: false, saving: false};
  openSheet(isNew ? 'Zi nouă' : 'Editează ziua');
  renderDayEditor();
}
function renderDayEditor(){
  let h = `<label class="f">Numele zilei<input class="inp" id="d-title" value="${esc(E.title)}" placeholder="ex. Deadlift"></label>
    <div class="sect" style="margin:6px 0 0"><h3>Exerciții</h3><span>în ordinea din sală</span></div>`;
  E.exercises.forEach((ex, i) => {
    h += `<div class="erow"><label class="f">Exercițiu ${i+1}<input class="inp" id="en-${esc(ex.id)}" data-ef="name" data-i="${i}" value="${esc(ex.name)}"></label>
      <label class="f">Reps țintă<input class="inp" id="et-${esc(ex.id)}" data-ef="target" data-i="${i}" value="${esc(ex.target || '')}" placeholder="8-12"></label>
      <div class="ctl"><label class="chk">superset<select id="es-${esc(ex.id)}" data-ef="superset" data-i="${i}" class="sssel">${['','A','B','C','D','E'].map(v => `<option value="${v}" ${(ex.superset||'') === v ? 'selected' : ''}>${v || '—'}</option>`).join('')}</select></label><span class="sp"></span>
      <button class="mini" data-act="ex-up" data-i="${i}" aria-label="Mută sus" ${i === 0 ? 'disabled' : ''}>${IC.up}</button>
      <button class="mini" data-act="ex-down" data-i="${i}" aria-label="Mută jos" ${i === E.exercises.length - 1 ? 'disabled' : ''}>${IC.down}</button>
      <button class="mini" data-act="ex-del" data-i="${i}" aria-label="Șterge exercițiul">${IC.trash}</button></div></div>`;
  });
  h += `<button class="ghost" data-act="ex-add" style="padding:12px">+ Adaugă exercițiu</button>`;
  if (!E.isNew) h += E.confirmDel
    ? `<div class="confirm"><span style="flex:1">Ștergi ziua? Antrenamentele ei rămân în repo, dar nu mai apar.</span><button class="no" data-act="dday-no">Nu</button><button class="yes" data-act="dday-yes">Șterge</button></div>`
    : `<button class="danger" data-act="dday-ask" style="margin-top:12px">Șterge ziua</button>`;
  $('#sh-inner').innerHTML = h;
  setFoot(`<span class="status">Aceeași literă = același superset</span><button class="primary" data-act="save-day" ${E.saving ? 'disabled' : ''}>${E.saving ? 'Se salvează…' : 'Salvează'}</button>`);
}
async function writeRoutine(days, msg){
  const text = JSON.stringify({subtitle: S.subtitle, days}, null, 2);
  const sha = await GH.put('rutina.json', textToB64(text), msg, S.cfgSha);
  S.cfgSha = sha; S.days = days; cacheNow();
}
async function saveDay(){
  const title = E.title.trim();
  if (!title) { toast('Dă un nume zilei.'); $('#d-title')?.focus(); return; }
  const exercises = E.exercises.filter(x => x.name.trim()).map(x => ({id: x.id, name: x.name.trim(), target: (x.target || '').trim(), superset: x.superset || ''}));
  const day = {id: E.id, title, exercises};
  const days = E.isNew ? S.days.concat(day) : S.days.map(d => d.id === E.id ? day : d);
  E.saving = true; renderDayEditor();
  try { await writeRoutine(days, `${E.isNew ? 'Zi nouă' : 'Modific ziua'}: ${title}`); }
  catch { E.saving = false; renderDayEditor(); toast('Nu s-a salvat. Încearcă din nou.'); return; }
  S.dayId = E.id; ls.set('rt.day', E.id); closeSheet(); render(); toast('Ziua a fost salvată');
}

/* ---------- setări ---------- */
function openSettings(){
  E = {kind: 'settings', confirmOut: false};
  openSheet('Setări'); setFoot(''); renderSettings();
}
function renderSettings(){
  $('#sh-inner').innerHTML = `<div class="settings">
    <div class="card"><div class="t" style="font-weight:600">Date salvate în</div><div class="num">github.com/${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}</div>
    <a class="ghost" style="text-align:center;text-decoration:none" href="https://github.com/${esc(GH.cfg.owner)}/${esc(GH.cfg.repo)}" target="_blank" rel="noopener">Deschide repo-ul pe GitHub</a></div>
    <label class="f">Text sub titlu<input class="inp" id="s-sub" value="${esc(S.subtitle)}"></label>
    <button class="ghost" data-act="save-sub" style="padding:12px">Salvează textul</button>
    <button class="ghost" data-act="clear-cache" style="padding:12px">Golește cache-ul de poze de pe telefon</button>
    ${E.confirmOut ? `<div class="confirm"><span style="flex:1">Te deconectezi? Tokenul se șterge de pe telefon; datele rămân pe GitHub.</span><button class="no" data-act="out-no">Nu</button><button class="yes" data-act="out-yes">Deconectează</button></div>`
      : `<button class="danger" data-act="out-ask">Deconectează acest telefon</button>`}
  </div>`;
}

/* ---------- evenimente ---------- */
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'rm-media') { ev.stopPropagation(); return removeMedia(b.dataset.ex, +b.dataset.i); }
  switch (a) {
    case 'day': S.dayId = b.dataset.id; ls.set('rt.day', S.dayId); render(); window.scrollTo({top: 0}); break;
    case 'refresh': load(); break;
    case 'settings': openSettings(); break;
    case 'new-session': openSession(null); break;
    case 'open-session': openSession(b.dataset.id); break;
    case 'hist': openHistory(b.dataset.name); break;
    case 'close-sheet':
      if (E?.kind === 'session' && E.saving) { toast('Așteaptă să se termine salvarea.'); break; }
      if (E?.kind === 'session' && E.dirty) { E.confirmClose = true; updateFoot(); } else closeSheet();
      break;
    case 'keep-edit': E.confirmClose = false; updateFoot(); break;
    case 'discard': await discardSession(); break;
    case 'save-session': saveSession(); break;
    case 'del-ask': E.confirmDel = true; renderDelZone(); break;
    case 'del-no': E.confirmDel = false; renderDelZone(); break;
    case 'del-yes': deleteSession(); break;
    case 'pick': pickFor = b.dataset.ex; $('#picker').value = ''; $('#picker').click(); break;
    case 'view': openLB((E.entries[b.dataset.ex] || {}).media || [], +b.dataset.i, E.local); break;
    case 'hview': openLB(E.rows[+b.dataset.r].e.media, +b.dataset.i); break;
    case 'lb-close': closeLB(); break;
    case 'lb-prev': if (LB) { LB.i = (LB.i - 1 + LB.list.length) % LB.list.length; drawLB(); } break;
    case 'lb-next': if (LB) { LB.i = (LB.i + 1) % LB.list.length; drawLB(); } break;
    case 'edit-day': openDayEditor(curDay().id, false); break;
    case 'add-day': openDayEditor(null, true); break;
    case 'ex-add': E.exercises.push({id: 'e' + rid(), name: '', target: '', superset: ''}); renderDayEditor(); document.getElementById('en-' + E.exercises.at(-1).id)?.focus(); break;
    case 'ex-up': case 'ex-down': { const i = +b.dataset.i, j = a === 'ex-up' ? i - 1 : i + 1; [E.exercises[i], E.exercises[j]] = [E.exercises[j], E.exercises[i]]; renderDayEditor(); break; }
    case 'ex-del': E.exercises.splice(+b.dataset.i, 1); renderDayEditor(); break;
    case 'save-day': saveDay(); break;
    case 'dday-ask': E.confirmDel = true; renderDayEditor(); break;
    case 'dday-no': E.confirmDel = false; renderDayEditor(); break;
    case 'dday-yes': {
      const t = E.title;
      try { await writeRoutine(S.days.filter(d => d.id !== E.id), `Șterg ziua: ${t}`); S.dayId = null; ls.del('rt.day'); closeSheet(); render(); toast('Ziua a fost ștearsă'); }
      catch { toast('Nu s-a putut șterge.'); }
      break;
    }
    case 'save-sub': {
      const v = $('#s-sub').value.trim(); const old = S.subtitle; S.subtitle = v;
      try { await writeRoutine(S.days, 'Modific textul de sub titlu'); render(); toast('Salvat'); } catch { S.subtitle = old; toast('Nu s-a salvat.'); }
      break;
    }
    case 'clear-cache': try { await caches.delete('rutina-media'); } catch {} mediaURL.clear(); toast('Cache golit'); break;
    case 'out-ask': E.confirmOut = true; renderSettings(); break;
    case 'out-no': E.confirmOut = false; renderSettings(); break;
    case 'out-yes': ls.del('rt.gh'); ls.del('rt.cache'); try { await caches.delete('rutina-media'); } catch {} GH.cfg = null; closeSheet(); S.status = 'login'; S.loginErr = ''; render(); break;
  }
});
let draftT;
document.addEventListener('input', ev => {
  const t = ev.target; if (!E) return;
  if (E.kind === 'session') {
    if (t.id === 'f-date') E.date = t.value;
    else if (t.id === 'f-note') E.note = t.value;
    else if (t.dataset.f) entry(t.dataset.ex)[t.dataset.f] = t.value;
    else return;
    E.dirty = true; updateFoot();
    clearTimeout(draftT); draftT = setTimeout(saveDraft, 400);
  } else if (E.kind === 'day') {
    if (t.id === 'd-title') E.title = t.value;
    else if (t.dataset.ef) E.exercises[+t.dataset.i][t.dataset.ef] = t.value;
  }
});
document.addEventListener('submit', ev => { if (ev.target.id === 'loginForm') doLogin(ev); });
$('#picker').addEventListener('change', e => { const files = [...e.target.files]; if (pickFor && files.length) addFiles(pickFor, files); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && LB) closeLB(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.status === 'ready' && !E) load(true); });

/* ---------- pornire ---------- */
if (!GH.cfg || !GH.cfg.token) { S.status = 'login'; render(); }
else {
  const c = ls.get('rt.cache');
  if (c && c.repo === GH.cfg.owner + '/' + GH.cfg.repo && c.d) { try { applyData(c.d); S.status = 'ready'; } catch {} }
  render();
  load(true);
}
})();

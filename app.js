/* =====================================================
   Final app.js — Polished + Smart Fetching + UI Logic
   Drop this whole file into your project as app.js
   =====================================================*/

/* -----------------------------
  CONFIG — edit only this block
------------------------------*/
const PAGE_SIZE = 8;

// News API settings.
// If you run a local proxy, set baseUrl to it (e.g. "http://localhost:3000/news").
// If using direct NewsAPI.org, put your apiKey here and set enabled=true.
const NEWSAPI = {
  enabled: false,
  apiKey: "",
  baseUrl: "https://newsapi.org/v2/top-headlines" // or proxy base URL
};

/* -----------------------------
  FALLBACK IMAGE (data URI SVG)
------------------------------*/
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
     <rect width="100%" height="100%" fill="#eef2f8"/>
     <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9aa7bf" font-family="Arial, sans-serif" font-size="36">No image</text>
   </svg>`
);

/* -----------------------------
  STATIC fallback (ample items)
------------------------------*/
const staticArticles = [
  { id: 1, title: "Goldman Sachs acquires ETF firm", description: "Goldman Sachs expands its financial offerings with a major acquisition.", url:"#", urlToImage:"https://images.ft.com/v3/image/raw/https%3A%2F%2Fd1e00ek4ebabms.cloudfront.net%2Fproduction%2F4e400472-5147-4272-a830-20d9c20cee0b.jpg?source=next-article&fit=scale-down&quality=highest&width=700&dpr=1" },
  { id: 2, title: "Elon Musk discusses future of AI", description: "Musk sees rapid AI growth changing industries completely.", url:"#", urlToImage:"https://www.scifuture.org/wp-content/uploads/2016/09/Elon-Musk_future-of-ai.jpg" },
  { id: 3, title: "Nvidia takes $2B stake in Synopsys", description: "Nvidia expands its footprint into chip design automation.", url:"#", urlToImage:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=60" },
  { id: 4, title: "Silver prices break records", description: "Supply shortages push silver into record-high range.", url:"#", urlToImage:"https://m.economictimes.com/thumb/msid-125694033,width-1200,height-900,resizemode-4,imgsize-41060/silver-price-today-silver-prices-surge-to-58/oz-for-the-first-time-in-history-why-are-silver-prices-breaking-records-is-the-silver-rally-strong-or-overbought.jpg" },
  { id: 5, title: "Eli Lilly adjusts pricing", description: "Pharma giant Eli Lilly restructures product pricing globally.", url:"#", urlToImage:"https://media.npr.org/assets/img/2023/03/01/ap23060462872024-99f7c8da3705e7d3b6791aecad39d938296ab5d0.jpg" },
  { id: 6, title: "Walmart Cyber Monday deals", description: "Huge discounts on electronics and home essentials.", url:"#", urlToImage:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSuWGKWVuJTRl-JbdZi7yOaD3RUJ7Y_UQm5g&s" },
  { id: 7, title: "High school wins robotics championship", description: "Students celebrate victory in national robotics league.", url:"#", urlToImage:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=60" },
  { id: 8, title: "Pop-up gardens transform empty lots", description: "Community efforts turn abandoned land into green spaces.", url:"#", urlToImage:"https://phs-prod.s3.us-east-1.amazonaws.com/attachments/cmcds8k6e00ce0bpbxx9kc3zd-phs-manayunkpopup-plantswap-041.0.0.3346.2230.full.jpg" },
  { id: 9, title: "Remote work reshapes lifestyles", description: "Research explores how daily routines changed post-pandemic.", url:"#", urlToImage:"https://images.unsplash.com/photo-1522199710521-72d69614c702?w=1200&q=60" },
  { id: 10, title: "Indie puzzle game becomes hit", description: "Short sessions and calming audio define the new indie hit.", url:"#", urlToImage:"https://cdn.mos.cms.futurecdn.net/xfdKkqach8rcMVBhhPjwKG-970-80.jpg.webp" },
  { id: 11, title: "Local bakery sparks revival", description: "A neighborhood bakery becomes a community hub and late-night favorite.", url:"#", urlToImage:"https://content.jdmagicbox.com/quickquotes/listicle/listicle_1741966147178_9ism1_6067x3467.jpg?impolicy=queryparam&im=Resize=(1200,900),aspect=fit&q=75&width=1200" },
  { id: 12, title: "City pilots bike-lane network", description: "New lanes aim to reduce commute times and improve safety.", url:"#", urlToImage:"https://momentummag.com/wp-content/uploads/2016/08/5973057250_8acb8c8cf3_b.jpg" }
];

/* -----------------------------
  STATE
------------------------------*/
let parsedSaved = [];
try {
  const raw = localStorage.getItem('savedNews') || '[]';
  parsedSaved = JSON.parse(raw);
  if (!Array.isArray(parsedSaved)) parsedSaved = [];
} catch (err) {
  parsedSaved = [];
}
const state = {
  mode: 'static',      // 'static' or 'api'
  articles: [],
  page: 1,
  totalResults: null,
  country: 'all',
  category: 'all',
  query: '',
  loading: false,
  saved: new Set(parsedSaved),
  theme: 'light',
  glass: false
};

/* -----------------------------
  DOM refs
------------------------------*/
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const searchInput = document.getElementById('searchInput');
const grid = document.getElementById('grid');
const loader = document.getElementById('loader');
const loadMoreBtn = document.getElementById('loadMore');
const statusEl = document.getElementById('status');
const modeToggle = document.getElementById('modeToggle');
const liveHint = document.getElementById('liveHint');
const refreshBtn = document.getElementById('refreshBtn');
const countrySelect = document.getElementById('countrySelect');
const categorySelect = document.getElementById('categorySelect');
const openSaved = document.getElementById('openSaved');
const savedPanel = document.getElementById('savedPanel');
const savedList = document.getElementById('savedList');
const closeSaved = document.getElementById('closeSaved');
const clearSavedBtn = document.getElementById('clearSaved');
const themeToggle = document.getElementById('themeToggle');
const glassToggle = document.getElementById('glassToggle');

const overlay = document.getElementById('overlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalMedia = document.getElementById('modalMedia');
const modalRead = document.getElementById('modalRead');
const modalSave = document.getElementById('modalSave');

/* -----------------------------
  UTILITIES
------------------------------*/
function setStatus(text='') { statusEl.textContent = text; }
function saveLocal(){ try { localStorage.setItem('savedNews', JSON.stringify([...state.saved])); } catch(e) { console.warn('Failed to save localStorage', e); } }
function make(tag, cls=''){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : ''); document.querySelector('.app').classList.toggle('glass', state.glass); themeToggle.textContent = state.theme === 'dark' ? 'Light' : 'Dark'; glassToggle.textContent = state.glass ? 'Flat' : 'Glass'; }

/* -----------------------------
  SKELETONS
------------------------------*/
function renderSkeletons(n=4){
  for(let i=0;i<n;i++){
    const c = make('div','card visible');
    c.style.minHeight = '220px';
    c.innerHTML = `<div class="media" style="padding:14px"><div class="skeleton" style="height:110px;border-radius:8px"></div></div><div class="content-card"><div class="skeleton" style="height:16px;width:70%;border-radius:6px"></div><div style="height:8px"></div><div class="skeleton" style="height:12px;width:90%;border-radius:6px"></div></div>`;
    grid.appendChild(c);
  }
}

/* -----------------------------
  CARD CREATION (with robust image handling)
------------------------------*/
function createCard(a, idx){
  const card = make('article','card');

  // media with fallback-aware <img>
  const media = make('div','media');
  const img = make('img');
  img.alt = a.title || 'news thumbnail';
  img.loading = 'lazy';
  img.decoding = 'async';
  // defensive: ensure empty string is treated as missing
  img.src = a.urlToImage ? a.urlToImage : FALLBACK_IMAGE;
  img.onerror = function(){
    if (this.dataset.fallback) return;
    this.dataset.fallback = 'true';
    this.src = FALLBACK_IMAGE;
  };
  media.appendChild(img);

  // bookmark button
  const bm = make('button','bookmark');
  bm.innerHTML = state.saved.has(a.id) ? '★' : '☆';
  if(state.saved.has(a.id)) bm.classList.add('active');
  bm.title = 'Save article';
  bm.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(state.saved.has(a.id)) { state.saved.delete(a.id); bm.classList.remove('active'); bm.innerHTML='☆'; }
    else { state.saved.add(a.id); bm.classList.add('active'); bm.innerHTML='★'; }
    saveLocal();
    renderSavedList();
  });
  media.appendChild(bm);

  const content = make('div','content-card');
  const h = make('h3','title-card'); h.textContent = a.title;
  const p = make('p','excerpt'); p.textContent = a.description;
  const meta = make('div','meta');
  const rm = make('button','readmore smallbtn'); rm.textContent = 'Read';
  rm.addEventListener('click', (e)=>{ e.stopPropagation(); openModal(a); });
  meta.appendChild(rm);

  content.appendChild(h); content.appendChild(p); content.appendChild(meta);
  card.appendChild(media); card.appendChild(content);

  // open modal on card click
  card.addEventListener('click', ()=> openModal(a));

  // reveal animation
  setTimeout(()=> card.classList.add('visible'), idx * 40);
  return card;
}

/* -----------------------------
  MODAL & SAVED PANEL
------------------------------*/
function openModal(a){
  modalTitle.textContent = a.title;
  modalDesc.textContent = a.description;
  modalMedia.innerHTML = '';
  const img = make('img');
  img.alt = a.title || 'article image';
  img.loading = 'eager';
  img.decoding = 'async';
  img.src = a.urlToImage || FALLBACK_IMAGE;
  img.onerror = function(){
    if (this.dataset.fallback) return;
    this.dataset.fallback = 'true';
    this.src = FALLBACK_IMAGE;
  };
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  modalMedia.appendChild(img);

  modalRead.href = a.url || '#';
  modalSave.textContent = state.saved.has(a.id) ? 'Saved' : 'Save';
  modalSave.disabled = state.saved.has(a.id);
  modalSave.onclick = () => {
    if (!state.saved.has(a.id)) {
      state.saved.add(a.id);
      saveLocal();
      modalSave.textContent = 'Saved';
      modalSave.disabled = true;
      renderArticles();
      renderSavedList();
    }
  };

  overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false');
  modalClose.focus();
}
modalClose.addEventListener('click', ()=> { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); });
overlay.addEventListener('click', e => { if(e.target === overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); } });

function renderSavedList(){
  savedList.innerHTML = '';
  if(state.saved.size === 0){ savedList.innerHTML = '<div class="muted">No saved articles yet.</div>'; return; }
  const savedArray = Array.from(state.saved);
  savedArray.forEach(id => {
    const item = state.articles.find(a=>a.id === id) || staticArticles.find(s=>String(s.id) === String(id)) || null;
    const row = make('div','saved-row');
    row.style.padding='8px 0';
    if(item){
      row.innerHTML = `<a href="#" class="saved-link">${item.title}</a>`;
      row.querySelector('.saved-link').addEventListener('click', (e)=>{ e.preventDefault(); openModal(item); });
    } else {
      row.textContent = id;
    }
    savedList.appendChild(row);
  });
}

/* =====================================================
   SMART API FETCHING + AGGREGATION
   - fetchUrlAndNormalize
   - fetchNewsSmart (single-country, everything, or multi-country fallback)
   - loadInitial, loadMore using fetchNewsSmart
   =====================================================*/

const NEWSAPI_MAX_PAGE_SIZE = 100; // NewsAPI 'everything' allows up to 100

// Helper: fetch a URL and normalize the items to our shape
async function fetchUrlAndNormalize(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`Network ${res.status} ${text}`);
  }
  const json = await res.json();
  if (json.articles && Array.isArray(json.articles)) {
    return json.articles.map(it => ({
      id: it.url,
      title: it.title || 'Untitled',
      description: (it.description || it.content || '').slice(0, 400),
      url: it.url || '#',
      urlToImage: it.urlToImage || '',
      publishedAt: it.publishedAt ? new Date(it.publishedAt).getTime() : 0,
      sourceName: it.source?.name || ''
    }));
  }
  if (Array.isArray(json)) {
    return json.map(it => ({
      id: it.url || it.title,
      title: it.title,
      description: it.description || '',
      url: it.url || '#',
      urlToImage: it.urlToImage || '',
      publishedAt: it.publishedAt ? new Date(it.publishedAt).getTime() : 0,
      sourceName: it.source?.name || ''
    }));
  }
  return [];
}

/*
 Strategy:
 - If a single country is selected -> use top-headlines for that country (paged).
 - If country = 'all' -> try 'everything' endpoint with sortBy=publishedAt (bigger pageSize).
   If that fails or returns nothing -> fall back to fetching several countries sequentially, merge, dedupe, sort.
 Note: multi-country polling can cause rate-limit hits on free API tiers; use server-side caching in production.
*/
async function fetchNewsSmart(page = 1) {
  const country = state.country;
  const category = (state.category && state.category !== 'all') ? state.category : null;
  const q = state.query ? state.query : null;

  // Single country: top-headlines
  if (country && country !== 'all') {
    const params = new URLSearchParams();
    params.set('pageSize', String(PAGE_SIZE));
    params.set('page', String(page));
    params.set('country', country);
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    if (NEWSAPI.enabled && NEWSAPI.apiKey && NEWSAPI.baseUrl.includes('newsapi.org')) {
      params.set('apiKey', NEWSAPI.apiKey);
    }
    const url = `${NEWSAPI.baseUrl}?${params.toString()}`;
    return await fetchUrlAndNormalize(url);
  }

  // Country = all: try everything endpoint first
  try {
    const everythingBase = NEWSAPI.baseUrl.replace(/top-headlines/i, 'everything');
    const params = new URLSearchParams();
    params.set('pageSize', String(Math.min(NEWSAPI_MAX_PAGE_SIZE, PAGE_SIZE * 3)));
    params.set('page', String(page));
    if (category) params.set('q', category);
    if (q) params.set('q', (params.get('q') ? params.get('q') + ' ' + q : q));
    params.set('sortBy', 'publishedAt');
    if (NEWSAPI.enabled && NEWSAPI.apiKey && everythingBase.includes('newsapi.org')) {
      params.set('apiKey', NEWSAPI.apiKey);
    }
    const url = `${everythingBase}?${params.toString()}`;
    const items = await fetchUrlAndNormalize(url);
    if (items && items.length > 0) return items;
  } catch (err) {
    console.warn('Everything endpoint failed — falling back to multi-country:', err.message);
  }

  // Fallback: poll several countries sequentially
  const countriesToPoll = ['us','gb','in','ca','au','de','fr','it','es','jp','br','mx']; // adjust if needed
  const merged = [];
  for (const c of countriesToPoll) {
    if (merged.length >= PAGE_SIZE * 3) break;
    try {
      const params = new URLSearchParams();
      params.set('pageSize', String(Math.max(PAGE_SIZE, 12)));
      params.set('page', '1');
      params.set('country', c);
      if (category) params.set('category', category);
      if (q) params.set('q', q);
      if (NEWSAPI.enabled && NEWSAPI.apiKey && NEWSAPI.baseUrl.includes('newsapi.org')) {
        params.set('apiKey', NEWSAPI.apiKey);
      }
      const url = `${NEWSAPI.baseUrl}?${params.toString()}`;
      const items = await fetchUrlAndNormalize(url);
      merged.push(...items);
      await new Promise(r => setTimeout(r, 150)); // polite delay
    } catch (err) {
      console.warn('Country fetch failed', c, err.message);
    }
  }

  // dedupe and sort by date desc
  const map = new Map();
  for (const it of merged) {
    if (!it.url) continue;
    if (!map.has(it.url)) map.set(it.url, it);
  }
  const deduped = Array.from(map.values());
  deduped.sort((a,b) => (b.publishedAt || 0) - (a.publishedAt || 0));
  const start = (page - 1) * PAGE_SIZE;
  return deduped.slice(start, start + PAGE_SIZE);
}

/* -----------------------------
  LOAD INITIAL + LOAD MORE
------------------------------*/
async function loadInitial(){
  // prevent concurrent initial loads
  if (state.loading) return;
  state.loading = true;
  loadMoreBtn.disabled = true;

  state.page = 1;
  state.articles = [];
  grid.innerHTML = '';
  setStatus('');
  if(state.mode === 'api' && NEWSAPI.enabled){
    renderSkeletons(4);
    try{
      const items = await fetchNewsSmart(1);
      state.articles = items;
      renderArticles();
      setStatus(`${state.articles.length} articles (live)`);
    } catch(err){
      console.error('API initial load failed:', err);
      setStatus('API failed — falling back to static.');
      state.mode = 'static';
      state.articles = staticArticles.slice();
      renderArticles();
    }
  } else {
    state.articles = staticArticles.slice();
    renderArticles();
  }
  renderSavedList();
  state.loading = false;
  loadMoreBtn.disabled = false;
}

async function loadMore(){
  if(state.loading) return; // guard
  state.loading = true;
  loadMoreBtn.disabled = true;

  if(state.mode === 'api' && NEWSAPI.enabled){
    state.page++;
    renderSkeletons(3);
    try{
      const more = await fetchNewsSmart(state.page);
      const urlMap = new Map(state.articles.map(a => [a.url || a.id, a]));
      for(const it of more){
        if(!urlMap.has(it.url)){
          urlMap.set(it.url, it);
          state.articles.push(it);
        }
      }
      state.articles.sort((a,b) => (b.publishedAt||0) - (a.publishedAt||0));
      renderArticles();
      setStatus(`${state.articles.length} articles (live)`);
    } catch(err){
      console.error('Load more failed:', err);
      setStatus('Failed to load more from API.');
      state.page = Math.max(1, state.page - 1);
    } finally {
      state.loading = false;
      loadMoreBtn.disabled = false;
    }
  } else {
    const start = state.articles.length;
    const next = staticArticles.slice(start, start + PAGE_SIZE);
    if(next.length === 0){ setStatus('No more static articles'); state.loading = false; loadMoreBtn.disabled = false; return; }
    state.articles = state.articles.concat(next);
    renderArticles();
    setStatus(`${state.articles.length} articles`);
    state.loading = false;
    loadMoreBtn.disabled = false;
  }
}

/* -----------------------------
  RENDER LIST
------------------------------*/
function renderArticles(){
  grid.innerHTML = '';
  const q = state.query.trim().toLowerCase();
  let list = state.articles.slice();
  if(q) list = list.filter(a => ((a.title||'') + ' ' + (a.description||'')).toLowerCase().includes(q));
  if(list.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;padding:28px;text-align:center;color:var(--muted)">No articles found.</div>`;
    setStatus('0 articles');
    return;
  }
  list.forEach((a,i) => grid.appendChild(createCard(a,i)));
  setStatus(`${list.length} articles`);
}

/* -----------------------------
  EVENTS & UI
------------------------------*/
sidebarToggle.addEventListener('click', ()=> sidebar.classList.toggle('open'));
modeToggle.addEventListener('click', ()=> {
  state.mode = state.mode === 'static' ? 'api' : 'static';
  modeToggle.textContent = `Mode: ${state.mode === 'api' ? 'API' : 'Static'}`;
  liveHint.textContent = state.mode === 'api' ? 'Live' : 'Static';
  loadInitial();
});
searchInput.addEventListener('input', (e)=> { state.query = e.target.value; renderArticles(); });
countrySelect.addEventListener('change', (e)=> { state.country = e.target.value; loadInitial(); });
categorySelect.addEventListener('change', (e)=> { state.category = e.target.value; loadInitial(); });
loadMoreBtn.addEventListener('click', loadMore);
refreshBtn.addEventListener('click', ()=> loadInitial());
openSaved.addEventListener('click', ()=> savedPanel.classList.toggle('open'));
closeSaved.addEventListener('click', ()=> savedPanel.classList.remove('open'));
clearSavedBtn.addEventListener('click', ()=> { state.saved.clear(); saveLocal(); renderSavedList(); renderArticles(); });

themeToggle.addEventListener('click', ()=> { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
glassToggle.addEventListener('click', ()=> { state.glass = !state.glass; applyTheme(); });

window.addEventListener('scroll', ()=> {
  if((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 400)){
    if(!state.loading) loadMore();
  }
});

document.addEventListener('keydown', (e)=> {
  if(e.key === 'Escape'){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); savedPanel.classList.remove('open'); }
});

/* -----------------------------
  INIT
------------------------------*/
function init(){
  modeToggle.textContent = `Mode: ${state.mode === 'api' ? 'API' : 'Static'}`;
  liveHint.textContent = state.mode === 'api' ? 'Live' : 'Static';
  applyTheme();
  loadInitial();
}
init();

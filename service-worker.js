// TABANSA service worker: aplikasi bisa dibuka saat offline.
// - File situs sendiri: coba jaringan dulu (maks 4 detik), jika gagal pakai salinan tersimpan.
// - Font pihak ketiga: pakai salinan tersimpan lalu perbarui di latar belakang.
// - Permintaan ke Supabase (data) tidak disentuh; data offline ditangani oleh common.js.
const V = "tabansa-v4";
const SHELL = ["./", "index.html", "admin/login.html", "admin/admin.html", "style.css", "common.js",
  "config.js", "theme.js", "supabase.js", "manifest.json", "admin/manifest.json", "icon.png"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function jaringanDulu(req) {
  const c = await caches.open(V);
  try {
    const r = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(no, 4000))]);
    if (r && r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    const m = await c.match(req, { ignoreSearch: true });
    if (m) return m;
    if (req.mode === "navigate") {
      const f = await c.match("index.html");
      if (f) return f;
    }
    return Response.error();
  }
}

async function salinanDulu(req) {
  const c = await caches.open(V);
  const m = await c.match(req);
  const baru = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => null);
  return m || (await baru) || Response.error();
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.protocol !== "http:" && u.protocol !== "https:") return;
  if (u.hostname.endsWith("supabase.co")) return;
  if (u.origin === self.location.origin) e.respondWith(jaringanDulu(req));
  else e.respondWith(salinanDulu(req));
});

// 離線快取：有網路時一律拿最新版（座位表更新後不需改這個檔案），網路不穩或離線時用快取
const CACHE = 'hw-seating-v3';
const ASSETS = [
  './',
  './index.html',
  './seats.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];
const TIMEOUT_MS = 3000;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 逾時後改用快取，但背景仍會把下載完成的新版存進快取，下次開啟就是新的
function fromNetwork(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
    fetch(request.url, { cache: 'no-cache' }).then(response => {
      clearTimeout(timer);
      if (!response.ok) { reject(new Error('HTTP ' + response.status)); return; }
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request.url.split('?')[0], copy));
      resolve(response);
    }, err => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fromNetwork(request)
      .catch(() => caches.match(request, { ignoreSearch: true }))
      .then(response => response || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});

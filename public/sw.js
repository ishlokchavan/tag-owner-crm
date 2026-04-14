// TAG CRM Service Worker v2
const CACHE = 'tag-crm-v2'
const CACHEABLE_EXTENSIONS = /\.(png|jpg|jpeg|svg|ico|woff2?)$/i

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Network first for API/supabase calls
  if (url.hostname.includes('supabase.co')) return

  // Never cache Next.js build assets or dev/HMR endpoints.
  if (url.pathname.startsWith('/_next/')) return

  // Cache first only for stable static assets like icons, images, and fonts.
  if (CACHEABLE_EXTENSIONS.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached

        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(e.request, clone))
          }
          return res
        });
      })
    )
    return
  }

  // Network first for pages
  e.respondWith(
    fetch(e.request).catch(async () => {
      const cached = await caches.match(e.request)
      return cached ?? Response.error()
    })
  )
})

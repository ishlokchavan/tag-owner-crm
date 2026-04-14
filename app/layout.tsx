import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppChrome } from '@/components/layout/AppChrome'

export const metadata: Metadata = {
  title: 'TAG CRM',
  description: 'Tilal Al Ghaf Owner Intelligence',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TAG CRM',
  },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0F0E',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const serviceWorkerScript =
    process.env.NODE_ENV === 'production'
      ? `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `
      : `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              registrations.forEach(registration => registration.unregister());
            });
          }

          if ('caches' in window) {
            caches.keys().then(keys => {
              keys.forEach(key => caches.delete(key));
            });
          }
        `

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#0D0F0E] text-[#E8ECE8]">
        <AppChrome>
          {children}
        </AppChrome>
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerScript }} />
      </body>
    </html>
  )
}

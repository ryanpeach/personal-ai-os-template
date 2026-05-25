import type { Metadata, Viewport } from 'next';
import { IonicShell } from './ionic-shell';

export const metadata: Metadata = {
  title: 'Portal',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Portal',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3880ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <IonicShell>{children}</IonicShell>
      </body>
    </html>
  );
}

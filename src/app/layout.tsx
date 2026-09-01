import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/providers/AppShell';

export const metadata: Metadata = {
  title: 'AgriConnect',
  description: 'Online ordering for your local agricultural products shop.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

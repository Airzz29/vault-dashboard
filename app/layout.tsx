import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vault Dashboard — StreetVault',
  description: 'StreetVault Internal Inventory & Profit Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

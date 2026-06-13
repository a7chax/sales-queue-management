import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Antrean Penjualan • Sales Queue Manager',
  description: 'Sistem Manajemen Antrean Penjualan - Real-time priority queue dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

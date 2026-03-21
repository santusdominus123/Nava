import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bible Guide AI — Admin Console',
  description: 'Enterprise admin dashboard for Bible Guide AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen gradient-bg">
          <Sidebar />
          <main className="flex-1 ml-72 p-8 relative">
            {/* Top ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

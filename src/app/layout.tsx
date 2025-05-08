import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hot or Not',
  description: 'Compare and vote on which image is hotter',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-900 via-purple-900 to-black min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            {/* Sticky header */}
            <header className="sticky top-0 z-10 py-3 text-center bg-black/70 backdrop-blur-md shadow-md">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                hotgirlshit.xyz
              </h1>
            </header>
            
            {/* Main content with padding for sticky header and footer */}
            <main className="flex-grow py-4">
              {children}
            </main>
            
            {/* Sticky footer */}
            <footer className="sticky bottom-0 z-10 py-3 px-4 bg-black/70 backdrop-blur-md shadow-md border-t border-gray-800">
              <div className="flex justify-between items-center max-w-md mx-auto">
                <Link 
                  href="/profile" 
                  className="text-pink-400 hover:text-pink-300 text-sm font-medium"
                >
                  Profile
                </Link>
                <Link 
                  href="/" 
                  className="text-pink-400 hover:text-pink-300 text-sm font-medium"
                >
                  Play
                </Link>
                <a 
                  href="https://hotgirlshit.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 text-sm font-medium"
                >
                  Website
                </a>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

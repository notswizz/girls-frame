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
            
            {/* Sticky footer - bigger size */}
            <footer className="sticky bottom-0 z-10 py-4 px-4 bg-black/70 backdrop-blur-md shadow-md border-t border-gray-800">
              <div className="flex justify-between items-center max-w-md mx-auto">
                <Link 
                  href="/profile" 
                  className="text-pink-400 hover:text-pink-300 text-base font-medium flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile
                </Link>
                <Link 
                  href="/" 
                  className="text-pink-400 hover:text-pink-300 text-base font-medium flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  Play
                </Link>
                <a 
                  href="https://hotgirlshit.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 text-base font-medium flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="m2 12 5-5c1.5-1.5 3.5-1.5 5 0 1.5 1.5 1.5 3.5 0 5l-5 5"></path>
                    <path d="m22 12-5-5c-1.5-1.5-3.5-1.5-5 0-1.5 1.5-1.5 3.5 0 5l5 5"></path>
                  </svg>
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

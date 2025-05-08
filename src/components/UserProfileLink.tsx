"use client";

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function UserProfileLink() {
  const { address, isConnected } = useAccount();
  const [addressDisplay, setAddressDisplay] = useState('');
  
  useEffect(() => {
    if (address) {
      // Format the address to show only first 4 and last 4 characters
      setAddressDisplay(`${address.slice(0, 4)}...${address.slice(-4)}`);
    }
  }, [address]);
  
  return (
    <Link 
      href="/profile" 
      className="text-pink-400 hover:text-pink-300 text-sm font-medium flex items-center gap-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      {isConnected && addressDisplay ? addressDisplay : 'Profile'}
    </Link>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';

interface TopWinner {
  _id: string;
  count: number;
  url: string;
  modelName: string;
  modelUsername: string;
}

interface ProfileData {
  userId: string;
  totalVotes: number;
  uniqueModelsVoted: number;
  topWinners: TopWinner[];
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  
  const userId = address || 'anonymous';
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-white text-xl">Loading profile data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="text-red-400">{error}</div>
        <Link href="/">
          <Button className="bg-gray-800 hover:bg-gray-700">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4 px-4 max-w-3xl">
      <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-6 shadow-xl">
        <header className="border-b border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Your Profile</h1>
          <p className="text-gray-400 text-sm mt-1">
            {userId === 'anonymous' ? 'Anonymous User' : `User: ${userId.slice(0, 6)}...${userId.slice(-4)}`}
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Your Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Total Votes:</span>
                  <span className="text-white font-medium">{profileData?.totalVotes || 0}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Models Voted On:</span>
                  <span className="text-white font-medium">{profileData?.uniqueModelsVoted || 0}</span>
                </div>
              </div>
            </div>
            
            <Link href="/" className="block">
              <Button className="w-full bg-gray-800 hover:bg-gray-700 mb-4">
                Back to Voting
              </Button>
            </Link>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Your Top Picks</h2>
            {profileData?.topWinners && profileData.topWinners.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {profileData.topWinners.map((winner) => (
                  <div key={winner._id} className="bg-gray-800/50 rounded-lg overflow-hidden">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={winner.url} 
                        alt={winner.modelName || 'Model'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-center">
                      <div className="text-white text-sm font-medium">{winner.count} votes</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center p-6 bg-gray-800/30 rounded-lg">
                You haven't voted for anyone yet!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
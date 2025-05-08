"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Model } from '~/lib/types';

interface ModelCardProps {
  model: Model;
  onVote: () => void;
  disabled: boolean;
  isSelected: boolean;
}

function ModelCard({ model, onVote, disabled, isSelected }: ModelCardProps) {
  return (
    <div 
      className={`flex flex-col items-center transition-all ${disabled ? 'opacity-70' : ''}`}
      onClick={disabled ? undefined : onVote}
    >
      <div className={`relative w-full overflow-hidden rounded-2xl cursor-pointer 
                      transition-all duration-300 transform 
                      ${isSelected ? 'scale-[1.05] border-pink-500 shadow-[0_0_30px_rgba(219,39,119,0.8)]' : 'hover:scale-[1.03]'}
                      border-2 border-purple-500/30 hover:border-pink-500
                      shadow-[0_0_15px_rgba(219,39,119,0.2)] hover:shadow-[0_0_25px_rgba(219,39,119,0.5)]`}>
        {isSelected && (
          <>
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-pink-500/30 to-purple-500/30 animate-pulse pointer-events-none" />
            <div className="absolute inset-0 z-10 animate-shine pointer-events-none" />
          </>
        )}
        {isSelected && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-fadeout">
            <div className="text-white font-bold text-4xl transform scale-150 animate-pop text-shadow">HOT!</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="w-full aspect-auto">
          <img
            src={model.url}
            alt="Model"
            className="w-full h-auto"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}

export default function HotOrNot() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { address } = useAccount();

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      const response = await fetch('/api/models');
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      setModels(data.models);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to load images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleVote = async (winnerId: string, loserId: string) => {
    if (voting) return; // Prevent multiple clicks
    
    try {
      setVoting(true);
      setError(null);
      setSelectedId(winnerId);
      
      // Play animation for a moment before making the request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winnerId,
          loserId,
          userId: address || 'anonymous',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record vote');
      }
      
      // Fetch new models after a short delay to let the animation complete
      setTimeout(() => {
        fetchModels();
        setVoting(false); // Make sure voting state is reset
      }, 200);
      
    } catch (err) {
      console.error('Error recording vote:', err);
      setError('Failed to record your vote. Please try again.');
      setSelectedId(null);
      setVoting(false);
    }
  };

  if (loading && models.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-white text-xl">Loading images...</div>
      </div>
    );
  }

  if (error && models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="text-red-400">{error}</div>
        <button 
          onClick={fetchModels}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 pb-4">
      {models.length === 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
          <ModelCard
            model={models[0]}
            onVote={() => handleVote(models[0]._id, models[1]._id)}
            disabled={voting}
            isSelected={selectedId === models[0]._id}
          />
          <ModelCard
            model={models[1]}
            onVote={() => handleVote(models[1]._id, models[0]._id)}
            disabled={voting}
            isSelected={selectedId === models[1]._id}
          />
        </div>
      ) : (
        <div className="text-center text-gray-400">
          Not enough models available. Please try again later.
        </div>
      )}
      
      {error && (
        <div className="text-red-400 text-center mt-4">
          {error}
        </div>
      )}
    </div>
  );
} 
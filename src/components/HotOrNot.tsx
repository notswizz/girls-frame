"use client";

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Model } from '~/lib/types';
import SignMessage from './SignMessage';

interface ModelCardProps {
  model: Model;
  onVote: () => void;
  disabled: boolean;
  isSelected: boolean;
  onRevealInstagram: () => void;
}

function ModelCard({ model, onVote, disabled, isSelected, onRevealInstagram }: ModelCardProps) {
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
        {/* Instagram button */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the card's onClick
            onRevealInstagram();
          }}
          className="absolute top-2 right-2 z-30 bg-pink-500/70 hover:bg-pink-500 rounded-full p-2 transition-all hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </button>
        
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
  const [hasSignedMessage, setHasSignedMessage] = useState(false);
  const [revealedInstagrams, setRevealedInstagrams] = useState<{[key: string]: string}>({});
  const [isRevealing, setIsRevealing] = useState<{[key: string]: boolean}>({});
  const { address, isConnected } = useAccount();
  
  const { sendTransaction } = useSendTransaction({
    mutation: {
      onSuccess: (data, variables) => {
        // Transaction was successful, now reveal the Instagram
        // We'll use the data in the transaction to identify which model
        const txData = variables.data;
        if (txData && models.length) {
          // Find the model by checking which model ID matches the transaction data
          const modelId = models.find(m => 
            txData.includes(Buffer.from(m._id.toString()).toString('hex'))
          )?._id;
          
          if (modelId) {
            const model = models.find(m => m._id === modelId);
            if (model && model.instagram) {
              // Add the model's Instagram to revealed list
              setRevealedInstagrams(prev => ({
                ...prev,
                [modelId]: model.instagram || 'No Instagram found'
              }));
            }
          }
        }
        
        // Reset the revealing state for all models
        setIsRevealing({});
      },
      onError: (error) => {
        console.error('Transaction error:', error);
        // Reset the revealing state for all models
        setIsRevealing({});
      }
    }
  });

  useEffect(() => {
    // Check if user has already signed the message
    const checkMessageSigned = () => {
      const isSigned = localStorage.getItem('hotOrNotMessageSigned') === 'true';
      setHasSignedMessage(isSigned);
    };
    
    // Check on initial load and whenever localStorage changes
    checkMessageSigned();
    
    // Listen for storage events (in case another tab updates localStorage)
    window.addEventListener('storage', checkMessageSigned);
    
    return () => {
      window.removeEventListener('storage', checkMessageSigned);
    };
  }, []);

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
    // Only fetch models if user has signed the message or has no wallet connected
    if (hasSignedMessage || !address) {
      fetchModels();
    }
  }, [hasSignedMessage, address]);

  const handleMessageSigned = () => {
    setHasSignedMessage(true);
    fetchModels();
  };

  const handleRevealInstagram = (modelId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet to reveal Instagram');
      return;
    }
    
    // If already revealed, just show it again
    if (revealedInstagrams[modelId]) {
      alert(`Instagram: @${revealedInstagrams[modelId]}`);
      return;
    }
    
    // Set revealing state
    setIsRevealing(prev => ({
      ...prev,
      [modelId]: true
    }));
    
    // Use a set recipient address
    const recipientAddress = '0xEe8E952926D7A2413F1f563BC9595Bcf45af57eE';
    
    // Send a smaller transaction to reveal the Instagram (0.00001 ETH)
    try {
      sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: parseEther('0.00001'),
        data: `0x${Buffer.from(modelId).toString('hex')}` as `0x${string}`, // Include modelId in the data
        gas: BigInt(50000) // Set a fixed gas limit
      });
    } catch (err) {
      console.error('Error initiating transaction:', err);
      setIsRevealing(prev => ({
        ...prev,
        [modelId]: false
      }));
    }
  };

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

  // If user has connected wallet but not signed the message yet, show sign message component
  if (address && !hasSignedMessage) {
    return <SignMessage onMessageSigned={handleMessageSigned} />;
  }

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

  // Instagram reveal modal
  const renderInstagramModal = (modelId: string) => {
    if (!revealedInstagrams[modelId]) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-white mb-4">Instagram Profile</h3>
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-pink-400 font-medium">@{revealedInstagrams[modelId]}</p>
          </div>
          <button 
            onClick={() => window.open(`https://instagram.com/${revealedInstagrams[modelId]}`, '_blank')}
            className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg mb-2"
          >
            Open Instagram
          </button>
          <button 
            onClick={() => setRevealedInstagrams(prev => {
              const newState = {...prev};
              delete newState[modelId];
              return newState;
            })}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-2 pb-4">
      {/* Instagram reveal modals */}
      {Object.keys(revealedInstagrams).map(modelId => renderInstagramModal(modelId))}
      
      {models.length === 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
          <ModelCard
            model={models[0]}
            onVote={() => handleVote(models[0]._id, models[1]._id)}
            onRevealInstagram={() => handleRevealInstagram(models[0]._id)}
            disabled={voting || isRevealing[models[0]._id]}
            isSelected={selectedId === models[0]._id}
          />
          <ModelCard
            model={models[1]}
            onVote={() => handleVote(models[1]._id, models[0]._id)}
            onRevealInstagram={() => handleRevealInstagram(models[1]._id)}
            disabled={voting || isRevealing[models[1]._id]}
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
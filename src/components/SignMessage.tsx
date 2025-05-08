"use client";

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Button } from '~/components/ui/Button';

interface SignMessageProps {
  onMessageSigned: () => void;
}

export default function SignMessage({ onMessageSigned }: SignMessageProps) {
  const { address, isConnected } = useAccount();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signMessage, isPending } = useSignMessage({
    mutation: {
      onSuccess: () => {
        localStorage.setItem('hotOrNotMessageSigned', 'true');
        onMessageSigned();
      },
      onError: () => {
        setError('Failed to sign message. Please try again.');
        setIsSigning(false);
      },
    }
  });

  const handleSignMessage = () => {
    setIsSigning(true);
    setError(null);
    signMessage({ message: 'I agree to browse and vote on Hot or Not images.' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-6 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-white mb-4">Welcome to Hot or Not</h2>
        
        <p className="text-gray-300 mb-6 text-center">
          Please sign this message to confirm your identity and access the app.
          You only need to do this once.
        </p>
        
        {error && (
          <div className="text-red-400 text-center mb-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={handleSignMessage}
            disabled={!isConnected || isPending}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Signing...' : 'Sign Message to Continue'}
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-yellow-400 text-sm text-center mt-4">
            Please connect your wallet first.
          </p>
        )}
      </div>
    </div>
  );
} 
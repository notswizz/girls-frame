import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseTokenAmount, formatTokenAmount, CLANKER_TOKEN_ADDRESS, TOKEN_ABI, TREASURY_ADDRESS } from './tokenUtils';

// Hook to get token balance
export function useTokenBalance(tokenAddress = CLANKER_TOKEN_ADDRESS) {
  const { address } = useAccount();
  const [formattedBalance, setFormattedBalance] = useState("0");
  
  const { data: balanceData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: decimalsData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'decimals',
  });

  const { data: symbolData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'symbol',
  });

  useEffect(() => {
    if (balanceData && decimalsData) {
      setFormattedBalance(formatTokenAmount(balanceData as bigint, decimalsData as number));
    }
  }, [balanceData, decimalsData]);

  return {
    balance: balanceData as bigint || BigInt(0),
    formattedBalance,
    symbol: symbolData as string || "CLANKER",
    decimals: decimalsData as number || 18,
  };
}

// Hook for token approval
export function useTokenApproval(tokenAddress = CLANKER_TOKEN_ADDRESS) {
  const { address } = useAccount();
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'allowance',
    args: [address, TREASURY_ADDRESS],
  });

  const { writeContractAsync } = useWriteContract();
  
  // Get decimals for the token
  const { data: decimalsData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'decimals',
  });

  const approve = async (amount: string) => {
    if (!address) return;
    
    try {
      setIsApproving(true);
      const parsedAmount = parseTokenAmount(amount, (decimalsData as number) || 18);
      
      // Use explicit gas settings to avoid estimation issues
      const txConfig = {
        address: tokenAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [TREASURY_ADDRESS, parsedAmount],
        // Explicitly set gas parameters to avoid estimation issues
        gas: BigInt(1000000),
        account: address
      };

      const hash = await writeContractAsync(txConfig);

      await refetchAllowance();
      return hash;
    } catch (error) {
      console.error('Approval error:', error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (allowanceData && typeof allowanceData === 'bigint' && allowanceData > BigInt(0)) {
      setIsApproved(true);
    } else {
      setIsApproved(false);
    }
  }, [allowanceData]);

  return {
    isApproved,
    isApproving,
    approve,
    allowance: (typeof allowanceData === 'bigint') ? allowanceData : BigInt(0),
  };
}

// Hook for wagering tokens
export function useTokenWager(tokenAddress = CLANKER_TOKEN_ADDRESS) {
  const { address } = useAccount();
  const [isWagering, setIsWagering] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { writeContractAsync } = useWriteContract();
  
  // Get decimals for the token
  const { data: decimalsData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'decimals',
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  // Place a wager 
  const placeWager = async (amount: string) => {
    if (!address) return;
    
    try {
      setIsWagering(true);
      const parsedAmount = parseTokenAmount(amount, (decimalsData as number) || 18);
      
      // Fixed gas configuration - bypass estimation completely
      const txConfig = {
        address: tokenAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'transferFrom',
        args: [address, TREASURY_ADDRESS, parsedAmount],
        // Explicitly set generous gas parameters
        gas: BigInt(1500000), // Very high gas limit
        account: address
      };
      
      // Send the transaction with fixed gas
      const hash = await writeContractAsync(txConfig);
      
      setTxHash(hash);
      return hash;
    } catch (error) {
      console.error('Wagering error:', error);
      setIsWagering(false);
      throw error;
    }
  };

  // For future implementation - currently can't actually pay out
  const payoutWinnings = async (toAddress: `0x${string}`, amount: string) => {
    console.log('Payout function called - but needs treasury access to work');
    return null;
  };

  return {
    placeWager,
    payoutWinnings,
    isWagering,
    isConfirming,
    isConfirmed,
    txHash,
  };
}

// Helper function to wait for transaction
async function waitForTransaction(hash: `0x${string}`) {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        });
        
        if (receipt) {
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 1000);
  });
} 
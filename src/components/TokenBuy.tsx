"use client";

import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { TREASURY_ADDRESS } from "~/lib/tokenUtils";
import { useTokenBalance } from "~/lib/useTokenHooks";
import { parseEther } from "viem";

export default function TokenBuy() {
  const [amount, setAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { symbol } = useTokenBalance();

  const { sendTransactionAsync, isPending: isSendingTransaction } = useSendTransaction();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  // Exchange rate (example: 1 ETH = 1000 tokens)
  const exchangeRate = 1000;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    // Calculate ETH amount based on token amount
    const calculatedEth = value ? (parseFloat(value) / exchangeRate).toString() : "";
    setEthAmount(calculatedEth);
    setError(null);
  };

  const handleEthAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEthAmount(value);
    // Calculate token amount based on ETH amount
    const calculatedAmount = value ? (parseFloat(value) * exchangeRate).toString() : "";
    setAmount(calculatedAmount);
    setError(null);
  };

  const buyTokens = async () => {
    if (!address || !ethAmount) return;
    setError(null);
    
    try {
      const hash = await sendTransactionAsync({
        to: TREASURY_ADDRESS,
        value: parseEther(ethAmount),
        gas: BigInt(100000), // Specify gas limit
      });
      
      setTxHash(hash);
    } catch (error: any) {
      console.error("Error buying tokens:", error);
      if (error?.shortMessage) {
        if (error.shortMessage.includes("insufficient funds")) {
          setError("Not enough ETH to cover the transaction.");
        } else {
          setError(error.shortMessage);
        }
      } else {
        setError("Transaction failed. Please try again.");
      }
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 my-4">
      <h2 className="text-lg font-semibold mb-3 text-white">Buy {symbol} Tokens</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">Amount ({symbol})</label>
          <Input 
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder={`Enter ${symbol} amount`}
            className="w-full bg-black/20 text-white border-gray-700"
          />
        </div>
        
        <div>
          <label className="text-sm text-gray-300 block mb-1">Cost (ETH)</label>
          <Input 
            type="number"
            value={ethAmount}
            onChange={handleEthAmountChange}
            placeholder="Enter ETH amount"
            className="w-full bg-black/20 text-white border-gray-700"
          />
          <p className="text-xs text-gray-400 mt-1">Exchange rate: 1 ETH = {exchangeRate} {symbol}</p>
        </div>
        
        <Button
          onClick={buyTokens}
          disabled={!ethAmount || isSendingTransaction || isConfirming}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
        >
          {isSendingTransaction || isConfirming ? "Processing..." : `Buy ${symbol}`}
        </Button>
        
        {error && (
          <div className="text-sm text-red-400 text-center mt-2">
            {error}
          </div>
        )}
        
        {isConfirmed && (
          <div className="text-sm text-green-400 text-center mt-2">
            Transaction confirmed! Check your token balance.
          </div>
        )}
      </div>
    </div>
  );
} 
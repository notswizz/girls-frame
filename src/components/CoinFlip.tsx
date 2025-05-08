"use client";

import { useCallback, useState, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "~/components/ui/Button";
import { useSession } from "next-auth/react";
import { useFrame } from "~/components/providers/FrameProvider";
import { useTokenBalance, useTokenApproval, useTokenWager } from "~/lib/useTokenHooks";
import { Input } from "~/components/ui/input";

// Clanker World URL for buying tokens
const CLANKER_URL = "https://clanker.world/clanker/0x180dBD6870d1eA6dAB20268D8b32fD62B70FcB07";

export default function CoinFlip({ title }: { title?: string } = { title: "COIN FLIP" }) {
  const { isSDKLoaded, context } = useFrame();
  const { address, isConnected } = useAccount();
  const [result, setResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<number | null>(null);
  const [wagerAmount, setWagerAmount] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [userChoice, setUserChoice] = useState<"Heads" | "Tails" | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showGasInfo, setShowGasInfo] = useState(false);

  // Get token data
  const { formattedBalance, symbol, balance } = useTokenBalance();
  const { isApproved, approve, isApproving } = useTokenApproval();
  const { placeWager, isWagering, isConfirming, isConfirmed, txHash } = useTokenWager();

  // Format balance without decimals
  const simpleBalance = balance ? Math.floor(Number(formattedBalance)) : 0;
  
  // Effect to handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && flipResult !== null) {
      // Only show the result after confirmation
      setResult(flipResult === 1 ? "Heads" : "Tails");
      setIsFlipping(false);
      // Reset retry count on success
      setRetryCount(0);
      setShowGasInfo(false);
    }
  }, [isConfirmed, flipResult]);

  // Check if user has enough tokens
  const hasEnoughTokens = useCallback(() => {
    if (!balance || !wagerAmount) return false;
    try {
      const wagerValue = parseFloat(wagerAmount);
      return balance >= BigInt(Math.floor(wagerValue * 10**18));
    } catch (e) {
      return false;
    }
  }, [balance, wagerAmount]);

  // Calculate if user won based on their choice
  const didUserWin = useCallback(() => {
    if (!result || !userChoice) return false;
    return result === userChoice;
  }, [result, userChoice]);

  const handleApproveTokens = useCallback(async () => {
    if (!address) return;
    setError(null);
    
    try {
      await approve(wagerAmount);
    } catch (error: any) {
      console.error("Error approving tokens:", error);
      setShowGasInfo(true);
      
      // Special case for Base network gas errors
      if (error?.shortMessage?.includes("insufficient funds") || 
          error?.message?.includes("insufficient funds") ||
          error?.message?.includes("gas required exceeds")) {
        setError("Gas estimation failed. See instructions below for custom gas settings.");
      } else if (error?.shortMessage) {
        setError(error.shortMessage);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError("Approval failed. Please try again.");
      }
    }
  }, [address, approve, wagerAmount]);

  const flipCoin = useCallback(async () => {
    if (!address || !isApproved || !userChoice) return;
    
    if (!hasEnoughTokens()) {
      setError(`You don't have enough ${symbol} tokens to place this wager.`);
      return;
    }
    
    setIsFlipping(true);
    setResult(null);
    setError(null);
    
    // Generate random result (1 or 2) but don't display it yet
    const flip = Math.floor(Math.random() * 2) + 1;
    setFlipResult(flip);
    
    try {
      // Place the wager
      await placeWager(wagerAmount);
    } catch (error: any) {
      console.error("Error flipping coin:", error);
      setIsFlipping(false);
      setShowGasInfo(true);
      
      // Increment retry count
      setRetryCount((prev) => prev + 1);
      
      // Special case for Base network gas errors
      if (error?.shortMessage?.includes("insufficient funds") || 
          error?.message?.includes("insufficient funds") ||
          error?.message?.includes("gas required exceeds")) {
        setError("Transaction failed: gas estimation issues. See instructions below.");
      } else if (error?.shortMessage) {
        setError(error.shortMessage);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError("Transaction failed. Please try again.");
      }
    }
  }, [address, placeWager, wagerAmount, isApproved, hasEnoughTokens, symbol, userChoice]);

  // Function to open Clanker token page
  const openClankerPage = useCallback(() => {
    window.open(CLANKER_URL, '_blank');
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white">
      <div
        style={{
          paddingTop: context?.client.safeAreaInsets?.top ?? 0,
          paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
          paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
          paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        }}
        className="flex flex-col items-center justify-center min-h-screen"
      >
        <div className="w-[350px] mx-auto py-8 px-8 bg-black/40 backdrop-blur-md rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.4)] border border-indigo-500/30">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 mb-2">
              {title}
            </h1>
            {isConnected && (
              <div className="text-lg text-indigo-300 mt-1">
                <span className="font-bold text-2xl text-yellow-300">{simpleBalance}</span> {symbol}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-6">
            {isConnected && (
              <div className="w-full">
                <label className="text-sm text-indigo-300 block mb-2 font-semibold">WAGER AMOUNT</label>
                <Input 
                  type="number"
                  value={wagerAmount}
                  onChange={(e) => {
                    setWagerAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder={`Enter amount to wager`}
                  className="w-full bg-black/30 text-white border-indigo-700 text-center text-xl py-5"
                  disabled={isFlipping || isWagering || isConfirming}
                />
              </div>
            )}

            {isConnected && !isFlipping && (
              <div className="w-full">
                <label className="text-sm text-indigo-300 block mb-2 font-semibold">CHOOSE YOUR SIDE</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUserChoice("Heads")}
                    className={`py-4 px-2 rounded-xl font-bold ${userChoice === "Heads" 
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-2 border-white" 
                      : "bg-black/30 text-indigo-200 border border-indigo-700"}`}
                  >
                    HEADS
                  </button>
                  <button
                    onClick={() => setUserChoice("Tails")}
                    className={`py-4 px-2 rounded-xl font-bold ${userChoice === "Tails" 
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-2 border-white" 
                      : "bg-black/30 text-indigo-200 border border-indigo-700"}`}
                  >
                    TAILS
                  </button>
                </div>
              </div>
            )}

            {isFlipping && (
              <div className="relative w-40 h-40 mb-2">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(252,211,77,0.6)] ${isConfirming ? "animate-[spin_1s_linear_infinite]" : ""}`}>
                  <div className="text-7xl">🪙</div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-300 text-center p-3 bg-red-900/40 rounded-lg w-full border border-red-700">
                {error}
              </div>
            )}

            {showGasInfo && (
              <div className="text-xs text-amber-300 p-3 bg-amber-900/20 rounded-lg w-full border border-amber-700">
                <p className="font-bold mb-1">⚠️ Base Network Gas Settings:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>When connecting to your wallet, click "Advanced"</li>
                  <li>Set Gas Limit to <span className="font-mono bg-black/30 px-1 rounded">1500000</span></li>
                  <li>Make sure you have at least 0.01 ETH on Base</li>
                  <li>If using MetaMask, try switching to Coinbase Wallet</li>
                </ol>
              </div>
            )}

            {!isConnected && (
              <div className="text-center text-indigo-300 mb-4">Connect your wallet to play</div>
            )}

            {isConnected && !isApproved ? (
              <Button 
                onClick={handleApproveTokens}
                disabled={isApproving}
                className="w-full py-4 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-500"
              >
                {isApproving ? "APPROVING..." : "APPROVE TOKENS"}
              </Button>
            ) : (
              <Button 
                onClick={flipCoin}
                disabled={!isConnected || isWagering || isConfirming || !isApproved || parseFloat(wagerAmount) <= 0 || !hasEnoughTokens() || !userChoice}
                className={`w-full py-5 text-xl font-extrabold rounded-xl transition-all transform hover:scale-105 ${
                  !isConnected || !hasEnoughTokens() || !userChoice
                    ? "bg-gray-700" 
                    : "bg-gradient-to-r from-yellow-400 to-amber-600 hover:from-yellow-500 hover:to-amber-700 shadow-[0_0_15px_rgba(252,211,77,0.4)]"
                }`}
              >
                {!isConnected 
                  ? "CONNECT WALLET" 
                  : !hasEnoughTokens()
                  ? `NOT ENOUGH ${symbol}`
                  : !userChoice
                  ? "CHOOSE HEADS OR TAILS"
                  : isWagering || isConfirming 
                    ? "FLIPPING COIN..." 
                    : `FLIP FOR ${wagerAmount} ${symbol}`
                }
              </Button>
            )}

            <button
              onClick={() => setShowGasInfo(!showGasInfo)}
              className="text-xs text-blue-300 hover:text-blue-200 bg-transparent border-none cursor-pointer"
            >
              {showGasInfo ? "Hide Gas Settings" : "Show Gas Settings"}
            </button>

            {isConnected && (
              <button 
                onClick={openClankerPage}
                className="text-sm text-yellow-400 hover:text-yellow-300 bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1"
              >
                <span>Need tokens?</span>
                <span className="text-xs">↗</span>
              </button>
            )}

            {result && (
              <div className="mt-4 text-center w-full p-5 bg-black/30 rounded-xl border border-indigo-700">
                <div className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                  {result}
                </div>
                <div className={`text-xl font-bold ${didUserWin() ? "text-green-400" : "text-red-400"}`}>
                  {isConfirmed && (
                    didUserWin()
                      ? `YOU WON ${parseFloat(wagerAmount) * 2} ${symbol}!*` 
                      : `YOU LOST ${wagerAmount} ${symbol}`
                  )}
                </div>
                {didUserWin() && isConfirmed && (
                  <div className="text-xs text-amber-300 mt-2">
                    *This is a demo - actual token payouts coming soon!
                  </div>
                )}
              </div>
            )}

            {isConfirming && !result && (
              <div className="mt-2 text-center animate-pulse">
                <div className="text-lg text-indigo-300">
                  Confirming transaction...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
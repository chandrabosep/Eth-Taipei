'use client';

import React, { useState , useEffect } from 'react';
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { baseSepolia, celo, rootstockTestnet } from "viem/chains";
import {wagmiAbi} from '@/app/create-event/abi'
import {publicClient, getWalletClient, chainConfig  ,walletClient} from '@/app/create-event/config'
import { createWalletClient ,custom } from 'viem'
import { parseGwei } from 'viem'
import { createPublicClient , http } from 'viem'
import { usePrivy } from "@privy-io/react-auth";


// Helper function to truncate address
const truncateAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

// Sample leaderboard data with addresses
const leaderboardData = [
  { id: 1, address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", connectionsMade: 15, xp: 1250 },

];

export default function LeaderboardPage() {
  const { user } = usePrivy();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const getData = async() => {
      try {
        // Use a specific address to test
        const testAddress = '0xB822B51A88E8a03fCe0220B15Cb2C662E42Adec1';
        
        const contractData = await publicClient.readContract({
          address: "0x723733980ce3881d2c9421E3A76bB61636E47c1e", 
          abi: wagmiAbi, 
          functionName: "getGlobalXP", 
          args: [testAddress as `0x${string}`]
        });
        
        console.log("XP for test address:", contractData);
        
        // Update the leaderboard data with the fetched XP
        const updatedLeaderboard = [
          { 
            id: 1, 
            address: testAddress, 
            connectionsMade: 15, 
            xp: Number(contractData) || 0 
          }
        ];
        
        setData(updatedLeaderboard);
      } catch (error) {
        console.error("Error fetching XP data:", error);
      }
    };
    
    getData();
  }, []);

  
  return (
    <div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#5a3e2b] text-center mb-8 sm:mb-12">
          Event <span className="text-[#6b8e50]">Leaderboard</span>
        </h1>

        {/* Leaderboard Table */}
        <div className="bg-[#f0e6c0] rounded-xl shadow-lg border-2 border-[#b89d65] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[3rem_1fr_4rem_4rem] sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 
                         bg-[#b89d65] text-[#f8f5e6] font-medium text-sm sm:text-base">
            <div className="text-center">#</div>
            <div>Address</div>
            <div className="text-center text-xs sm:text-base">Conn.</div>
            <div className="text-center">XP</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#b89d65]/30">
            {data.map((player, index) => (
              <div 
                key={player.id}
                className={`grid grid-cols-[3rem_1fr_4rem_4rem] sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 
                          items-center text-sm sm:text-base
                          ${index < 3 ? 'bg-[#6b8e50]/5' : 'hover:bg-[#b89d65]/5'}
                          transition-colors`}
              >
                {/* Rank Number */}
                <div className="flex justify-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center 
                                justify-center text-sm sm:text-base font-bold
                                ${index === 0 ? 'bg-[#FFD700] text-[#5a3e2b]' : 
                                  index === 1 ? 'bg-[#C0C0C0] text-[#5a3e2b]' :
                                  index === 2 ? 'bg-[#CD7F32] text-[#5a3e2b]' :
                                  'bg-[#b89d65]/20 text-[#5a3e2b]'}`}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Address with Copy Button */}
                <div className="flex items-center gap-1 min-w-0 pr-2">
                  <span className="text-[#5a3e2b] font-mono text-xs sm:text-sm truncate">
                    {truncateAddress(player.address)}
                  </span>
                  <button
                    onClick={() => handleCopyAddress(player.address)}
                    className="p-1 rounded-md hover:bg-[#b89d65]/10 transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    {copiedAddress === player.address ? (
                      <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6b8e50]" />
                    ) : (
                      <ClipboardDocumentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5a3e2b]" />
                    )}
                  </button>
                </div>

                {/* Connections Made - Now visible on mobile */}
                <div className="text-center">
                  <span className="inline-flex items-center justify-center px-1.5 py-1 rounded-full 
                                 bg-[#6b8e50]/10 text-[#6b8e50] text-xs sm:text-sm">
                    {player.connectionsMade}
                  </span>
                </div>

                {/* XP Points */}
                <div className="text-center">
                  <span className="inline-flex items-center justify-center px-1.5 py-1 
                                 rounded-full bg-[#b89d65]/10 text-[#5a3e2b] 
                                 text-xs sm:text-sm">
                    {player.xp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-[#5a3e2b]/80">
          <p>🏆 Top 3 players are highlighted</p>
          <p className="mt-1">Connect with more attendees to earn XP and climb the leaderboard!</p>
        </div>
      </div>
    </div>
  );
}

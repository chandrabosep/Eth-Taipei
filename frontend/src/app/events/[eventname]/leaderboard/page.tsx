'use client';

import React, { useState } from 'react';
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

// Helper function to truncate address
const truncateAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

// Sample leaderboard data with addresses
const leaderboardData = [
  { id: 1, address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", connectionsMade: 15, xp: 1250 },
  { id: 2, address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", connectionsMade: 12, xp: 980 },
  { id: 3, address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", connectionsMade: 11, xp: 890 },
  { id: 4, address: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF", connectionsMade: 10, xp: 850 },
  { id: 5, address: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69", connectionsMade: 9, xp: 780 },
  { id: 6, address: "0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C", connectionsMade: 8, xp: 720 },
  { id: 7, address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", connectionsMade: 7, xp: 650 },
  { id: 8, address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", connectionsMade: 6, xp: 580 },
  { id: 9, address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", connectionsMade: 5, xp: 520 },
  { id: 10, address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", connectionsMade: 4, xp: 450 },
];

export default function LeaderboardPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5e6] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif text-[#5a3e2b] text-center mb-12">
          Event <span className="text-[#6b8e50]">Leaderboard</span>
        </h1>

        {/* Leaderboard Table */}
        <div className="bg-[#f0e6c0] rounded-xl shadow-lg border-2 border-[#b89d65] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-[#b89d65] text-[#f8f5e6] font-medium">
            <div className="text-center">#</div>
            <div>Address</div>
            <div className="text-center">Connections</div>
            <div className="text-center">XP</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#b89d65]/30">
            {leaderboardData.map((player, index) => (
              <div 
                key={player.id}
                className={`grid grid-cols-4 gap-4 p-4 items-center
                          ${index < 3 ? 'bg-[#6b8e50]/5' : 'hover:bg-[#b89d65]/5'}
                          transition-colors`}
              >
                {/* Rank Number */}
                <div className="flex justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                                ${index === 0 ? 'bg-[#FFD700] text-[#5a3e2b]' : 
                                  index === 1 ? 'bg-[#C0C0C0] text-[#5a3e2b]' :
                                  index === 2 ? 'bg-[#CD7F32] text-[#5a3e2b]' :
                                  'bg-[#b89d65]/20 text-[#5a3e2b]'}`}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Address with Copy Button */}
                <div className="flex items-center gap-2">
                  <span className="text-[#5a3e2b] font-mono text-sm">
                    {truncateAddress(player.address)}
                  </span>
                  <button
                    onClick={() => handleCopyAddress(player.address)}
                    className="p-1 rounded-md hover:bg-[#b89d65]/10 transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress === player.address ? (
                      <ClipboardDocumentCheckIcon className="w-4 h-4 text-[#6b8e50]" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4 text-[#5a3e2b]" />
                    )}
                  </button>
                </div>

                {/* Connections Made */}
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full 
                                 bg-[#6b8e50]/10 text-[#6b8e50] text-sm">
                    <span className="font-medium">{player.connectionsMade}</span>
                    <span className="text-xs">connections</span>
                  </span>
                </div>

                {/* XP Points */}
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full 
                                 bg-[#b89d65]/10 text-[#5a3e2b] text-sm">
                    <span className="font-medium">{player.xp}</span>
                    <span className="text-xs">XP</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 text-center text-[#5a3e2b]/80 text-sm">
          <p>🏆 Top 3 players are highlighted</p>
          <p>Connect with more attendees to earn XP and climb the leaderboard!</p>
        </div>
      </div>
    </div>
  );
}

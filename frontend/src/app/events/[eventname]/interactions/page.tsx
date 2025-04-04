'use client';

import React from 'react';
import { UserCircleIcon, ClockIcon, CheckCircleIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface Connection {
  id: number;
  address: string;
  name: string;
  matchedInterests: string[];
  status: 'accepted' | 'pending' | 'rejected';
  timestamp: string;
  xpEarned?: number;
}

// Sample data
const connections: Connection[] = [
  {
    id: 1,
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    name: "Alex",
    matchedInterests: ["DeFi", "NFTs"],
    status: "accepted",
    timestamp: "2024-03-21T15:30:00",
    xpEarned: 100
  },
  {
    id: 2,
    address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
    name: "Sarah",
    matchedInterests: ["Gaming", "Layer 2"],
    status: "pending",
    timestamp: "2024-03-21T14:45:00"
  },
  {
    id: 3,
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    name: "Mike",
    matchedInterests: ["Smart Contracts"],
    status: "rejected",
    timestamp: "2024-03-21T13:15:00"
  },
  // Add more connections as needed
];

// Sample incoming requests data
const incomingRequests: Connection[] = [
  {
    id: 4,
    address: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
    name: "Emma",
    matchedInterests: ["DeFi", "DAOs", "Layer 2"],
    status: "pending",
    timestamp: "2024-03-21T16:15:00"
  },
  {
    id: 5,
    address: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69",
    name: "John",
    matchedInterests: ["NFTs", "Gaming"],
    status: "pending",
    timestamp: "2024-03-21T16:00:00"
  }
];

const truncateAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export default function InteractionsPage() {
  const handleAcceptRequest = (requestId: number) => {
    console.log('Accepting request:', requestId);
    // Handle accept logic
  };

  const handleRejectRequest = (requestId: number) => {
    console.log('Rejecting request:', requestId);
    // Handle reject logic
  };

  return (
    <div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#5a3e2b] mb-6 sm:mb-8">
          Your <span className="text-[#6b8e50]">Interactions</span>
        </h1>

        {/* Stats Overview - Updated for mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8 sm:mb-12">
          {[
            { label: "Total Connections", value: "15" },
            { label: "Pending Requests", value: "3" },
            { label: "XP from Connections", value: "750" }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-[#f0e6c0] rounded-xl p-3 sm:p-6 border-2 border-[#b89d65] text-center"
            >
              <p className="text-lg sm:text-3xl font-bold text-[#5a3e2b] mb-1 sm:mb-2">{stat.value}</p>
              <p className="text-[10px] leading-tight sm:text-base text-[#5a3e2b]/60">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Incoming Requests Section */}
        {incomingRequests.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <UserPlusIcon className="w-6 h-6 text-[#6b8e50]" />
              <h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
                Incoming Requests
              </h2>
              <span className="bg-[#6b8e50] text-[#f8f5e6] text-xs px-2 py-0.5 rounded-full">
                {incomingRequests.length}
              </span>
            </div>
            
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-[#f0e6c0] rounded-xl p-4 sm:p-6 border-2 border-[#b89d65]
                           hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#6b8e50]" />
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-[#5a3e2b]">
                          {request.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#5a3e2b]/60 font-mono">
                          {truncateAddress(request.address)}
                        </p>
                        <p className="text-xs text-[#5a3e2b]/60 mt-1">
                          Requested {new Date(request.timestamp).toLocaleDateString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-[#6b8e50] hover:bg-[#5a7a42] 
                                 text-[#f8f5e6] rounded-lg text-sm font-medium
                                 transition-colors focus:outline-none focus:ring-2 
                                 focus:ring-[#6b8e50] focus:ring-offset-2"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-[#f87171] hover:bg-[#ef4444] 
                                 text-white border-2 border-[#ef4444] rounded-lg text-sm 
                                 font-medium transition-colors focus:outline-none focus:ring-2 
                                 focus:ring-red-300 focus:ring-offset-2"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  {/* Matched Interests */}
                  <div className="mt-4">
                    <p className="text-xs sm:text-sm text-[#5a3e2b]/60 mb-2">Common Interests:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {request.matchedInterests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full 
                                   bg-[#6b8e50]/10 text-[#6b8e50] text-xs sm:text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Connections List section with updated title */}
        <div className="bg-[#f0e6c0] rounded-xl border-2 border-[#b89d65] overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <CheckCircleIcon className="w-6 h-6 text-[#6b8e50]" />
              <h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
                Connection History
              </h2>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-[#f8f5e6] rounded-xl p-4 sm:p-6 border-2 border-[#b89d65]/50
                           hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#6b8e50]" />
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-[#5a3e2b]">
                          {connection.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#5a3e2b]/60 font-mono">
                          {truncateAddress(connection.address)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm
                                  ${connection.status === 'accepted' ? 'bg-[#6b8e50]/10 text-[#6b8e50]' :
                                    connection.status === 'pending' ? 'bg-[#b89d65]/10 text-[#b89d65]' :
                                    'bg-red-100 text-red-600'}`}>
                      {connection.status === 'accepted' ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : connection.status === 'pending' ? (
                        <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <XMarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      <span className="capitalize">{connection.status}</span>
                    </div>
                  </div>

                  {/* Matched Interests */}
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm text-[#5a3e2b]/60 mb-1.5 sm:mb-2">
                      Matched Interests:
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {connection.matchedInterests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full 
                                   bg-[#6b8e50]/10 text-[#6b8e50] text-xs sm:text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center 
                                justify-between gap-2 text-xs sm:text-sm text-[#5a3e2b]/60">
                    <p>
                      Connected {new Date(connection.timestamp).toLocaleDateString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {connection.xpEarned && (
                      <p className="text-[#6b8e50]">
                        +{connection.xpEarned} XP earned
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

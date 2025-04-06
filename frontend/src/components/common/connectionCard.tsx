"use client"



import {
	UserCircleIcon,
	ClockIcon,
	CheckCircleIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";





import React, { useState , useEffect } from 'react';

interface Connection {
	id: string;
	address: string;
	name: string;
	matchedInterests: string[];
	status: "accepted" | "pending" | "rejected";
	timestamp: string;
	xpEarned?: number;
	type?: "sent" | "received";
}

interface ConnectionCardProps {
	connection: Connection;
	truncateAddress: (address: string) => string;
	onAccept?: (address: string) => void;
	onReject?: (id: string) => void;
	style?: string;
	isPending?: boolean;
}

export const ConnectionCard = ({
	connection,
	truncateAddress,
	onAccept,
	onReject,
	style,
	isPending,
}: ConnectionCardProps) => {
	const isPendingRequest = connection.status === "pending";
	const isAccepted = connection.status === "accepted";
	const isRejected = connection.status === "rejected";

	return (
		<div
			className={cn(
				"bg-white/20 rounded-lg shadow-md overflow-hidden border border-[#b89d65]",
				style
			)}
		>
			<div className="p-4">
				<div className="flex justify-between items-start mb-3">
					<div className="flex items-center gap-3">
						<UserCircleIcon className="w-10 h-10 text-[#6b8e50]" />
						<div>
							<h3 className="font-medium text-[#b89d65]">
								{connection.name}
							</h3>
							<p className="text-sm text-[#5a3e2b]/70">
								{truncateAddress(connection.address)}
							</p>
						</div>
					</div>

					{isAccepted && (
						<span className="bg-[#6b8e50]/20 text-[#6b8e50] text-xs px-2 py-1 rounded-full flex items-center">
							<CheckCircleIcon className="w-3 h-3 mr-1" />
							Connected
						</span>
					)}

					{isRejected && (
						<span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex items-center">
							<XMarkIcon className="w-3 h-3 mr-1" />
							Declined
						</span>
					)}

					{isPendingRequest && (
						<span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center">
							<ClockIcon className="w-3 h-3 mr-1" />
							{isPending ? "Pending" : "Awaiting Response"}
						</span>
					)}
				</div>

				{connection.matchedInterests.length > 0 && (
					<div>
						<p className="text-sm text-[#5a3e2b]/80 mb-1">
							Shared interests:
						</p>
						<div className="flex flex-wrap gap-1">
							{connection.matchedInterests.map(
								(interest: string, idx: number) => (
									<span
										key={idx}
										className="bg-[#f0e6c0] border border-[#b89d65] text-[#5a3e2b] text-xs px-2 py-0.5 rounded-full"
									>
										{interest}
									</span>
								)
							)}
						</div>
					</div>
				)}

				<div className="flex items-center text-xs text-[#5a3e2b]/60 mt-2">
					<ClockIcon className="w-3 h-3 mr-1" />
					{new Date(connection.timestamp).toLocaleString()}

					{isAccepted && connection.xpEarned && (
						<span className="ml-auto bg-[#6b8e50]/10 text-[#6b8e50] px-2 py-0.5 rounded">
							+{connection.xpEarned} XP
						</span>
					)}
				</div>

				{/* Action buttons for pending requests */}
				{isPendingRequest && onAccept && onReject && (
					<div className="flex gap-2 mt-3">
						<button
							onClick={() => onAccept(connection.address)}
							className="flex-1 bg-[#6b8e50] hover:bg-[#5a7d3f] text-white py-1.5 rounded-md text-sm transition-colors"
						>
							Accept
						</button>
						<button
							onClick={() => onReject(connection.id)}
							className="flex-1 bg-red-500/80 hover:bg-red-600/80 border border-[#5a3e2b]/30 text-white py-1.5 rounded-md text-sm transition-colors"
						>
							Decline
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

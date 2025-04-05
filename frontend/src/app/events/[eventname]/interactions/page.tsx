"use client";

import React, { useState, useEffect } from "react";
import {
	UserCircleIcon,
	ClockIcon,
	CheckCircleIcon,
	XMarkIcon,
	UserPlusIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { ConnectionCard } from "@/components/common/connectionCard";

// Define our local Connection interface to match the one expected by ConnectionCard
interface Connection {
	id: string;
	address: string;
	name: string;
	matchedInterests: string[];
	status: "accepted" | "pending" | "rejected";
	timestamp: string;
	xpEarned?: number;
}

const truncateAddress = (address: string) => {
	return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

// Mock data for demonstration - updated with string IDs
const mockConnections: Connection[] = [
	{
		id: "1",
		address: "0x1234567890abcdef1234567890abcdef12345678",
		name: "Alice",
		matchedInterests: ["DeFi", "NFTs", "Gaming"],
		status: "accepted",
		timestamp: new Date().toISOString(),
		xpEarned: 50,
	},
	{
		id: "2",
		address: "0xabcdef1234567890abcdef1234567890abcdef12",
		name: "Bob",
		matchedInterests: ["DAOs", "DeFi"],
		status: "pending",
		timestamp: new Date().toISOString(),
	},
	{
		id: "3",
		address: "0x7890abcdef1234567890abcdef1234567890abcd",
		name: "Charlie",
		matchedInterests: ["Gaming", "NFTs"],
		status: "rejected",
		timestamp: new Date().toISOString(),
	},
];

export default function InteractionsPage() {
	const [connections, setConnections] =
		useState<Connection[]>(mockConnections);
	const pendingRequests = connections.filter(
		(conn) => conn.status === "pending"
	);

	const handleAcceptRequest = (requestId: string) => {
		console.log("Accepting request:", requestId);
		setConnections(
			connections.map((conn) =>
				conn.id === requestId
					? { ...conn, status: "accepted", xpEarned: 50 }
					: conn
			)
		);
	};

	const handleRejectRequest = (requestId: string) => {
		console.log("Rejecting request:", requestId);
		setConnections(
			connections.map((conn) =>
				conn.id === requestId ? { ...conn, status: "rejected" } : conn
			)
		);
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
						{
							label: "Total Connections",
							value: connections
								.filter((c) => c.status === "accepted")
								.length.toString(),
						},
						{
							label: "Pending Requests",
							value: pendingRequests.length.toString(),
						},
						{
							label: "XP from Connections",
							value: connections
								.reduce(
									(sum, conn) => sum + (conn.xpEarned || 0),
									0
								)
								.toString(),
						},
					].map((stat, index) => (
						<div
							key={index}
							className="bg-[#f0e6c0] rounded-xl p-3 sm:p-6 border-2 border-[#b89d65] text-center"
						>
							<p className="text-lg sm:text-3xl font-bold text-[#5a3e2b] mb-1 sm:mb-2">
								{stat.value}
							</p>
							<p className="text-[10px] leading-tight sm:text-base text-[#5a3e2b]/60">
								{stat.label}
							</p>
						</div>
					))}
				</div>

				{/* Incoming Requests Section */}
				{pendingRequests.length > 0 && (
					<div className="bg-[#f0e6c0] rounded-xl border-2 border-[#b89d65] overflow-hidden mb-8">
						<div className="p-4 sm:p-6">
							<div className="flex items-center gap-2 mb-4 sm:mb-6">
								<UserPlusIcon className="w-6 h-6 text-[#6b8e50]" />
								<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
									Incoming Requests
								</h2>
							</div>
							<div className="space-y-4 sm:space-y-6">
								{pendingRequests.map((connection) => (
									<ConnectionCard
										key={connection.id}
										connection={connection}
										truncateAddress={truncateAddress}
										onAccept={() =>
											handleAcceptRequest(connection.id)
										}
										onReject={() =>
											handleRejectRequest(connection.id)
										}
									/>
								))}
							</div>
						</div>
					</div>
				)}

				{/* All Connections List section */}
				<div className="bg-[#f0e6c0] rounded-xl border-2 border-[#b89d65] overflow-hidden">
					<div className="p-4 sm:p-6">
						<div className="flex items-center gap-2 mb-4 sm:mb-6">
							<CheckCircleIcon className="w-6 h-6 text-[#6b8e50]" />
							<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
								All Connections
							</h2>
						</div>
						<div className="space-y-4 sm:space-y-6">
							{connections.map((connection) => (
								<ConnectionCard
									key={connection.id}
									connection={connection}
									truncateAddress={truncateAddress}
									onAccept={
										connection.status === "pending"
											? () =>
													handleAcceptRequest(
														connection.id
													)
											: undefined
									}
									onReject={
										connection.status === "pending"
											? () =>
													handleRejectRequest(
														connection.id
													)
											: undefined
									}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

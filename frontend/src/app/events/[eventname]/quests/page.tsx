"use client";

import React, { useState, useEffect } from "react";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getAssignedQuestsForUser,
	getEventUserIdForUser,
} from "@/actions/quest";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { QuestionStatus } from "@prisma/client";

interface Quest {
	id: string;
	title: string;
	description: string;
	xpReward: number;
	isCompleted: boolean;
	status: string;
	metadata: Record<string, any> | null;
	assignedAt: string;
	completedAt: string | null;
	tags: string[];
}

interface EventUserResult {
	success: boolean;
	error?: string | null;
	data: string | null;
}

export default function QuestsPage() {
	const [quests, setQuests] = useState<Quest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<"all" | "pending" | "completed">(
		"pending"
	);
	const params = useParams();
	const { user, ready, authenticated } = usePrivy();

	useEffect(() => {
		async function fetchQuests() {
			try {
				// Wait for Privy to be ready
				if (!ready) {
					setLoading(true);
					return;
				}

				// Check if user is authenticated
				if (!authenticated) {
					setError("Please login to view your quests");
					setLoading(false);
					return;
				}

				// Make sure we have user data
				if (!user?.id && !user?.wallet?.address) {
					setError("Please connect your wallet to view quests");
					setLoading(false);
					return;
				}

				if (!params.eventname) {
					setError("Event name not available in URL");
					setLoading(false);
					return;
				}

				// Try with both Privy ID and wallet address
				const walletAddress = user.wallet?.address;

				// Try with wallet address first if available, then fall back to Privy ID
				let eventUserResult: EventUserResult | undefined;
				if (walletAddress) {
					eventUserResult = await getEventUserIdForUser(
						walletAddress,
						params.eventname as string
					);
					if (!eventUserResult.success && user.id) {
						eventUserResult = await getEventUserIdForUser(
							user.id,
							params.eventname as string
						);
					}
				} else if (user.id) {
					eventUserResult = await getEventUserIdForUser(
						user.id,
						params.eventname as string
					);
				}

				if (!eventUserResult?.success || !eventUserResult?.data) {
					setError(
						eventUserResult?.error ||
							"Not registered for this event. Please register first."
					);
					setLoading(false);
					return;
				}

				const result = await getAssignedQuestsForUser(
					eventUserResult.data
				);

				if (result.success && result.data) {
					const formattedQuests = result.data.map((quest) => ({
						...quest,
						assignedAt: quest.assignedAt.toISOString(),
						completedAt: quest.completedAt
							? quest.completedAt.toISOString()
							: null,
					}));

					setQuests(formattedQuests);
				} else {
					setError(result.error || "Failed to fetch quests");
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				setError("Failed to fetch quests");
			} finally {
				setLoading(false);
			}
		}

		fetchQuests();
	}, [user?.id, params.eventname, ready, authenticated]);

	if (!ready || loading) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b8e50]"></div>
					<p className="text-[#5a3e2b]">
						{!ready
							? "Loading authentication..."
							: "Loading quests..."}
					</p>
				</div>
			</div>
		);
	}

	if (!authenticated) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-[#6b8e50]/10 border border-[#6b8e50] text-[#5a3e2b] px-4 py-3 rounded-lg">
						<strong className="font-bold">Please login </strong>
						<span className="block sm:inline">
							to view your quests.
						</span>
					</div>
				</div>
			</div>
		);
	}

	const filteredQuests = quests.filter((quest) => {
		if (filter === "pending") return !quest.isCompleted;
		if (filter === "completed") return quest.isCompleted;
		return true;
	});

	const totalPendingXP = filteredQuests
		.filter((q) => !q.isCompleted)
		.reduce((sum, q) => sum + (q.xpReward || 0), 0);

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8">
			<div className="max-w-4xl mx-auto">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
					<div>
						<h1 className="text-3xl sm:text-4xl font-serif text-[#5a3e2b] mb-4">
							Your <span className="text-[#6b8e50]">Quests</span>
						</h1>
						<div className="flex gap-2">
							<button
								onClick={() => setFilter("pending")}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
									filter === "pending"
										? "bg-[#6b8e50] text-white"
										: "bg-[#6b8e50]/10 text-[#5a3e2b] hover:bg-[#6b8e50]/20"
								}`}
							>
								Pending
							</button>
							<button
								onClick={() => setFilter("completed")}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
									filter === "completed"
										? "bg-[#6b8e50] text-white"
										: "bg-[#6b8e50]/10 text-[#5a3e2b] hover:bg-[#6b8e50]/20"
								}`}
							>
								Completed
							</button>
							<button
								onClick={() => setFilter("all")}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
									filter === "all"
										? "bg-[#6b8e50] text-white"
										: "bg-[#6b8e50]/10 text-[#5a3e2b] hover:bg-[#6b8e50]/20"
								}`}
							>
								All
							</button>
						</div>
					</div>
					<div className="bg-[#6b8e50]/10 p-4 rounded-lg">
						<p className="text-sm text-[#5a3e2b]">
							Pending XP Available
						</p>
						<p className="text-2xl font-bold text-[#6b8e50]">
							{totalPendingXP} XP
						</p>
					</div>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
						<strong className="font-bold">Error: </strong>
						<span className="block sm:inline">{error}</span>
					</div>
				)}

				{filteredQuests.length === 0 ? (
					<div className="text-center py-12 bg-white/50 rounded-lg border-2 border-[#6b8e50]/20">
						<div className="max-w-sm mx-auto">
							{filter === "pending" ? (
								<p className="text-[#5a3e2b]/70">
									You have no pending quests. Great job!
								</p>
							) : filter === "completed" ? (
								<p className="text-[#5a3e2b]/70">
									You haven't completed any quests yet. Time
									to get started!
								</p>
							) : (
								<p className="text-[#5a3e2b]/70">
									No quests have been assigned to you yet.
									Check back later!
								</p>
							)}
						</div>
					</div>
				) : (
					<div className="grid gap-6">
						{filteredQuests.map((quest) => (
							<div
								key={quest.id}
								className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
									quest.isCompleted
										? "border-[#6b8e50]"
										: "border-[#b89d65]"
								}`}
							>
								<div className="flex justify-between items-start mb-4">
									<div className="flex-1">
										<h3 className="text-xl font-medium text-[#5a3e2b] mb-2">
											{quest.title}
										</h3>
										<p className="text-[#5a3e2b]/70 mb-4">
											{quest.description}
										</p>
										<div className="flex flex-wrap gap-2 mb-3">
											{quest.tags.map((tag, index) => (
												<span
													key={index}
													className="px-3 py-1 bg-[#6b8e50]/10 text-[#5a3e2b] rounded-full text-sm"
												>
													{tag}
												</span>
											))}
										</div>
									</div>
									<div className="flex flex-col items-end gap-3 ml-4">
										<div className="flex items-center gap-2">
											<span className="font-bold text-lg text-[#6b8e50]">
												{quest.xpReward} XP
											</span>
											{quest.isCompleted ? (
												<CheckCircleIcon className="h-6 w-6 text-[#6b8e50]" />
											) : (
												<XCircleIcon className="h-6 w-6 text-[#b89d65]" />
											)}
										</div>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium ${
												quest.isCompleted
													? "bg-[#6b8e50]/10 text-[#6b8e50]"
													: "bg-[#b89d65]/10 text-[#b89d65]"
											}`}
										>
											{quest.isCompleted
												? "Completed"
												: "Pending"}
										</span>
									</div>
								</div>
								<div className="text-sm text-[#5a3e2b]/60 border-t border-[#5a3e2b]/10 pt-4">
									<span>
										Assigned:{" "}
										{new Date(
											quest.assignedAt
										).toLocaleDateString()}
									</span>
									{quest.completedAt && (
										<span className="ml-4">
											Completed:{" "}
											{new Date(
												quest.completedAt
											).toLocaleDateString()}
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
	UsersIcon,
	TrophyIcon,
	SparklesIcon,
	ShareIcon,
	CheckCircleIcon,
	XCircleIcon,
	EyeIcon,
	ClipboardIcon,
} from "@heroicons/react/24/outline";
import { getEventBySlug } from "@/actions/events.action";

interface EventUser {
	id: string;
	user: {
		name: string | null;
		address: string;
	};
	status: "PENDING" | "ACCEPTED" | "REJECTED";
	tags: string[];
	createdAt: Date;
	xp?: number;
	connections?: Array<any>;
	completedQuests?: Array<any>;
	about?: string;
}

interface EventData {
	name: string;
	image?: string;
	startDate: Date;
	eventUsers: EventUser[];
	creatorAddress: string;
	organizers: Array<{ address: string }>;
	slug: string;
}

interface UserModalProps {
	user: EventUser | null;
	onClose: () => void;
	onAction: (userId: string, action: "approve" | "reject") => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onAction }) => {
	if (!user) return null;

	const getStatusDisplay = (status: EventUser["status"]) => {
		if (status === "ACCEPTED") return "Approved";
		return status.charAt(0) + status.slice(1).toLowerCase();
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#f8f5e6] rounded-xl p-4 sm:p-8 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-start mb-6">
					<h3 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
						{user.user.name || "Anonymous"}
					</h3>
					<button
						onClick={onClose}
						className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
					>
						✕
					</button>
				</div>

				<div className="space-y-6">
					<div>
						<p className="text-sm text-[#5a3e2b]/60">
							Wallet Address
						</p>
						<p className="text-[#5a3e2b] font-mono text-xs sm:text-sm break-all">
							{user.user.address}
						</p>
					</div>

					<div>
						<p className="text-sm text-[#5a3e2b]/60">About</p>
						<p className="text-[#5a3e2b]">
							{user.about || "No description provided"}
						</p>
					</div>

					<div>
						<p className="text-sm text-[#5a3e2b]/60">Interests</p>
						<div className="flex flex-wrap gap-2 mt-2">
							{user.tags?.map((tag, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-[#6b8e50]/10 text-[#6b8e50] rounded-full text-sm"
								>
									{tag}
								</span>
							))}
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-[#f0e6c0] p-4 rounded-lg">
							<p className="text-sm text-[#5a3e2b]/60">
								XP Earned
							</p>
							<p className="text-xl font-bold text-[#5a3e2b]">
								{user.xp || 0}
							</p>
						</div>
						<div className="bg-[#f0e6c0] p-4 rounded-lg">
							<p className="text-sm text-[#5a3e2b]/60">
								Connections
							</p>
							<p className="text-xl font-bold text-[#5a3e2b]">
								{user.connections?.length || 0}
							</p>
						</div>
						<div className="bg-[#f0e6c0] p-4 rounded-lg">
							<p className="text-sm text-[#5a3e2b]/60">Quests</p>
							<p className="text-xl font-bold text-[#5a3e2b]">
								{user.completedQuests?.length || 0}
							</p>
						</div>
					</div>

					{user.status === "PENDING" && (
						<div className="flex flex-col sm:flex-row gap-4 mt-8">
							<button
								onClick={() => onAction(user.id, "approve")}
								className="flex-1 bg-[#6b8e50] text-white py-2 px-4 rounded-lg hover:bg-[#5a7a42] transition-colors"
							>
								Approve
							</button>
							<button
								onClick={() => onAction(user.id, "reject")}
								className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
							>
								Reject
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default function DashboardPage() {
	const params = useParams();
	const router = useRouter();
	const { user, ready } = usePrivy();
	const eventSlug = params.eventname as string;
	const [eventData, setEventData] = useState<EventData | null>(null);
	const [loading, setLoading] = useState(true);
	const [accessChecked, setAccessChecked] = useState(false);
	const [selectedUser, setSelectedUser] = useState<EventUser | null>(null);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);

	const getStatusDisplay = (status: EventUser["status"]) => {
		if (status === "ACCEPTED") return "Approved";
		return status.charAt(0) + status.slice(1).toLowerCase();
	};

	useEffect(() => {
		console.log("Effect running with:", {
			ready,
			userExists: !!user,
			walletExists: !!user?.wallet,
			walletAddress: user?.wallet?.address,
			eventSlug,
		});

		// Don't run the effect until Privy is ready
		if (!ready) {
			console.log("Waiting for Privy to be ready...");
			return;
		}

		const checkAccessAndFetchData = async () => {
			try {
				// If no wallet is connected, redirect to home
				if (!user?.wallet?.address) {
					console.log("No wallet connected - user state:", {
						user,
						wallet: user?.wallet,
						address: user?.wallet?.address,
					});
					router.push("/");
					return;
				}

				console.log("Fetching data for event slug:", eventSlug);
				console.log("Connected wallet address:", user.wallet.address);

				const data = await getEventBySlug(eventSlug);
				if (!data) {
					console.error("Event not found");
					router.push("/events");
					return;
				}

				console.log("Event data:", {
					name: data.name,
					creatorAddress: data.creatorAddress,
					organizersCount: data.organizers?.length || 0,
					organizers: data.organizers?.map((org) => org.address),
				});

				// Check if user has access
				const userAddress = user.wallet.address.toLowerCase();
				const isCreator =
					data.creatorAddress?.toLowerCase() === userAddress;
				const isOrganizer =
					data.organizers?.some(
						(org) => org.address?.toLowerCase() === userAddress
					) || false;

				console.log("Access check:", {
					userAddress,
					creatorAddress: data.creatorAddress?.toLowerCase(),
					isCreator,
					isOrganizer,
					organizerAddresses: data.organizers?.map((org) =>
						org.address?.toLowerCase()
					),
				});

				if (!isCreator && !isOrganizer) {
					console.log(
						"Access denied: User is not creator or organizer"
					);
					router.push(`/events/${eventSlug}`);
					return;
				}

				console.log("Access granted!");
				setEventData(data);
				setAccessChecked(true);
			} catch (error) {
				console.error("Error checking access:", error);
				router.push("/events");
			} finally {
				setLoading(false);
			}
		};

		checkAccessAndFetchData();
	}, [eventSlug, router, user?.wallet?.address, ready]);

	// Show loading state while Privy is initializing
	if (!ready) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">
					Initializing wallet connection...
				</div>
			</div>
		);
	}

	if (!user?.wallet?.address) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">
					Please connect your wallet to access the dashboard
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">Loading...</div>
			</div>
		);
	}

	if (!eventData || !accessChecked) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">
					Access denied or event not found
				</div>
			</div>
		);
	}

	// Calculate stats
	const totalAttendees = eventData.eventUsers.length;
	const totalXP = eventData.eventUsers.reduce(
		(sum, user) => sum + (user.xp || 0),
		0
	);
	const averageConnections = Math.round(
		eventData.eventUsers.reduce(
			(sum, user) => sum + (user.connections?.length || 0),
			0
		) / totalAttendees || 0
	);
	const questsCompleted = eventData.eventUsers.reduce(
		(sum, user) => sum + (user.completedQuests?.length || 0),
		0
	);

	// Calculate interest groups
	const interestGroups = eventData.eventUsers.reduce(
		(groups: Record<string, number>, user) => {
			user.tags?.forEach((tag: string) => {
				groups[tag] = (groups[tag] || 0) + 1;
			});
			return groups;
		},
		{}
	);

	const sortedInterestGroups = Object.entries(interestGroups)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	const handleUserAction = async (
		userId: string,
		action: "approve" | "reject"
	) => {
		try {
			// TODO: Implement API call to update user status
			console.log(`User ${userId} ${action}ed`);
			// Update local state
			setEventData((prev) => {
				if (!prev) return prev;
				const updatedUsers = prev.eventUsers.map((user) => {
					if (user.id === userId) {
						return {
							...user,
							status:
								action === "approve"
									? ("ACCEPTED" as const)
									: ("REJECTED" as const),
						};
					}
					return user;
				});

				return {
					...prev,
					eventUsers: updatedUsers,
				};
			});
			setSelectedUser(null);
		} catch (error) {
			console.error("Error updating user status:", error);
		}
	};

	const copyEventLink = async () => {
		const link = `${window.location.origin}/events/${eventData?.slug}/register`;
		try {
			await navigator.clipboard.writeText(link);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Hero Section */}
			<div className="relative h-40 sm:h-64 bg-[#f0e6c0] border-b-2 border-[#b89d65]">
				<img
					src={
						eventData.image ||
						"https://placehold.co/1200x400/f0e6c0/5a3e2b"
					}
					alt={eventData.name}
					className="w-full h-full object-cover opacity-50"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-[#f8f5e6] to-transparent" />
				<div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8">
					<h1 className="text-2xl sm:text-4xl md:text-5xl font-serif text-[#5a3e2b] break-words">
						{eventData.name}
					</h1>
					<p className="text-[#5a3e2b]/80 mt-2 text-sm sm:text-base">
						{new Date(eventData.startDate).toLocaleDateString(
							"en-US",
							{
								day: "numeric",
								month: "long",
								year: "numeric",
							}
						)}
					</p>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
				{/* Share Event Section */}
				<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-6 border-2 border-[#b89d65] mb-6 sm:mb-12">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
								Share Event
							</h2>
							<p className="text-[#5a3e2b]/60 text-sm sm:text-base">
								Invite more people to join your event
							</p>
							<p className="text-[#5a3e2b] mt-2 text-xs sm:text-sm break-all">
								Registration link:{" "}
								<span className="font-mono">{`${window.location.origin}/events/${eventData?.slug}/register`}</span>
							</p>
						</div>
						<button
							onClick={copyEventLink}
							className="flex items-center gap-2 bg-[#6b8e50] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#5a7a42] transition-colors w-full sm:w-auto justify-center"
						>
							{copySuccess ? (
								<>
									<CheckCircleIcon className="w-5 h-5" />
									Copied!
								</>
							) : (
								<>
									<ClipboardIcon className="w-5 h-5" />
									Copy Link
								</>
							)}
						</button>
					</div>
				</div>

				{/* Key Metrics */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-12">
					{[
						{
							icon: <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
							label: "Total Attendees",
							value: totalAttendees,
							color: "bg-[#6b8e50]",
						},
						{
							icon: <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
							label: "Total XP Earned",
							value: totalXP.toLocaleString(),
							color: "bg-[#b89d65]",
						},
						{
							icon: <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
							label: "Avg. Connections",
							value: averageConnections,
							color: "bg-[#8c7851]",
						},
						{
							icon: <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
							label: "Quests Completed",
							value: questsCompleted,
							color: "bg-[#5a7a42]",
						},
					].map((metric, index) => (
						<div
							key={index}
							className="bg-[#f0e6c0] rounded-xl p-4 sm:p-6 border-2 border-[#b89d65] 
									 relative overflow-hidden group hover:shadow-lg transition-all"
						>
							<div
								className={`absolute right-0 top-0 w-16 h-16 sm:w-24 sm:h-24 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 rounded-full 
										 ${metric.color} opacity-10 group-hover:opacity-20 transition-opacity`}
							/>
							<div
								className={`${metric.color} text-[#f8f5e6] p-2 sm:p-3 rounded-lg 
										 inline-flex mb-3 sm:mb-4`}
							>
								{metric.icon}
							</div>
							<p className="text-2xl sm:text-4xl font-bold text-[#5a3e2b] mb-1 sm:mb-2">
								{metric.value}
							</p>
							<p className="text-sm sm:text-base text-[#5a3e2b]/60">{metric.label}</p>
						</div>
					))}
				</div>

				{/* Interest Distribution */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
					{/* Interest Groups Chart */}
					<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65]">
						<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b] mb-4 sm:mb-6">
							Interest Distribution
						</h2>
						<div className="space-y-4 sm:space-y-6">
							{sortedInterestGroups.map((group, index) => (
								<div key={index}>
									<div className="flex justify-between mb-1 sm:mb-2">
										<span className="text-sm sm:text-base text-[#5a3e2b] font-medium">
											{group.name}
										</span>
										<span className="text-sm sm:text-base text-[#5a3e2b]/60">
											{Math.round(
												(group.count / totalAttendees) *
													100
											)}
											%
										</span>
									</div>
									<div className="h-2 sm:h-3 bg-[#b89d65]/20 rounded-full overflow-hidden">
										<div
											className="h-full bg-[#6b8e50] rounded-full transition-all duration-500"
											style={{
												width: `${
													(group.count /
														totalAttendees) *
													100
												}%`,
											}}
										/>
									</div>
									<p className="text-xs sm:text-sm text-[#5a3e2b]/60 mt-1">
										{group.count} attendees
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Activity Timeline */}
					<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65]">
						<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b] mb-4 sm:mb-6">
							Recent Activity
						</h2>
						<div className="space-y-4 sm:space-y-6">
							{/* We'll keep the sample activity data for now */}
							{[
								{
									type: "Quest",
									text: "New quest completed by 5 attendees",
									time: "5 minutes ago",
								},
								{
									type: "Connection",
									text: "15 new connections made",
									time: "15 minutes ago",
								},
								{
									type: "XP",
									text: "500 XP earned collectively",
									time: "30 minutes ago",
								},
								{
									type: "Quest",
									text: "New networking quest unlocked",
									time: "1 hour ago",
								},
								{
									type: "Connection",
									text: "25 attendees joined DeFi discussion",
									time: "2 hours ago",
								},
							].map((activity, index) => (
								<div
									key={index}
									className="flex items-start gap-3 sm:gap-4"
								>
									<div className="w-2 h-2 rounded-full bg-[#6b8e50] mt-2" />
									<div>
										<p className="text-sm sm:text-base text-[#5a3e2b]">
											{activity.text}
										</p>
										<p className="text-xs sm:text-sm text-[#5a3e2b]/60">
											{activity.time}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Registered Users Section - Moved to bottom */}
				<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65] mt-6 sm:mt-12">
					<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b] mb-4 sm:mb-6">
						Registered Users
					</h2>
					<div className="overflow-x-auto -mx-4 sm:mx-0">
						<div className="inline-block min-w-full align-middle">
							<table className="min-w-full">
								<thead>
									<tr className="text-left text-[#5a3e2b]/60">
										<th className="pb-3 sm:pb-4 pl-4 sm:pl-0 pr-2 sm:pr-4 text-xs sm:text-sm">Name</th>
										<th className="pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm">Wallet</th>
										<th className="pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm">Status</th>
										<th className="pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Registered</th>
										<th className="pb-3 sm:pb-4 pl-2 sm:pl-4 pr-4 sm:pr-0 text-xs sm:text-sm">Actions</th>
									</tr>
								</thead>
								<tbody>
									{eventData.eventUsers.map((user) => (
										<tr
											key={user.id}
											className="border-t border-[#b89d65]/20"
										>
											<td className="py-3 sm:py-4 pl-4 sm:pl-0 pr-2 sm:pr-4 text-xs sm:text-sm text-[#5a3e2b]">
												{user.user.name || "Anonymous"}
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-[#5a3e2b] font-mono">
												{user.user.address.slice(0, 4)}...
												{user.user.address.slice(-4)}
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4">
												<span
													className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
														user.status === "ACCEPTED"
															? "bg-green-100 text-green-800"
															: user.status ===
															  "REJECTED"
															? "bg-red-100 text-red-800"
															: "bg-yellow-100 text-yellow-800"
													}`}
												>
													{getStatusDisplay(user.status)}
												</span>
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-[#5a3e2b]/60 hidden sm:table-cell">
												{new Date(
													user.createdAt
												).toLocaleDateString()}
											</td>
											<td className="py-3 sm:py-4 pl-2 sm:pl-4 pr-4 sm:pr-0">
												<button
													onClick={() =>
														setSelectedUser(user)
													}
													className="text-[#6b8e50] hover:text-[#5a7a42]"
												>
													<EyeIcon className="w-5 h-5" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			{/* User Modal */}
			{selectedUser && (
				<UserModal
					user={selectedUser}
					onClose={() => setSelectedUser(null)}
					onAction={handleUserAction}
				/>
			)}
		</div>
	);
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
	UsersIcon,
	TrophyIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { getEventBySlug } from "@/actions/events.action";

interface EventData {
	name: string;
	image?: string;
	startDate: Date;
	eventUsers: any[];
	creatorAddress: string;
	organizers: Array<{ address: string }>;
}

export default function DashboardPage() {
	const params = useParams();
	const router = useRouter();
	const { user, ready } = usePrivy();
	const eventSlug = params.eventname as string;
	const [eventData, setEventData] = useState<EventData | null>(null);
	const [loading, setLoading] = useState(true);
	const [accessChecked, setAccessChecked] = useState(false);

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
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center">
				<div className="text-[#5a3e2b]">
					Initializing wallet connection...
				</div>
			</div>
		);
	}

	if (!user?.wallet?.address) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center">
				<div className="text-[#5a3e2b]">
					Please connect your wallet to access the dashboard
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center">
				<div className="text-[#5a3e2b]">Loading...</div>
			</div>
		);
	}

	if (!eventData || !accessChecked) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center">
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

	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Hero Section */}
			<div className="relative h-64 bg-[#f0e6c0] border-b-2 border-[#b89d65]">
				<img
					src={
						eventData.image ||
						"https://placehold.co/1200x400/f0e6c0/5a3e2b"
					}
					alt={eventData.name}
					className="w-full h-full object-cover opacity-50"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-[#f8f5e6] to-transparent" />
				<div className="absolute bottom-8 left-8 right-8">
					<h1 className="text-4xl md:text-5xl font-serif text-[#5a3e2b]">
						{eventData.name}
					</h1>
					<p className="text-[#5a3e2b]/80 mt-2">
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

			<div className="max-w-7xl mx-auto px-8 py-12">
				{/* Key Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
					{[
						{
							icon: <UsersIcon className="w-8 h-8" />,
							label: "Total Attendees",
							value: totalAttendees,
							color: "bg-[#6b8e50]",
						},
						{
							icon: <SparklesIcon className="w-8 h-8" />,
							label: "Total XP Earned",
							value: totalXP.toLocaleString(),
							color: "bg-[#b89d65]",
						},
						{
							icon: <UsersIcon className="w-8 h-8" />,
							label: "Avg. Connections",
							value: averageConnections,
							color: "bg-[#8c7851]",
						},
						{
							icon: <TrophyIcon className="w-8 h-8" />,
							label: "Quests Completed",
							value: questsCompleted,
							color: "bg-[#5a7a42]",
						},
					].map((metric, index) => (
						<div
							key={index}
							className="bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65] 
									 relative overflow-hidden group hover:shadow-lg transition-all"
						>
							<div
								className={`absolute right-0 top-0 w-24 h-24 -mr-8 -mt-8 rounded-full 
										 ${metric.color} opacity-10 group-hover:opacity-20 transition-opacity`}
							/>
							<div
								className={`${metric.color} text-[#f8f5e6] p-3 rounded-lg 
										 inline-flex mb-4`}
							>
								{metric.icon}
							</div>
							<p className="text-4xl font-bold text-[#5a3e2b] mb-2">
								{metric.value}
							</p>
							<p className="text-[#5a3e2b]/60">{metric.label}</p>
						</div>
					))}
				</div>

				{/* Interest Distribution */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Interest Groups Chart */}
					<div className="bg-[#f0e6c0] rounded-xl p-8 border-2 border-[#b89d65]">
						<h2 className="text-2xl font-serif text-[#5a3e2b] mb-6">
							Interest Distribution
						</h2>
						<div className="space-y-6">
							{sortedInterestGroups.map((group, index) => (
								<div key={index}>
									<div className="flex justify-between mb-2">
										<span className="text-[#5a3e2b] font-medium">
											{group.name}
										</span>
										<span className="text-[#5a3e2b]/60">
											{Math.round(
												(group.count / totalAttendees) *
													100
											)}
											%
										</span>
									</div>
									<div className="h-3 bg-[#b89d65]/20 rounded-full overflow-hidden">
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
									<p className="text-sm text-[#5a3e2b]/60 mt-1">
										{group.count} attendees
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Activity Timeline */}
					<div className="bg-[#f0e6c0] rounded-xl p-8 border-2 border-[#b89d65]">
						<h2 className="text-2xl font-serif text-[#5a3e2b] mb-6">
							Recent Activity
						</h2>
						<div className="space-y-6">
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
									className="flex items-start gap-4"
								>
									<div className="w-2 h-2 rounded-full bg-[#6b8e50] mt-2" />
									<div>
										<p className="text-[#5a3e2b]">
											{activity.text}
										</p>
										<p className="text-sm text-[#5a3e2b]/60">
											{activity.time}
										</p>
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

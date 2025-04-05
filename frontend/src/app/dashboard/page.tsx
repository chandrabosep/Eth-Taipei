"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
	CalendarIcon,
	UserGroupIcon,
	ChartBarIcon,
	ClockIcon,
	FireIcon,
	ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
	getDashboardData,
	type DashboardData,
} from "@/actions/dashboard.action";

interface EventCardProps {
	event: {
		id: string;
		name: string;
		slug: string;
		startDate: Date;
		endDate: Date;
		pictureUrl: string | null;
		description?: string | null;
		tags: string[];
		registeredUsersCount?: number;
		status?: "PENDING" | "ACCEPTED" | "REJECTED";
	};
	showRegistrations?: boolean;
}

function EventCard({ event, showRegistrations = false }: EventCardProps) {
	const router = useRouter();

	return (
		<div className="bg-[#f8f5e6] rounded-lg border-2 border-[#b89d65] overflow-hidden">
			<div className="h-40 bg-[#f0e6c0] relative">
				<img
					src={event.pictureUrl || "/event-fall.jpg"}
					alt={event.name}
					className="w-full h-full object-cover"
				/>

				{showRegistrations && (
					<div className="absolute top-2 right-2 px-3 py-1 rounded-full text-sm bg-[#6b8e50]/10 text-[#6b8e50]">
						{event.registeredUsersCount} registered
					</div>
				)}
				{event.status && (
					<div
						className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm ${
							event.status === "ACCEPTED"
								? "bg-green-100 text-green-800"
								: event.status === "REJECTED"
								? "bg-red-100 text-red-800"
								: "bg-yellow-100 text-yellow-800"
						}`}
					>
						{event.status}
					</div>
				)}
			</div>

			<div className="p-4">
				<h3 className="text-lg font-medium text-[#5a3e2b] mb-2">
					{event.name}
				</h3>
				<p className="text-sm text-[#5a3e2b]/60 mb-4">
					{new Date(event.startDate).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
				</p>

				<div className="flex flex-wrap gap-2 mb-4">
					{event.tags.slice(0, 3).map((tag, index) => (
						<span
							key={index}
							className="px-2 py-1 bg-[#6b8e50]/10 text-[#6b8e50] rounded-full text-xs"
						>
							{tag}
						</span>
					))}
				</div>

				<button
					onClick={() => router.push(`/events/${event.slug}`)}
					className="w-full bg-[#6b8e50] text-white py-2 rounded-lg hover:bg-[#5a7a42] transition-colors"
				>
					View Event
				</button>
			</div>
		</div>
	);
}

export default function DashboardPage() {
	const router = useRouter();
	const { user } = usePrivy();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const data = await getDashboardData();
				setDashboardData(data);
				setError(null);
			} catch (error: any) {
				console.error("Error fetching dashboard data:", error);
				// Check if it's a database connection error
				if (error?.code === "P1001") {
					setError(
						"Unable to connect to the database. Please check your internet connection and try again."
					);
				} else {
					setError(
						"Failed to load dashboard data. Please try again."
					);
				}
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [retryCount]); // Add retryCount as a dependency

	const handleRetry = () => {
		setLoading(true);
		setRetryCount((prev) => prev + 1);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b8e50] mx-auto mb-4"></div>
					<div className="text-[#5a3e2b]">Loading dashboard...</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex flex-col items-center justify-center gap-4 px-4">
				<h1 className="text-2xl font-serif text-[#5a3e2b] text-center">
					Unable to Load Dashboard
				</h1>
				<div className="text-[#5a3e2b]/60 text-center max-w-md">
					{error}
				</div>
				<div className="flex gap-4">
					<button
						onClick={handleRetry}
						className="px-4 py-2 bg-[#6b8e50] text-white rounded-lg hover:bg-[#5a7a42] transition-colors flex items-center gap-2"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Retry
					</button>
					<button
						onClick={() => router.push("/events")}
						className="px-4 py-2 bg-white text-[#6b8e50] border-2 border-[#6b8e50] rounded-lg hover:bg-[#6b8e50]/10 transition-colors"
					>
						Browse Events
					</button>
				</div>
			</div>
		);
	}

	if (!dashboardData) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Hero Section */}
			<div className="relative h-36 bg-[#f0e6c0] border-b-2 border-[#b89d65]">
				<div className="absolute bottom-8 left-8 right-8">
					<h1 className="text-4xl md:text-5xl font-serif text-[#5a3e2b]">
						My Dashboard
					</h1>
					{user?.wallet?.address && (
						<p className="text-[#5a3e2b]/60 mt-2">
							{user.wallet.address}
						</p>
					)}
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Section */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<div className="bg-[#f0e6c0] rounded-xl p-4 border-2 border-[#b89d65]">
						<div className="flex items-center gap-3 mb-2">
							<CalendarIcon className="w-5 h-5 text-[#6b8e50]" />
							<h3 className="text-sm text-[#5a3e2b]/60">
								My Events
							</h3>
						</div>
						<p className="text-2xl font-bold text-[#5a3e2b]">
							{dashboardData.stats.totalEvents}
						</p>
					</div>
					<div className="bg-[#f0e6c0] rounded-xl p-4 border-2 border-[#b89d65]">
						<div className="flex items-center gap-3 mb-2">
							<UserGroupIcon className="w-5 h-5 text-[#6b8e50]" />
							<h3 className="text-sm text-[#5a3e2b]/60">
								Registrations
							</h3>
						</div>
						<p className="text-2xl font-bold text-[#5a3e2b]">
							{dashboardData.stats.totalRegistrations}
						</p>
					</div>
					<div className="bg-[#f0e6c0] rounded-xl p-4 border-2 border-[#b89d65]">
						<div className="flex items-center gap-3 mb-2">
							<ChartBarIcon className="w-5 h-5 text-[#6b8e50]" />
							<h3 className="text-sm text-[#5a3e2b]/60">
								Accepted
							</h3>
						</div>
						<p className="text-2xl font-bold text-[#5a3e2b]">
							{dashboardData.stats.totalAcceptedRegistrations}
						</p>
					</div>
					<div className="bg-[#f0e6c0] rounded-xl p-4 border-2 border-[#b89d65]">
						<div className="flex items-center gap-3 mb-2">
							<ClockIcon className="w-5 h-5 text-[#6b8e50]" />
							<h3 className="text-sm text-[#5a3e2b]/60">
								Pending
							</h3>
						</div>
						<p className="text-2xl font-bold text-[#5a3e2b]">
							{dashboardData.stats.totalPendingRegistrations}
						</p>
					</div>
				</div>

				{/* My Upcoming Events Section */}
				<div className="mb-12">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<CalendarIcon className="w-6 h-6 text-[#6b8e50]" />
							<h2 className="text-2xl font-serif text-[#5a3e2b]">
								My Upcoming Events
							</h2>
						</div>
						<button
							onClick={() => router.push("/events")}
							className="flex items-center gap-2 text-[#6b8e50] hover:text-[#5a7a42]"
						>
							Find More Events
							<ArrowRightIcon className="w-4 h-4" />
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{dashboardData.upcomingEvents.map((event) => (
							<EventCard
								key={event.id}
								event={event}
								showRegistrations={false}
							/>
						))}
					</div>
				</div>

				{/* Recommended Events Section */}
				<div className="mb-12">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<FireIcon className="w-6 h-6 text-[#6b8e50]" />
							<h2 className="text-2xl font-serif text-[#5a3e2b]">
								Recommended For You
							</h2>
						</div>
						<button
							onClick={() => router.push("/events")}
							className="flex items-center gap-2 text-[#6b8e50] hover:text-[#5a7a42]"
						>
							View All
							<ArrowRightIcon className="w-4 h-4" />
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{dashboardData.popularEvents.map((event) => (
							<EventCard
								key={event.id}
								event={event}
								showRegistrations={false}
							/>
						))}
					</div>
				</div>

				{/* Past Events Section */}
				<div>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<UserGroupIcon className="w-6 h-6 text-[#6b8e50]" />
							<h2 className="text-2xl font-serif text-[#5a3e2b]">
								Past Events
							</h2>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{dashboardData.recentlyRegisteredEvents.map((event) => (
							<EventCard key={event.id} event={event} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

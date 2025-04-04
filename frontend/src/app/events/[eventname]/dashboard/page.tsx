'use client';

import React from 'react';
import { UsersIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Sample data for single event
const eventData = {
	name: "ETH Taipei 2024",
	image: "https://placehold.co/1200x400/f0e6c0/5a3e2b",
	date: "2024-03-21",
	stats: {
		totalAttendees: 250,
		totalXP: 12500,
		averageConnections: 8,
		questsCompleted: 450,
		intrestGroups: [
			{ name: "DeFi", count: 85 },
			{ name: "NFTs", count: 65 },
			{ name: "Gaming", count: 45 },
			{ name: "Layer 2", count: 55 },
			{ name: "Smart Contracts", count: 60 },
			{ name: "DAOs", count: 45 }
		]
	}
};

export default function DashboardPage() {
	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Hero Section */}
			<div className="relative h-64 bg-[#f0e6c0] border-b-2 border-[#b89d65]">
				<img
					src={eventData.image}
					alt={eventData.name}
					className="w-full h-full object-cover opacity-50"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-[#f8f5e6] to-transparent" />
				<div className="absolute bottom-8 left-8 right-8">
					<h1 className="text-4xl md:text-5xl font-serif text-[#5a3e2b]">
						{eventData.name}
					</h1>
					<p className="text-[#5a3e2b]/80 mt-2">
						{new Date(eventData.date).toLocaleDateString('en-US', {
							day: 'numeric',
							month: 'long',
							year: 'numeric'
						})}
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
							value: eventData.stats.totalAttendees,
							color: "bg-[#6b8e50]"
						},
						{
							icon: <SparklesIcon className="w-8 h-8" />,
							label: "Total XP Earned",
							value: eventData.stats.totalXP.toLocaleString(),
							color: "bg-[#b89d65]"
						},
						{
							icon: <UsersIcon className="w-8 h-8" />,
							label: "Avg. Connections",
							value: eventData.stats.averageConnections,
							color: "bg-[#8c7851]"
						},
						{
							icon: <TrophyIcon className="w-8 h-8" />,
							label: "Quests Completed",
							value: eventData.stats.questsCompleted,
							color: "bg-[#5a7a42]"
						}
					].map((metric, index) => (
						<div
							key={index}
							className="bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65] 
									 relative overflow-hidden group hover:shadow-lg transition-all"
						>
							<div className={`absolute right-0 top-0 w-24 h-24 -mr-8 -mt-8 rounded-full 
										 ${metric.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
							<div className={`${metric.color} text-[#f8f5e6] p-3 rounded-lg 
										 inline-flex mb-4`}>
								{metric.icon}
							</div>
							<p className="text-4xl font-bold text-[#5a3e2b] mb-2">
								{metric.value}
							</p>
							<p className="text-[#5a3e2b]/60">
								{metric.label}
							</p>
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
							{eventData.stats.intrestGroups.map((group, index) => (
								<div key={index}>
									<div className="flex justify-between mb-2">
										<span className="text-[#5a3e2b] font-medium">
											{group.name}
										</span>
										<span className="text-[#5a3e2b]/60">
											{Math.round((group.count / eventData.stats.totalAttendees) * 100)}%
										</span>
									</div>
									<div className="h-3 bg-[#b89d65]/20 rounded-full overflow-hidden">
										<div
											className="h-full bg-[#6b8e50] rounded-full transition-all duration-500"
											style={{
												width: `${(group.count / eventData.stats.totalAttendees) * 100}%`
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
							{[
								{ type: "Quest", text: "New quest completed by 5 attendees", time: "5 minutes ago" },
								{ type: "Connection", text: "15 new connections made", time: "15 minutes ago" },
								{ type: "XP", text: "500 XP earned collectively", time: "30 minutes ago" },
								{ type: "Quest", text: "New networking quest unlocked", time: "1 hour ago" },
								{ type: "Connection", text: "25 attendees joined DeFi discussion", time: "2 hours ago" }
							].map((activity, index) => (
								<div key={index} className="flex items-start gap-4">
									<div className="w-2 h-2 rounded-full bg-[#6b8e50] mt-2" />
									<div>
										<p className="text-[#5a3e2b]">{activity.text}</p>
										<p className="text-sm text-[#5a3e2b]/60">{activity.time}</p>
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

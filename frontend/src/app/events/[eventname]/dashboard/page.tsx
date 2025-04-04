'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Event {
	id: number;
	name: string;
	image: string;
	date: string;
	stats: {
		totalAttendees: number;
		totalXP: number;
		intrestGroups: {
			name: string;
			count: number;
		}[];
	};
}

// Sample data
const events: Event[] = [
	{
		id: 1,
		name: "ETH Taipei 2024",
		image: "https://placehold.co/600x400/f0e6c0/5a3e2b",
		date: "2024-03-21",
		stats: {
			totalAttendees: 250,
			totalXP: 12500,
			intrestGroups: [
				{ name: "DeFi", count: 85 },
				{ name: "NFTs", count: 65 },
				{ name: "Gaming", count: 45 },
				{ name: "Layer 2", count: 55 }
			]
		}
	},
	{
		id: 2,
		name: "Web3 Summit",
		image: "https://placehold.co/600x400/f0e6c0/5a3e2b",
		date: "2024-04-15",
		stats: {
			totalAttendees: 180,
			totalXP: 8900,
			intrestGroups: [
				{ name: "Smart Contracts", count: 60 },
				{ name: "DAOs", count: 45 },
				{ name: "Security", count: 40 },
				{ name: "Infrastructure", count: 35 }
			]
		}
	},
	// Add more events as needed
];

export default function DashboardPage() {
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-4xl font-serif text-[#5a3e2b] mb-12">
					Event <span className="text-[#6b8e50]">Dashboard</span>
				</h1>

				{/* Event Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{events.map((event) => (
						<div
							key={event.id}
							onClick={() => setSelectedEvent(event)}
							className="bg-[#f0e6c0] rounded-xl overflow-hidden border-2 border-[#b89d65] 
									 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer"
						>
							<div className="aspect-video relative overflow-hidden">
								<img
									src={event.image}
									alt={event.name}
									className="object-cover w-full h-full"
								/>
							</div>
							<div className="p-6">
								<h3 className="text-2xl font-serif text-[#5a3e2b] mb-2">
									{event.name}
								</h3>
								<p className="text-[#5a3e2b]/80">
									{new Date(event.date).toLocaleDateString('en-US', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Event Details Modal */}
				{selectedEvent && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<div className="bg-[#f8f5e6] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6 relative">
								<button
									onClick={() => setSelectedEvent(null)}
									className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#b89d65]/10 
											 transition-colors text-[#5a3e2b]"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>

								<h2 className="text-3xl font-serif text-[#5a3e2b] mb-6">
									{selectedEvent.name}
								</h2>

								{/* Stats Grid */}
								<div className="grid grid-cols-2 gap-4 mb-8">
									<div className="bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65]">
										<p className="text-[#5a3e2b]/60 text-sm mb-1">Total Attendees</p>
										<p className="text-3xl font-bold text-[#5a3e2b]">
											{selectedEvent.stats.totalAttendees}
										</p>
									</div>
									<div className="bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65]">
										<p className="text-[#5a3e2b]/60 text-sm mb-1">Total XP Earned</p>
										<p className="text-3xl font-bold text-[#5a3e2b]">
											{selectedEvent.stats.totalXP}
										</p>
									</div>
								</div>

								{/* Interest Groups */}
								<div className="bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65]">
									<h3 className="text-xl font-serif text-[#5a3e2b] mb-4">
										Interest Groups
									</h3>
									<div className="space-y-4">
										{selectedEvent.stats.intrestGroups.map((group, index) => (
											<div key={index} className="flex items-center justify-between">
												<span className="text-[#5a3e2b]">{group.name}</span>
												<div className="flex items-center gap-2">
													<div className="w-32 h-2 rounded-full bg-[#b89d65]/20">
														<div
															className="h-full rounded-full bg-[#6b8e50]"
															style={{
																width: `${(group.count / selectedEvent.stats.totalAttendees) * 100}%`
															}}
														/>
													</div>
													<span className="text-[#5a3e2b] font-medium min-w-[3ch]">
														{group.count}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

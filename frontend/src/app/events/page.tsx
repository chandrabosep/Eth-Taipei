"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
	CalendarIcon,
	MapPinIcon,
	ClockIcon,
} from "@heroicons/react/24/outline";
import { getEvents } from "@/actions/events.action";

interface Event {
	id: string;
	name: string;
	description: string | null;
	pictureUrl: string | null;
	startDate: Date;
	endDate: Date;
	tags: string[];
	slug: string;
}

export default function EventsPage() {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const eventData = await getEvents();
				setEvents(eventData);
			} catch (error) {
				console.error("Error fetching events:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (date: Date) => {
		return new Date(date).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const EventCard = ({ event }: { event: Event }) => (
		<Link
			href={`/events/${event.slug}`}
			className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl 
                transition-shadow border-2 border-[#b89d65]"
		>
			<div className="aspect-video relative">
				<img
					src={event.pictureUrl || "/event-fall.jpg"}
					alt={event.name}
					className="object-cover w-full h-full"
				/>
			</div>
			<div className="p-6">
				<h3 className="text-xl font-medium text-[#5a3e2b] mb-2">
					{event.name}
				</h3>
				<p className="text-[#5a3e2b]/70 text-sm mb-4">
					{event.description || "No description available"}
				</p>
				<div className="space-y-2">
					<div className="flex items-center text-[#5a3e2b]/70 text-sm">
						<CalendarIcon className="w-4 h-4 mr-2" />
						{formatDate(event.startDate)}
					</div>
					<div className="flex items-center text-[#5a3e2b]/70 text-sm">
						<ClockIcon className="w-4 h-4 mr-2" />
						{formatTime(event.startDate)} -{" "}
						{formatTime(event.endDate)}
					</div>
					<div className="flex flex-wrap gap-2 mt-2">
						{event.tags.map((tag, index) => (
							<span
								key={index}
								className="bg-[#f0e6c0] text-[#5a3e2b] text-xs px-2 py-1 rounded-full"
							>
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		</Link>
	);

	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Header */}
			<div className="">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<h1 className="text-3xl font-serif text-[#5a3e2b]">
						Events
					</h1>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Events Section */}
				<div>
					{loading ? (
						<div className="text-center py-12">
							<p className="text-[#5a3e2b]/70 text-lg">
								Loading events...
							</p>
						</div>
					) : events.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{events.map((event) => (
								<EventCard key={event.id} event={event} />
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-white rounded-xl border-2 border-[#b89d65]">
							<p className="text-[#5a3e2b]/70 text-lg">
								No events found.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

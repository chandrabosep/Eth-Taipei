"use server";

import prisma from "@/lib/db";
import { generateQuestsForUser } from "./quest";
import { runInBackground } from "@/lib/background";

interface UpdateEventData {
	id: string;
	name?: string;
	description?: string;
	startDate?: Date;
	endDate?: Date;
	pictureUrl?: string | null;
	tags?: string[];
}

interface EventStatistics {
	totalRegistrations: number;
	registrationsByCountry: { country: string; count: number }[];
	topInterests: { interest: string; count: number }[];
}

interface DashboardEventData {
	id: string;
	name: string;
	description: string;
	startDate: Date;
	endDate: Date;
	pictureUrl: string | null;
	tags: string[];
	creatorAddress: string;
	organizers: {
		id: string;
		address: string;
		role: string;
	}[];
	eventUsers: {
		id: string;
		userId: string;
		tags: string[];
		bio: string | null;
		socials: Record<string, string>;
		status: "PENDING" | "ACCEPTED" | "REJECTED";
		createdAt: Date;
		user: {
			name: string | null;
			country: string | null;
			address: string;
		};
	}[];
}

export interface DashboardData {
	upcomingEvents: {
		id: string;
		name: string;
		slug: string;
		startDate: Date;
		endDate: Date;
		pictureUrl: string | null;
		description: string | null;
		tags: string[];
		registeredUsersCount: number;
	}[];
	popularEvents: {
		id: string;
		name: string;
		slug: string;
		startDate: Date;
		endDate: Date;
		pictureUrl: string | null;
		description: string | null;
		tags: string[];
		registeredUsersCount: number;
	}[];
	recentlyRegisteredEvents: {
		id: string;
		name: string;
		slug: string;
		startDate: Date;
		endDate: Date;
		pictureUrl: string | null;
		status: "PENDING" | "ACCEPTED" | "REJECTED";
		tags: string[];
	}[];
	stats: {
		totalEvents: number;
		totalRegistrations: number;
		totalAcceptedRegistrations: number;
		totalPendingRegistrations: number;
	};
}

export async function getEventDashboardData(
	slug: string
): Promise<DashboardEventData | null> {
	try {
		const event = await prisma.event.findUnique({
			where: { slug },
			include: {
				organizers: {
					select: {
						id: true,
						address: true,
						role: true,
					},
				},
				eventUsers: {
					select: {
						id: true,
						userId: true,
						tags: true,
						bio: true,
						socials: true,
						status: true,
						createdAt: true,
						user: {
							select: {
								name: true,
								country: true,
								address: true,
							},
						},
					},
				},
			},
		});

		return event as DashboardEventData | null;
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		throw error;
	}
}

export async function updateEvent(data: UpdateEventData) {
	try {
		const updatedEvent = await prisma.event.update({
			where: { id: data.id },
			data: {
				name: data.name,
				description: data.description,
				startDate: data.startDate,
				endDate: data.endDate,
				pictureUrl: data.pictureUrl,
				tags: data.tags,
			},
		});

		return { success: true, data: updatedEvent };
	} catch (error) {
		console.error("Error updating event:", error);
		return { success: false, error: "Failed to update event" };
	}
}

export async function removeOrganizer(eventId: string, organizerId: string) {
	try {
		await prisma.organizer.delete({
			where: {
				id: organizerId,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error removing organizer:", error);
		return { success: false, error: "Failed to remove organizer" };
	}
}

export async function getEventStatistics(
	eventId: string
): Promise<EventStatistics> {
	try {
		const eventUsers = await prisma.eventUser.findMany({
			where: { eventId },
			select: {
				user: {
					select: {
						country: true,
					},
				},
				tags: true,
			},
		});

		// Calculate total registrations
		const totalRegistrations = eventUsers.length;

		// Calculate registrations by country
		const countryCount = new Map<string, number>();
		eventUsers.forEach((eu) => {
			const country = eu.user.country || "Unknown";
			countryCount.set(country, (countryCount.get(country) || 0) + 1);
		});

		const registrationsByCountry = Array.from(countryCount.entries()).map(
			([country, count]) => ({
				country,
				count,
			})
		);

		// Calculate top interests
		const interestCount = new Map<string, number>();
		eventUsers.forEach((eu) => {
			eu.tags.forEach((tag: string) => {
				interestCount.set(tag, (interestCount.get(tag) || 0) + 1);
			});
		});

		const topInterests = Array.from(interestCount.entries())
			.map(([interest, count]) => ({
				interest,
				count,
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return {
			totalRegistrations,
			registrationsByCountry,
			topInterests,
		};
	} catch (error) {
		console.error("Error getting event statistics:", error);
		throw error;
	}
}

export async function removeRegisteredUser(eventId: string, userId: string) {
	try {
		await prisma.eventUser.delete({
			where: {
				userId_eventId: {
					userId,
					eventId,
				},
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error removing registered user:", error);
		return { success: false, error: "Failed to remove user" };
	}
}

export async function updateEventImage(
	eventId: string,
	pictureUrl: string | null
) {
	try {
		const updatedEvent = await prisma.event.update({
			where: { id: eventId },
			data: { pictureUrl },
		});

		return { success: true, data: updatedEvent };
	} catch (error) {
		console.error("Error updating event image:", error);
		return { success: false, error: "Failed to update event image" };
	}
}

export async function updateUserStatus(
	eventId: string,
	userId: string,
	status: "ACCEPTED" | "REJECTED"
) {
	try {
		// First find the EventUser record to get the correct userId
		const eventUser = await prisma.eventUser.findFirst({
			where: {
				id: userId,
				eventId: eventId,
			},
			select: {
				userId: true,
				id: true,
			},
		});

		if (!eventUser) {
			throw new Error("User registration not found");
		}

		// Update using the composite unique key
		const updatedEventUser = await prisma.eventUser.update({
			where: {
				userId_eventId: {
					userId: eventUser.userId,
					eventId: eventId,
				},
			},
			data: {
				status,
			},
		});

		// If user is accepted, trigger quest generation in the background
		if (status === "ACCEPTED") {
			// Use our utility to run the quest generation in the background
			runInBackground(async () => {
				const questResult = await generateQuestsForUser({
					eventUserId: updatedEventUser.id,
					eventId: eventId,
					questCount: 3, // Default to 3 quests per user
				});

				if (!questResult.success) {
					throw new Error(
						`Quest generation failed: ${questResult.error}`
					);
				}

				return {
					questCount: questResult.data?.length || 0,
					userId: updatedEventUser.id,
				};
			}, `quest-generation-for-user-${updatedEventUser.id}`);

			// Return immediately with success to avoid timeout
			return {
				success: true,
				data: updatedEventUser,
				message:
					"User status updated. Quest generation started in the background.",
			};
		}

		return { success: true, data: updatedEventUser };
	} catch (error) {
		console.error("Error updating user status:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to update user status",
		};
	}
}

export async function getDashboardData(): Promise<DashboardData> {
	try {
		const now = new Date();

		// Get upcoming events (events that haven't ended yet)
		const upcomingEvents = await prisma.event.findMany({
			where: {
				endDate: {
					gte: now,
				},
			},
			select: {
				id: true,
				name: true,
				slug: true,
				startDate: true,
				endDate: true,
				pictureUrl: true,
				description: true,
				tags: true,
				_count: {
					select: {
						eventUsers: true,
					},
				},
			},
			orderBy: {
				startDate: "asc",
			},
			take: 6,
		});

		// Get popular events (events with most registrations)
		const popularEvents = await prisma.event.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
				startDate: true,
				endDate: true,
				pictureUrl: true,
				description: true,
				tags: true,
				_count: {
					select: {
						eventUsers: true,
					},
				},
			},
			orderBy: {
				eventUsers: {
					_count: "desc",
				},
			},
			take: 6,
		});

		// Get recently registered events for the current user
		const recentlyRegisteredEvents = await prisma.event.findMany({
			where: {
				eventUsers: {
					some: {},
				},
			},
			select: {
				id: true,
				name: true,
				slug: true,
				startDate: true,
				endDate: true,
				pictureUrl: true,
				tags: true,
				eventUsers: {
					select: {
						status: true,
					},
					orderBy: {
						createdAt: "desc",
					},
					take: 1,
				},
			},
			orderBy: {
				eventUsers: {
					_count: "desc",
				},
			},
			take: 6,
		});

		// Get overall stats
		const stats = await prisma.$transaction([
			prisma.event.count(),
			prisma.eventUser.count(),
			prisma.eventUser.count({
				where: {
					status: "ACCEPTED",
				},
			}),
			prisma.eventUser.count({
				where: {
					status: "PENDING",
				},
			}),
		]);

		return {
			upcomingEvents: upcomingEvents.map((event) => ({
				...event,
				registeredUsersCount: event._count.eventUsers,
			})),
			popularEvents: popularEvents.map((event) => ({
				...event,
				registeredUsersCount: event._count.eventUsers,
			})),
			recentlyRegisteredEvents: recentlyRegisteredEvents.map((event) => ({
				...event,
				status: event.eventUsers[0]?.status || "PENDING",
			})),
			stats: {
				totalEvents: stats[0],
				totalRegistrations: stats[1],
				totalAcceptedRegistrations: stats[2],
				totalPendingRegistrations: stats[3],
			},
		};
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		throw error;
	}
}

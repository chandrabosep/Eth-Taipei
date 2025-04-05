"use server";
import prisma from "@/lib/db";

interface CreateEventData {
	eventName: string;
	description: string;
	startDate: string;
	endDate: string;
	features: string[];
	pictureUrl?: string;
	creatorAddress: string;
}

interface AddOrganizerData {
	eventId: string;
	address: string;
	role: string;
}

function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/&/g, "-and-")
		.replace(/[^\w\-]+/g, "")
		.replace(/\-\-+/g, "-");
}

export async function createEvent(data: CreateEventData) {
	try {
		const {
			eventName,
			description,
			startDate,
			endDate,
			features,
			pictureUrl,
			creatorAddress,
		} = data;

		const slug = slugify(eventName);

		const createdEvent = await prisma.event.create({
			data: {
				name: eventName,
				slug,
				description,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				tags: features.filter((feature) => feature.trim() !== ""),
				pictureUrl,
				creatorAddress,
			},
		});

		// Add the creator as an organizer
		await prisma.organizer.create({
			data: {
				eventId: createdEvent.id,
				address: creatorAddress,
				role: "organizer",
			},
		});

		console.log("Event created successfully:", createdEvent);
		return createdEvent;
	} catch (error) {
		console.error("Error creating event:", error);
		throw error;
	}
}

export async function addOrganizer(data: AddOrganizerData) {
	try {
		const { eventId, address, role } = data;

		// Check if the event exists
		const event = await prisma.event.findUnique({
			where: { id: eventId },
		});

		if (!event) {
			throw new Error("Event not found");
		}

		// Check if the organizer already exists for this event
		const existingOrganizer = await prisma.organizer.findFirst({
			where: {
				eventId,
				address,
			},
		});

		if (existingOrganizer) {
			throw new Error("This address is already an organizer for this event");
		}

		// Add the new organizer
		const organizer = await prisma.organizer.create({
			data: {
				eventId,
				address,
				role,
			},
		});

		console.log("Organizer added successfully:", organizer);
		return organizer;
	} catch (error) {
		console.error("Error adding organizer:", error);
		throw error;
	}
}

export async function getEvents() {
	const events = await prisma.event.findMany({
		orderBy: {
			startDate: "asc",
		},
	});
	return events;
}

export async function getEventBySlug(slug: string) {
	const event = await prisma.event.findUnique({
		where: {
			slug,
		},
		include: {
			eventUsers: {
				include: {
					user: true,
				},
			},
			organizers: true,
		},
	});
	return event;
}

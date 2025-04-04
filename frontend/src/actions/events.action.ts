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

		console.log("Event created successfully:", createdEvent);
		return createdEvent;
	} catch (error) {
		console.error("Error creating event:", error);
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
		},
	});
	return event;
}

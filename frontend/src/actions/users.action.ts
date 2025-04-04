"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function registerForEvent({
	userId,
	eventId,
	bio,
	socials,
	tags,
	meetingPreferences,
	name,
	country,
	address,
}: {
	userId: string;
	eventId: string;
	bio: string;
	socials: Record<string, string>;
	tags: string[];
	meetingPreferences: string[];
	name?: string;
	country?: string;
	address?: string;
}) {
	try {
		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		// If user doesn't exist, create them
		if (!existingUser) {
			await prisma.user.create({
				data: {
					id: userId,
					name,
					country,
					address: address || userId, // Use address if provided, otherwise use userId
				},
			});
		}

		const eventUser = await prisma.eventUser.create({
			data: {
				userId,
				eventId,
				bio,
				socials,
				tags,
				meetingPreferences,
				status: "PENDING",
			},
		});

		revalidatePath(`/events/${eventId}`);
		return { success: true, data: eventUser };
	} catch (error) {
		console.error("Failed to register for event:", error);
		return { success: false, error: "Failed to register for event" };
	}
}

export async function updateEventUserStatus({
	eventUserId,
	status,
}: {
	eventUserId: string;
	status: "ACCEPTED" | "REJECTED";
}) {
	try {
		const eventUser = await prisma.eventUser.update({
			where: {
				id: eventUserId,
			},
			data: {
				status,
			},
			include: {
				event: true,
			},
		});

		revalidatePath(`/events/${eventUser.eventId}`);
		return { success: true, data: eventUser };
	} catch (error) {
		console.error("Failed to update user status:", error);
		return { success: false, error: "Failed to update user status" };
	}
}

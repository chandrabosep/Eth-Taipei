"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";

/**
 * Register an NFC tag address to a user for a specific event
 */
export async function registerNfcAddress({
	userId,
	eventSlug,
	nfcAddress,
}: {
	userId: string;
	eventSlug: string;
	nfcAddress: string;
}) {
	try {
		// Find the event by slug
		const event = await prisma.event.findUnique({
			where: { slug: eventSlug },
		});

		if (!event) {
			console.log("Event not found:", eventSlug);
			return {
				success: false,
				error: "Event not found",
			};
		}

		// Find the event user
		const eventUser = await prisma.eventUser.findFirst({
			where: {
				userId: userId,
				eventId: event.id,
			},
		});

		if (!eventUser) {
			console.log("User not registered for event:", {
				userId,
				eventId: event.id,
			});
			return {
				success: false,
				error: "User not registered for this event",
			};
		}

		// Check if this NFC address is already registered to another user in this event
		const existingNfcUser = await prisma.eventUser.findFirst({
			where: {
				nfcAddress: nfcAddress,
				eventId: event.id,
				NOT: {
					id: eventUser.id, // Exclude the current user
				},
			},
		});

		if (existingNfcUser) {
			console.log("NFC tag already registered:", {
				nfcAddress,
				existingUserId: existingNfcUser.userId,
			});
			return {
				success: false,
				error: "This NFC tag is already registered to another user",
			};
		}

		console.log("Attempting to update user with NFC address:", {
			eventUserId: eventUser.id,
			nfcAddress,
		});

		// Update the user's NFC address
		const updatedUser = await prisma.eventUser.update({
			where: { id: eventUser.id },
			data: { nfcAddress },
		});

		console.log("Successfully updated user with NFC address:", updatedUser);

		revalidatePath(`/events/${eventSlug}`);
		return {
			success: true,
			data: updatedUser,
			message: "NFC tag registered successfully",
		};
	} catch (error) {
		console.error("Failed to register NFC address:", error);
		// Return more detailed error information
		return {
			success: false,
			error:
				error instanceof Error
					? `Failed to register NFC address: ${error.message}`
					: "Failed to register NFC address",
		};
	}
}

/**
 * Verify an NFC tag and get user information for a connection
 */
export async function verifyNfcAddress({
	nfcAddress,
	eventSlug,
}: {
	nfcAddress: string;
	eventSlug: string;
}) {
	try {
		console.log("Starting NFC verification for:", {
			nfcAddress,
			eventSlug,
		});

		// Find the event by slug
		const event = await prisma.event.findUnique({
			where: { slug: eventSlug },
		});

		if (!event) {
			console.log("Event not found during NFC verification:", eventSlug);
			return {
				success: false,
				error: "Event not found",
			};
		}

		console.log("Found event:", {
			eventId: event.id,
			eventName: event.name,
		});

		// Find the event user with this NFC address
		const eventUser = await prisma.eventUser.findFirst({
			where: {
				nfcAddress: nfcAddress,
				eventId: event.id,
			},
			include: {
				user: true,
			},
		});

		if (!eventUser) {
			console.log("No user found with NFC address:", {
				nfcAddress,
				eventId: event.id,
			});
			return {
				success: false,
				error: "No user found with this NFC tag",
			};
		}

		console.log("Found user with NFC address:", {
			userId: eventUser.userId,
			eventUserId: eventUser.id,
			tags: eventUser.tags,
		});

		// Return the user data in the same format as the QR code data
		return {
			success: true,
			data: {
				address: eventUser.userId,
				primaryTag: eventUser.tags[0] || "",
				allTags: eventUser.tags || [],
			},
		};
	} catch (error) {
		console.error("Failed to verify NFC address:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? `Failed to verify NFC address: ${error.message}`
					: "Failed to verify NFC address",
		};
	}
}

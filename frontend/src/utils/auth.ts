"use server";

import prisma from "@/lib/db";
import { usePrivy } from "@privy-io/react-auth";

export async function isEventAdmin(eventId: string, userAddress: string) {
	try {
		const event = await prisma.event.findUnique({
			where: { id: eventId },
			include: {
				organizers: true,
			},
		});

		if (!event) return false;

		// Check if user is the event creator
		if (
			event.creatorAddress.toLowerCase() === userAddress.toLowerCase() ||
			event.organizers.some(
				(organizer) =>
					organizer.address.toLowerCase() ===
					userAddress.toLowerCase()
			)
		) {
			return true;
		}
	} catch (error) {
		console.error("Error checking event admin status:", error);
		return false;
	}
}

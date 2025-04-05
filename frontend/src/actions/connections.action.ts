"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function sendConnectionRequest({
	senderId,
	receiverAddress,
	eventId,
}: {
	senderId: string;
	receiverAddress: string;
	eventId: string;
}) {
	try {
		// Find the receiver's EventUser record
		const receiverEventUser = await prisma.eventUser.findFirst({
			where: {
				userId: receiverAddress,
				eventId: eventId,
			},
		});

		if (!receiverEventUser) {
			return {
				success: false,
				error: "Receiver is not registered for this event",
			};
		}

		// Find the sender's EventUser record
		const senderEventUser = await prisma.eventUser.findFirst({
			where: {
				userId: senderId,
				eventId: eventId,
			},
		});

		if (!senderEventUser) {
			return {
				success: false,
				error: "You are not registered for this event",
			};
		}

		// Check if a connection already exists
		const existingConnection = await prisma.connection.findFirst({
			where: {
				OR: [
					{
						senderId: senderEventUser.id,
						receiverId: receiverEventUser.id,
					},
					{
						senderId: receiverEventUser.id,
						receiverId: senderEventUser.id,
					},
				],
			},
		});

		if (existingConnection) {
			return {
				success: false,
				error: "Connection already exists",
			};
		}

		// Create the connection request
		const connection = await prisma.connection.create({
			data: {
				senderId: senderEventUser.id,
				receiverId: receiverEventUser.id,
				status: "PENDING",
			},
		});

		revalidatePath(`/events/${eventId}`);
		return { success: true, data: connection };
	} catch (error) {
		console.error("Failed to send connection request:", error);
		return {
			success: false,
			error: "Failed to send connection request",
		};
	}
}

export async function getPendingRequests({
	userId,
	eventId,
}: {
	userId: string;
	eventId: string;
}) {
	try {
		// Find the user's EventUser record
		const eventUser = await prisma.eventUser.findFirst({
			where: {
				userId: userId,
				eventId: eventId,
			},
		});

		if (!eventUser) {
			return {
				success: false,
				error: "User not found in this event",
			};
		}

		// Get all pending requests where this user is either the sender or receiver
		const pendingRequests = await prisma.connection.findMany({
			where: {
				OR: [
					{
						receiverId: eventUser.id,
						status: "PENDING",
					},
					{
						senderId: eventUser.id,
						status: "PENDING",
					},
				],
			},
			include: {
				sender: {
					include: {
						user: true,
					},
				},
				receiver: {
					include: {
						user: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Transform the data to match the Connection interface
		const formattedRequests = pendingRequests.map((request) => {
			const isSender = request.senderId === eventUser.id;
			const otherUser = isSender ? request.receiver : request.sender;

			return {
				id: request.id,
				address: otherUser.user.address,
				name: otherUser.user.name || "Anonymous",
				matchedInterests: otherUser.tags || [],
				status: "pending" as const,
				timestamp: request.createdAt.toISOString(),
				type: isSender ? "sent" : ("received" as const),
			};
		});

		return { success: true, data: formattedRequests };
	} catch (error) {
		console.error("Failed to fetch pending requests:", error);
		return {
			success: false,
			error: "Failed to fetch pending requests",
		};
	}
}

export async function updateConnectionStatus({
	connectionId,
	status,
	eventId,
}: {
	connectionId: string;
	status: "ACCEPTED" | "REJECTED";
	eventId: string;
}) {
	try {
		const connection = await prisma.connection.update({
			where: {
				id: connectionId,
			},
			data: {
				status,
			},
		});

		revalidatePath(`/events/${eventId}`);
		return { success: true, data: connection };
	} catch (error) {
		console.error("Failed to update connection status:", error);
		return {
			success: false,
			error: "Failed to update connection status",
		};
	}
}

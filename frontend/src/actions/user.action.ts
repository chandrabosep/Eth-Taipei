"use server";

import prisma from "@/lib/db";

export interface UserProfile {
	name: string | null;
	country: string | null;
	address: string;
	events: {
		id: string;
		name: string;
		startDate: Date;
		endDate: Date;
		pictureUrl: string | null;
		status: "PENDING" | "ACCEPTED" | "REJECTED";
		tags: string[];
		bio: string | null;
		socials: Record<string, string>;
	}[];
}

export async function getUserProfile(
	address: string
): Promise<UserProfile | null> {
	try {
		// First find the user by address
		const userByAddress = await prisma.user.findFirst({
			where: { address: address.toLowerCase() },
		});

		if (!userByAddress) return null;

		// Then get the full profile using the user's ID
		const user = await prisma.user.findUnique({
			where: { id: userByAddress.id },
			select: {
				name: true,
				country: true,
				address: true,
				eventUsers: {
					select: {
						status: true,
						tags: true,
						bio: true,
						socials: true,
						event: {
							select: {
								id: true,
								name: true,
								startDate: true,
								endDate: true,
								pictureUrl: true,
							},
						},
					},
				},
			},
		});

		if (!user) return null;

		return {
			name: user.name,
			country: user.country,
			address: user.address,
			events: user.eventUsers.map((eu) => ({
				id: eu.event.id,
				name: eu.event.name,
				startDate: eu.event.startDate,
				endDate: eu.event.endDate,
				pictureUrl: eu.event.pictureUrl,
				status: eu.status as "PENDING" | "ACCEPTED" | "REJECTED",
				tags: eu.tags,
				bio: eu.bio,
				socials: eu.socials as Record<string, string>,
			})),
		};
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return null;
	}
}

export async function updateUserProfile(
	address: string,
	data: {
		name?: string | null;
		country?: string | null;
	}
) {
	try {
		// First find the user by address
		const userByAddress = await prisma.user.findFirst({
			where: { address: address.toLowerCase() },
		});

		if (!userByAddress) {
			return { success: false, error: "User not found" };
		}

		// Then update using the user's ID
		const user = await prisma.user.update({
			where: { id: userByAddress.id },
			data: {
				name: data.name,
				country: data.country,
			},
		});

		return { success: true, data: user };
	} catch (error) {
		console.error("Error updating user profile:", error);
		return { success: false, error: "Failed to update user profile" };
	}
}

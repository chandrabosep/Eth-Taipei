"use server";

import { revalidatePath } from "next/cache";
import { generateQuestsForUser } from "./quest";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import prisma from "@/lib/db";

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

		// If user is accepted, generate quests
		if (status === "ACCEPTED") {
			const questResult = await generateQuestsForUser({
				eventUserId: eventUser.id,
				eventId: eventUser.eventId,
				questCount: 3, // Adding the required questCount parameter with a default value of 3
			});

			if (!questResult.success) {
				console.error("Failed to generate quests:", questResult.error);
				// Continue with the flow even if quest generation fails
			}
		}

		revalidatePath(`/events/${eventUser.eventId}`);
		return { success: true, data: eventUser };
	} catch (error) {
		console.error("Failed to update user status:", error);
		return { success: false, error: "Failed to update user status" };
	}
}

const GenerateQuestionsInput = z.object({
	eventUserId: z.string(),
});

export async function generateUserQuestions(
	input: z.infer<typeof GenerateQuestionsInput>
) {
	try {
		const { eventUserId } = GenerateQuestionsInput.parse(input);

		// Get user profile data
		const eventUser = await prisma.eventUser.findUnique({
			where: { id: eventUserId },
			include: {
				user: true,
				event: true,
			},
		});

		if (!eventUser) {
			return { success: false, error: "User not found" };
		}

		// Initialize OpenAI chat model
		const model = new ChatOpenAI({
			modelName: "gpt-4-turbo-preview",
			temperature: 0.7,
		});

		// Create prompt template
		const promptTemplate = PromptTemplate.fromTemplate(`
			Generate 5 personalized networking questions for an event attendee based on their profile:
			
			Event: {eventName}
			User Interests: {interests}
			Meeting Preferences: {meetingPreferences}
			
			Generate questions that:
			1. Help them connect with other attendees
			2. Are relevant to their interests and the event theme
			3. Encourage meaningful discussions
			4. Help them achieve their networking goals
			
			Format each question as a JSON object with:
			- question: The actual question
			- context: Brief explanation of why this question was generated
			- relatedInterests: Array of related interests
			
			Return an array of 5 question objects.
		`);

		// Create chain
		const chain = RunnableSequence.from([promptTemplate, model]);

		// Run chain
		const response = await chain.invoke({
			eventName: eventUser.event.name,
			interests: eventUser.tags.join(", "),
			meetingPreferences: eventUser.meetingPreferences?.join(", ") || "",
		});

		// Parse generated questions - handle AIMessage response
		let questions;
		try {
			// Extract content from AI response
			const content = response.content.toString();
			questions = JSON.parse(content);
		} catch (error) {
			console.error("Error parsing AI response:", error);
			return {
				success: false,
				error: "Failed to parse generated questions",
			};
		}

		// Store questions in database
		const createdQuestions = await Promise.all(
			questions.map((q: any) =>
				prisma.userQuestion.create({
					data: {
						eventUserId,
						question: q.question,
						metadata: {
							context: q.context,
							relatedInterests: q.relatedInterests,
							generatedAt: new Date().toISOString(),
						},
					},
				})
			)
		);

		return {
			success: true,
			data: createdQuestions,
		};
	} catch (error) {
		console.error("Error generating questions:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to generate questions",
		};
	}
}

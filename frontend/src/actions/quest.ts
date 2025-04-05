"use server";

import prisma from "@/lib/db";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

// Enhanced input schema with validation
const QuestInputSchema = z.object({
	eventUserId: z.string().min(1, "Event user ID is required"),
	eventId: z.string().min(1, "Event ID is required"),
	questCount: z.number().optional().default(3),
});

// Quest data validation schema
const QuestDataSchema = z.object({
	question: z.string().min(3, "Question must be at least 3 characters"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters"),
	tags: z.array(z.string()),
});

const questGenerationPrompt = new PromptTemplate({
	template: `You are an AI networking quest generator for a web3 networking event. Generate fun, interactive networking activities based on the following information:

Event Details:
Name: {eventName}
Description: {eventDescription}
Tags: {eventTags}

User Profile:
Interests: {userInterests}
Meeting Preferences: {meetingPreferences}
Location: {userLocation}

Generate {questCount} interactive networking quests that:
1. Encourage meeting specific types of people (e.g., "Meet a developer working on ZK proofs", "Find someone from Asia who's interested in DeFi")
2. Create natural conversation starters based on shared interests
3. Are specific and easy to verify (e.g., "Take a selfie with 3 people from different continents")
4. Focus on web3 and crypto topics when relevant
5. Include both technical and non-technical interactions
6. Can be completed in 5-15 minutes each
7. Consider the user's location and suggest location-based networking opportunities when relevant
8. Tailor quests to the user's specific interests and background

Format each quest as:
Quest: [Brief, actionable networking task]
Description: [Short explanation or conversation starter]
Tags: [Relevant tags from user interests or event tags]

IMPORTANT: The tags for each quest MUST be selected from the user's interests or event tags. Do not create new tags. Use only tags that appear in either the "Interests" or "Tags" sections above.

Example Quests:
Quest: Meet someone from Northern America working on Layer 2 solutions
Description: Find out which L2 project they're working on and what excites them most about scaling solutions
Tags: L2, scaling, networking

Quest: Find three people who have deployed a smart contract in the last month
Description: Compare experiences about different chains and development tools they used
Tags: development, smart contracts, networking

Keep quests focused on creating meaningful connections and knowledge sharing. Mix both specific (e.g., "Meet a ZK researcher") and general (e.g., "Find someone who attended ETH Denver") tasks.`,
	inputVariables: [
		"eventName",
		"eventDescription",
		"eventTags",
		"userInterests",
		"meetingPreferences",
		"userLocation",
		"questCount",
	],
});

export async function generateQuestsForUser(
	input: z.infer<typeof QuestInputSchema>
) {
	try {
		// Validate input
		const validatedInput = QuestInputSchema.parse(input);
		const questCount = validatedInput.questCount || 3;

		// Get event user details with proper error handling
		const eventUser = await prisma.eventUser.findUnique({
			where: { id: validatedInput.eventUserId },
			include: {
				user: true,
				event: true,
			},
		});

		if (!eventUser) {
			return {
				success: false,
				error: "Event user not found",
			};
		}

		// Check if user already has questions for this event
		const existingQuestions = await prisma.userQuestion.count({
			where: {
				eventUserId: validatedInput.eventUserId,
			},
		});

		if (existingQuestions > 0) {
			return {
				success: false,
				error: "User already has questions assigned for this event",
			};
		}

		// Initialize OpenAI chat model
		const model = new ChatOpenAI({
			modelName: "gpt-4-turbo-preview",
			temperature: 0.7,
			openAIApiKey: process.env.OPENAI_API_KEY,
		});

		// Create chain using RunnableSequence with string output parser
		const chain = RunnableSequence.from([
			questGenerationPrompt,
			model,
			new StringOutputParser(),
		]);

		// Run the chain with proper error handling
		let questsText;
		try {
			questsText = await chain.invoke({
				eventName: eventUser.event.name,
				eventDescription: eventUser.event.description || "",
				eventTags: eventUser.event.tags.join(", "),
				userInterests: eventUser.tags.join(", "),
				meetingPreferences: eventUser.meetingPreferences.join(", "),
				userLocation: eventUser.user.country || "Unknown",
				questCount: questCount.toString(),
			});
		} catch (error) {
			console.error(
				"Failed to generate questions with LangChain:",
				error
			);
			return {
				success: false,
				error: "Failed to generate questions with AI",
			};
		}

		console.log("Generated questions text:", questsText);

		// Parse the generated questions
		const questionSections = questsText.split("\n\n").filter(Boolean);
		if (questionSections.length === 0) {
			return {
				success: false,
				error: "No valid questions were generated",
			};
		}

		// Get all valid tags (from user interests and event tags)
		const validTags = new Set([...eventUser.tags, ...eventUser.event.tags]);

		// Process and store each quest
		const quests = [];
		for (const section of questionSections) {
			const questMatch = section.match(/Quest: (.+)/);
			const descriptionMatch = section.match(/Description: (.+)/);
			const tagsMatch = section.match(/Tags: (.+)/);

			if (!questMatch || !descriptionMatch) {
				console.log("Skipping quest due to missing fields:", section);
				continue;
			}

			try {
				// Filter tags to only include those that match user interests or event tags
				const rawTags = tagsMatch
					? tagsMatch[1]
							.split(",")
							.map((tag: string) => tag.trim())
							.filter(Boolean)
					: [];

				const filteredTags = rawTags.filter(
					(tag) =>
						validTags.has(tag) ||
						// Also allow common networking tags
						["networking"].includes(tag.toLowerCase())
				);

				// If no valid tags found, use some from user interests
				const tags =
					filteredTags.length > 0
						? filteredTags
						: eventUser.tags.slice(
								0,
								Math.min(3, eventUser.tags.length)
						  );

				// Validate the quest data
				const questData = QuestDataSchema.parse({
					question: questMatch[1].trim(),
					description: descriptionMatch[1].trim(),
					tags: tags,
				});

				// Create the quest as a question with activity details
				const quest = await prisma.userQuestion.create({
					data: {
						question: questData.question,
						answer: questData.description, // Store the description in the answer field
						status: "PENDING",
						metadata: {
							type: "networking_quest",
							generatedAt: new Date().toISOString(),
							userInterests: eventUser.tags,
							eventTags: eventUser.event.tags,
							userLocation: eventUser.user.country,
							tags: questData.tags,
							eventId: eventUser.eventId,
							userId: eventUser.userId,
						},
						eventUserId: validatedInput.eventUserId,
					},
				});

				console.log("Successfully created quest:", quest.id);
				quests.push(quest);
			} catch (error) {
				console.error("Failed to create quest:", error);
				if (error instanceof z.ZodError) {
					console.error("Validation errors:", error.errors);
				}
				// Continue with other quests even if one fails
			}
		}

		if (quests.length === 0) {
			console.error("No quests were created successfully");
			return {
				success: false,
				error: "Failed to create any quests - all attempts failed",
			};
		}

		console.log(`Successfully created ${quests.length} quests`);
		return {
			success: true,
			data: quests,
		};
	} catch (error) {
		console.error("Failed to generate questions:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to generate questions",
		};
	}
}

// Function to generate questions for all accepted users in an event
export async function generateQuestsForEvent(eventId: string, questCount = 3) {
	try {
		// Get all accepted users for the event who don't have questions yet
		const acceptedUsers = await prisma.eventUser.findMany({
			where: {
				eventId: eventId,
				status: "ACCEPTED",
				userQuestions: {
					none: {},
				},
			},
			include: {
				user: true,
			},
		});

		const results = [];
		for (const user of acceptedUsers) {
			const result = await generateQuestsForUser({
				eventUserId: user.id,
				eventId: eventId,
				questCount: questCount,
			});
			results.push({
				userId: user.userId,
				success: result.success,
				data: result.success ? result.data : null,
				error: !result.success ? result.error : null,
			});
		}

		return {
			success: true,
			data: results,
		};
	} catch (error) {
		console.error("Failed to generate questions for event:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to generate questions for event",
		};
	}
}

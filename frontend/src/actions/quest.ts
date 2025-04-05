"use server";

import prisma from "@/lib/db";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { QuestionStatus } from "@prisma/client";

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

Format each quest EXACTLY as follows (without markdown headers):
Quest: [Brief, actionable networking task]
Description: [Short explanation or conversation starter]
Tags: [Relevant tags from user interests or event tags]

IMPORTANT: 
- Do not use markdown headers or formatting
- Each quest must be separated by a blank line
- The tags for each quest MUST be selected from the user's interests or event tags
- Do not create new tags. Use only tags that appear in either the "Interests" or "Tags" sections above
- Always include the exact labels "Quest:", "Description:", and "Tags:" for each quest

Example output format:
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

		// Get all valid tags
		const validTags = new Set([
			...eventUser.tags,
			...eventUser.event.tags,
			"networking",
		]);

		// Process and store each quest
		const questions = [];
		for (const section of questionSections) {
			try {
				// Extract quest parts using regex with multiline flag
				const questMatch = section.match(/Quest: (.+?)(?=\n|$)/);
				const descriptionMatch = section.match(
					/Description: (.+?)(?=\n|$)/
				);
				const tagsMatch = section.match(/Tags: (.+?)(?=\n|$)/);

				if (!questMatch || !descriptionMatch || !tagsMatch) {
					console.log("Invalid quest format:", section);
					continue;
				}

				// Process tags
				const rawTags = tagsMatch[1]
					.split(",")
					.map((tag) => tag.trim().toLowerCase());
				const filteredTags = rawTags.filter((tag) =>
					validTags.has(tag)
				);

				// Use some valid tags if none match
				const tags =
					filteredTags.length > 0
						? filteredTags
						: eventUser.tags.slice(
								0,
								Math.min(3, eventUser.tags.length)
						  );

				// Store in userQuestions
				const question = await prisma.userQuestion.create({
					data: {
						question: questMatch[1].trim(),
						answer: descriptionMatch[1].trim(),
						status: "PENDING",
						eventUserId: input.eventUserId,
						metadata: {
							type: "networking_quest",
							generatedAt: new Date().toISOString(),
							userInterests: eventUser.tags,
							eventTags: eventUser.event.tags,
							userLocation: eventUser.user.country,
							eventId: eventUser.eventId,
							userId: eventUser.userId,
							tags: tags,
						},
					},
				});

				console.log("Successfully created question:", question.id);
				questions.push(question);
			} catch (error) {
				console.error("Failed to create question:", error);
				continue;
			}
		}

		if (questions.length === 0) {
			console.error("No questions were created successfully");
			return {
				success: false,
				error: "Failed to create any questions - all attempts failed",
			};
		}

		console.log(`Successfully created ${questions.length} questions`);
		return {
			success: true,
			data: questions,
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

interface QuestMetadata {
	type: string;
	generatedAt: string;
	userInterests: string[];
	eventTags: string[];
	userLocation?: string;
	tags: string[];
	eventId: string;
	userId: string;
	originalQuestId?: string;
	originalUserId?: string;
	completedAt?: string;
	completedWithUserId?: string;
	completedWithUserTags?: string[];
}

interface AssignedQuest {
	id: string;
	question: string;
	answer: string | null;
	status: string;
	eventUserId: string;
	metadata: Record<string, any> | null;
}

// Function to randomly assign quests between users in an event
export async function randomlyAssignQuestsToUsers(
	eventId: string,
	questsPerUser = 3
) {
	try {
		// Get all accepted users in the event
		const eventUsers = await prisma.eventUser.findMany({
			where: {
				eventId: eventId,
				status: "ACCEPTED",
			},
			include: {
				user: true,
				userQuestions: true,
			},
		});

		if (eventUsers.length < 2) {
			return {
				success: false,
				error: "Need at least 2 accepted users to assign quests",
			};
		}

		// Collect all questions from users
		const allQuestions = eventUsers.flatMap((user) => user.userQuestions);

		if (allQuestions.length === 0) {
			return {
				success: false,
				error: "No questions found to assign",
			};
		}

		console.log(
			`Found ${allQuestions.length} questions to assign to ${eventUsers.length} users`
		);

		// Create assignments array to track results
		const assignments = [];
		const userQuestAssignments: { userId: string; quests: any[] }[] = [];

		// For each user, assign N random questions
		for (const targetUser of eventUsers) {
			// Get questions not created by this user
			const availableQuestions = allQuestions.filter(
				(q) => q.eventUserId !== targetUser.id
			);

			if (availableQuestions.length === 0) continue;

			// Randomly select N questions
			const selectedQuestions = [];
			const questionsCopy = [...availableQuestions];
			for (
				let i = 0;
				i < questsPerUser && questionsCopy.length > 0;
				i++
			) {
				const randomIndex = Math.floor(
					Math.random() * questionsCopy.length
				);
				selectedQuestions.push(questionsCopy.splice(randomIndex, 1)[0]);
			}

			// Create quests and assignments for selected questions
			for (const question of selectedQuestions) {
				try {
					// Create a Quest from the UserQuestion
					const quest = await prisma.quest.create({
						data: {
							title: question.question,
							description: question.answer || "",
							points: 50, // Default points
							tags: ((question.metadata as any)?.tags ||
								[]) as string[],
							metadata: {
								type: "assigned_networking_quest",
								originalQuestionId: question.id,
								originalUserId: question.eventUserId,
								generatedAt: new Date().toISOString(),
								userInterests:
									(question.metadata as any)?.userInterests ||
									[],
								eventTags:
									(question.metadata as any)?.eventTags || [],
								eventId: eventId,
								creatorId: question.eventUserId,
								userLocation: (question.metadata as any)
									?.userLocation,
							},
						},
					});

					// Create the UserQuest assignment
					const userQuest = await prisma.userQuest.create({
						data: {
							questId: quest.id,
							eventUserId: targetUser.id,
							status: "ASSIGNED",
							assignedAt: new Date(),
						},
						include: {
							quest: true,
							eventUser: {
								include: {
									user: true,
								},
							},
						},
					});

					assignments.push(userQuest);

					// Add to user's quest assignments
					const userAssignment = userQuestAssignments.find(
						(ua) => ua.userId === targetUser.userId
					);
					if (userAssignment) {
						userAssignment.quests.push(userQuest);
					} else {
						userQuestAssignments.push({
							userId: targetUser.userId,
							quests: [userQuest],
						});
					}

					console.log(
						`Created quest from question ${question.id} and assigned to user ${targetUser.userId}`
					);
				} catch (error) {
					console.error(
						`Failed to create and assign quest for question ${question.id}:`,
						error
					);
					continue;
				}
			}
		}

		if (assignments.length === 0) {
			return {
				success: false,
				error: "Failed to create any quest assignments",
			};
		}

		console.log(
			`Successfully created ${assignments.length} quest assignments`
		);
		return {
			success: true,
			data: {
				assignedQuestsCount: assignments.length,
				assignments,
				userQuestAssignments,
			},
		};
	} catch (error) {
		console.error("Error assigning quests:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to assign quests",
		};
	}
}

// Function to verify quest completion based on user tags
export async function verifyQuestCompletion({
	questId,
	completedWithUserId,
}: {
	questId: string;
	completedWithUserId: string;
}) {
	try {
		// Get the quest details with metadata
		const quest = await prisma.userQuestion.findUnique({
			where: { id: questId },
			include: {
				eventUser: {
					include: {
						user: true,
					},
				},
			},
		});

		if (!quest || !quest.metadata) {
			return {
				success: false,
				error: "Quest not found or missing metadata",
			};
		}

		// Type check and cast metadata
		const metadata = quest.metadata as unknown as QuestMetadata;
		if (!metadata.eventId) {
			return {
				success: false,
				error: "Invalid quest metadata",
			};
		}

		// Get the user who completed the quest with
		const completedWithUser = await prisma.eventUser.findFirst({
			where: {
				userId: completedWithUserId,
				eventId: metadata.eventId,
			},
			include: {
				user: true,
			},
		});

		if (!completedWithUser) {
			return {
				success: false,
				error: "User not found",
			};
		}

		const requiredTags = metadata.tags || [];

		// Check if the completed with user has any of the required tags
		const hasMatchingTags = completedWithUser.tags.some((tag) =>
			requiredTags.includes(tag.toLowerCase())
		);

		if (!hasMatchingTags) {
			return {
				success: false,
				error: "User does not match the required criteria for this quest",
			};
		}

		// Update the quest status to answered (since COMPLETED is not available)
		const updatedQuest = await prisma.userQuestion.update({
			where: { id: questId },
			data: {
				status: "ANSWERED",
				answer: JSON.stringify({
					completedWithUserId: completedWithUserId,
					completedWithUserTags: completedWithUser.tags,
					completedAt: new Date().toISOString(),
				}),
				metadata: {
					...metadata,
					completedAt: new Date().toISOString(),
					completedWithUserId: completedWithUserId,
					completedWithUserTags: completedWithUser.tags,
				},
			},
		});

		// Create a UserQuest entry to track completion
		const userQuest = await prisma.userQuest.create({
			data: {
				status: "COMPLETED",
				questId: questId,
				eventUserId: quest.eventUserId,
				completedAt: new Date(),
			},
		});

		return {
			success: true,
			data: {
				quest: updatedQuest,
				userQuest,
			},
		};
	} catch (error) {
		console.error("Error verifying quest completion:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to verify quest completion",
		};
	}
}

export async function getAssignedQuestsForUser(eventUserId: string) {
	try {
		// Get quests assigned to this user through UserQuest
		const userQuests = await prisma.userQuest.findMany({
			where: {
				eventUserId: eventUserId,
			},
			include: {
				quest: true,
				eventUser: {
					include: {
						user: true,
					},
				},
			},
		});

		return {
			success: true,
			data: userQuests.map((userQuest) => ({
				id: userQuest.questId,
				title: userQuest.quest.title,
				description: userQuest.quest.description,
				status: userQuest.status,
				metadata: userQuest.quest.metadata as Record<
					string,
					any
				> | null,
				xpReward: userQuest.quest.points,
				isCompleted:
					userQuest.status === "COMPLETED" ||
					userQuest.status === "VERIFIED",
				assignedAt: userQuest.assignedAt,
				completedAt: userQuest.completedAt,
				tags: userQuest.quest.tags,
			})),
		};
	} catch (error) {
		console.error("Error fetching assigned quests:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to fetch assigned quests",
		};
	}
}

export async function getEventUserIdForUser(userId: string, eventSlug: string) {
	try {
		console.log(
			`Looking up EventUser for userId: ${userId} and eventSlug: ${eventSlug}`
		);

		// First get the event by slug
		const event = await prisma.event.findFirst({
			where: {
				slug: eventSlug,
			},
		});

		if (!event) {
			console.error(`Event not found for slug: ${eventSlug}`);
			return {
				success: false,
				error: `Event "${eventSlug}" not found`,
				data: null,
			};
		}

		console.log(`Found event: ${event.id} (${event.name})`);

		// Try to find the user by either Privy ID or wallet address
		const eventUser = await prisma.eventUser.findFirst({
			where: {
				OR: [
					{ userId: userId },
					{
						userId: {
							in: await prisma.user
								.findMany({
									where: { address: userId },
									select: { id: true },
								})
								.then((users) => users.map((u) => u.id)),
						},
					},
				],
				eventId: event.id,
			},
			include: {
				event: true,
				user: true,
			},
		});

		if (!eventUser) {
			console.error(
				`EventUser not found for userId/address: ${userId} and eventId: ${event.id}`
			);
			return {
				success: false,
				error: "User is not registered for this event",
				data: null,
			};
		}

		console.log(
			`Found EventUser: ${eventUser.id} (User: ${eventUser.user.address})`
		);
		return {
			success: true,
			data: eventUser.id,
			error: null,
		};
	} catch (error) {
		console.error("Error getting eventUserId:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to get event user",
			data: null,
		};
	}
}

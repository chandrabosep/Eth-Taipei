import { NextRequest, NextResponse } from "next/server";
import { generateUserQuestions } from "@/actions/users.action";
import { runInBackground } from "@/lib/background";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { eventUserId } = body;

		if (!eventUserId) {
			return NextResponse.json(
				{ success: false, error: "eventUserId is required" },
				{ status: 400 }
			);
		}

		// Start the generation in the background without waiting for it to complete
		runInBackground(async () => {
			const result = await generateUserQuestions({ eventUserId });
			return {
				success: result.success,
				questionCount: result.data?.length || 0,
			};
		}, `question-generation-for-user-${eventUserId}`);

		// Return immediately to prevent timeout
		return NextResponse.json({
			success: true,
			message: "Question generation started in the background",
			data: { status: "PROCESSING" },
		});
	} catch (error) {
		console.error("Error in questions API route:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to process question generation request",
			},
			{ status: 500 }
		);
	}
}

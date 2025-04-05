import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const eventUserId = searchParams.get("eventUserId");

	if (!eventUserId) {
		return NextResponse.json(
			{
				success: false,
				error: "eventUserId is required",
			},
			{ status: 400 }
		);
	}

	try {
		// Check if user has any questions
		const questionCount = await prisma.userQuestion.count({
			where: {
				eventUserId: eventUserId,
			},
		});

		return NextResponse.json({
			success: true,
			data: {
				isComplete: questionCount > 0,
				questionCount: questionCount,
			},
		});
	} catch (error) {
		console.error("Error checking question status:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to check question generation status",
			},
			{ status: 500 }
		);
	}
}

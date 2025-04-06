import { NextRequest, NextResponse } from "next/server";
import { verifyNfcAddress } from "@/actions/nfc.action";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const nfcAddress = searchParams.get("nfcAddress");
	const eventSlug = searchParams.get("eventSlug");

	console.log("NFC verify API called with:", { nfcAddress, eventSlug });

	if (!nfcAddress || !eventSlug) {
		console.log("Missing parameters:", { nfcAddress, eventSlug });
		return NextResponse.json(
			{ success: false, error: "Missing nfcAddress or eventSlug" },
			{ status: 400 }
		);
	}

	try {
		console.log("Verifying NFC address:", { nfcAddress, eventSlug });
		const result = await verifyNfcAddress({
			nfcAddress,
			eventSlug,
		});

		console.log("NFC verification result:", result);
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error("NFC verification error:", {
			error: errorMessage,
			stack: error instanceof Error ? error.stack : "No stack trace",
		});

		return NextResponse.json(
			{
				success: false,
				error: `Failed to verify NFC address: ${errorMessage}`,
			},
			{ status: 500 }
		);
	}
}

"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Loader2, Loader2Icon, UserPlusIcon, X } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ConnectionCard } from "@/components/common/connectionCard";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { getEventBySlug } from "@/actions/events.action";
import { PrivyLoginButton } from "@/components/common/connectbtn";
import {
	sendConnectionRequest,
	getPendingRequests,
	updateConnectionStatus,
	getRecentConnections,
} from "@/actions/connections.action";
import {
	getEventUserIdForUser,
	getAssignedQuestsForUser,
	verifyQuestCompletion,
} from "@/actions/quest";
import { useToast } from "@/hooks/use-toast";

interface Connection {
	id: string;
	address: string;
	name: string;
	matchedInterests: string[];
	status: "accepted" | "pending" | "rejected";
	timestamp: string;
	xpEarned?: number;
	type?: "sent" | "received";
}

interface ConnectionRequestDialogProps {
	address: {
		address: string;
		primaryTag: string;
		allTags: string[];
	};
	onClose: () => void;
	onConfirm: () => void;
}

interface ScannedData {
	address: string;
	primaryTag: string;
	allTags: string[];
}

interface Quest {
	id: string;
	title: string;
	description: string;
	status: string;
	metadata: Record<string, any> | null;
	xpReward: number;
	isCompleted: boolean;
	assignedAt: Date | string;
	completedAt: Date | string | null;
	tags: string[];
}

const ConnectionRequestDialog = ({
	address,
	onClose,
	onConfirm,
}: ConnectionRequestDialogProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleConfirm = async () => {
		setIsSubmitting(true);
		await onConfirm();
		setIsSubmitting(false);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#f8f5e6] rounded-xl p-6 w-full max-w-md">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-medium text-[#5a3e2b]">
						Send Connection Request
					</h3>
					<button
						onClick={onClose}
						className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
						disabled={isSubmitting}
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<p className="text-[#5a3e2b] mb-6">
					Would you like to send a connection request to:
					<br />
					<span className="font-mono text-sm break-all bg-[#f0e6c0] px-2 py-1 rounded mt-2 block">
						{address.address}
					</span>
					{address.allTags && address.allTags.length > 0 && (
						<span className="text-sm text-[#5a3e2b]/70 mt-2 block">
							All Interests: {address.allTags.join(", ")}
						</span>
					)}
				</p>
				<div className="flex justify-end gap-3">
					<Button
						onClick={onClose}
						variant="outline"
						className="border-[#b89d65] text-[#5a3e2b] hover:bg-[#f0e6c0]"
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						className="bg-[#6b8e50] hover:bg-[#5a7a42] text-white"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending...
							</>
						) : (
							"Send Request"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

// Create an extra check for browser environment
const isBrowser = typeof window !== "undefined";

// Dynamically import the NFC library to avoid server-side rendering issues
const execHaloCmdWeb = isBrowser
	? require("@arx-research/libhalo/api/web").execHaloCmdWeb
	: null;

export default function page() {
	const [scannedData, setScannedData] = useState<ScannedData | null>(null);
	const [showRequestDialog, setShowRequestDialog] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const params = useParams();
	const { user, ready, authenticated, login } = usePrivy();
	const [event, setEvent] = useState<any>(null);
	const [isRegistered, setIsRegistered] = useState(false);
	const [loading, setLoading] = useState(true);
	const eventSlug = params.eventname as string;
	const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
	const [isLoadingRequests, setIsLoadingRequests] = useState(false);
	const [recentConnections, setRecentConnections] = useState<Connection[]>(
		[]
	);
	const [isLoadingRecent, setIsLoadingRecent] = useState(false);
	const { toast } = useToast();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [isNfcScanning, setIsNfcScanning] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	// Check if component is mounted (client-side)
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		const checkRegistration = async () => {
			if (ready) {
				if (!authenticated) {
					setLoading(false);
					return;
				}

				if (user) {
					try {
						const eventData = await getEventBySlug(eventSlug);
						setEvent(eventData);

						if (user?.wallet?.address && eventData?.eventUsers) {
							const userRegistered = eventData.eventUsers.some(
								(eu: any) => eu.userId === user.wallet?.address
							);
							setIsRegistered(userRegistered);
						}
					} catch (error) {
						console.error("Error checking registration:", error);
					} finally {
						setLoading(false);
					}
				}
			}
		};

		checkRegistration();
	}, [ready, user, eventSlug, authenticated]);

	useEffect(() => {
		if (!loading && ready) {
			if (authenticated && !isRegistered) {
				router.push(`/events/${eventSlug}/register`);
			}
		}
	}, [isRegistered, loading, ready, router, eventSlug, authenticated]);

	// Remove the mock data
	const [connections, setConnections] = useState<Connection[]>([]);

	// Add function to fetch pending requests
	const fetchPendingRequests = async () => {
		if (!user?.wallet?.address || !event?.id) return;

		try {
			setIsLoadingRequests(true);
			const result = await getPendingRequests({
				userId: user.wallet.address,
				eventId: event.id,
			});

			if (result.success && result.data) {
				setPendingRequests(result.data as Connection[]);
			} else {
				console.error(
					"Failed to fetch pending requests:",
					result.error
				);
			}
		} catch (error) {
			console.error("Error fetching pending requests:", error);
		} finally {
			setIsLoadingRequests(false);
		}
	};

	// Add function to fetch recent connections
	const fetchRecentConnections = async () => {
		if (!user?.wallet?.address || !event?.id) return;

		try {
			setIsLoadingRecent(true);
			const result = await getRecentConnections({
				userId: user.wallet.address,
				eventId: event.id,
			});

			if (result.success && result.data) {
				setRecentConnections(result.data as Connection[]);
			} else {
				console.error(
					"Failed to fetch recent connections:",
					result.error
				);
			}
		} catch (error) {
			console.error("Error fetching recent connections:", error);
		} finally {
			setIsLoadingRecent(false);
		}
	};

	// Update effect to fetch both pending and recent connections
	useEffect(() => {
		if (event?.id && user?.wallet?.address && isRegistered) {
			fetchPendingRequests();
			fetchRecentConnections();
		}
	}, [event?.id, user?.wallet?.address, isRegistered]);

	// Update the accept/reject handlers
	const handleAcceptRequest = async (id: string) => {
		if (!event?.id || !user?.wallet?.address) return;

		try {
			setIsSubmitting(true);
			setError(null);

			// Get user's active quests
			const eventUserResult = await getEventUserIdForUser(
				user.wallet.address,
				eventSlug
			);
			if (!eventUserResult.success || !eventUserResult.data) {
				throw new Error(
					eventUserResult.error || "Failed to get user data"
				);
			}

			// Get the connection details to get the sender's address
			const connection = pendingRequests.find((req) => req.id === id);
			if (!connection) {
				throw new Error("Connection request not found");
			}

			// Accept the connection request
			const result = await updateConnectionStatus({
				connectionId: id,
				status: "ACCEPTED",
				eventId: event.id,
			});

			if (!result.success) {
				throw new Error(result.error || "Failed to accept request");
			}

			// Get user's quests
			const questsResult = await getAssignedQuestsForUser(
				eventUserResult.data
			);
			if (!questsResult.success || !questsResult.data) {
				throw new Error(
					questsResult.error || "Failed to get user quests"
				);
			}

			console.log("Available quests:", questsResult.data);
			console.log("Connection user tags:", connection.matchedInterests);

			// Match quests based on all tags
			const matchingQuests = questsResult.data.filter((quest) => {
				if (quest.isCompleted) return false;

				const questTagsLower = quest.tags.map((tag) =>
					tag.toLowerCase()
				);
				const userTagsLower = connection.matchedInterests.map((tag) =>
					tag.toLowerCase()
				);

				// Check if any of the quest tags match with any of the user tags
				const matches = questTagsLower.some((questTag) =>
					userTagsLower.includes(questTag)
				);

				console.log(`Quest "${quest.title}" tag matching:`, {
					questTags: questTagsLower,
					userTags: userTagsLower,
					matches,
				});

				return matches;
			});

			console.log("Matching quests:", matchingQuests);

			// If there are matching quests, verify them
			const verificationResults = [];
			for (const quest of matchingQuests) {
				console.log("Verifying quest:", quest);
				const verificationResult = await verifyQuestCompletion({
					questId: quest.id,
					completedWithUserId: connection.address,
				});
				console.log("Verification result:", verificationResult);
				verificationResults.push(verificationResult);
			}

			// Show success message with completed quests
			const successfulVerifications = verificationResults.filter(
				(r) => r.success && r.data?.matchedTags
			);
			let successMessage = "Connection accepted!";
			if (successfulVerifications.length > 0) {
				const questTags = successfulVerifications
					.flatMap((r) => r.data?.matchedTags || [])
					.filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
					.join(", ");
				successMessage += ` Completed ${successfulVerifications.length} quest(s) with tags: ${questTags}`;
			}

			toast({
				title: "Success",
				description: successMessage,
			});

			// Refresh the data
			await Promise.all([
				fetchPendingRequests(),
				fetchRecentConnections(),
				// Update quests list
				getAssignedQuestsForUser(eventUserResult.data).then(
					(updatedQuestsResult) => {
						if (
							updatedQuestsResult.success &&
							updatedQuestsResult.data
						) {
							const formattedQuests =
								updatedQuestsResult.data.map((quest) => ({
									...quest,
									assignedAt: quest.assignedAt.toISOString(),
									completedAt: quest.completedAt
										? quest.completedAt.toISOString()
										: null,
								}));
							setQuests(formattedQuests);
						}
					}
				),
			]);
		} catch (error) {
			console.error("Error accepting request:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to accept request",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRejectRequest = async (id: string) => {
		if (!event?.id) return;

		try {
			const result = await updateConnectionStatus({
				connectionId: id,
				status: "REJECTED",
				eventId: event.id,
			});

			if (result.success) {
				// Refresh the pending requests
				fetchPendingRequests();
			} else {
				setError(result.error || "Failed to reject request");
			}
		} catch (error) {
			console.error("Error rejecting request:", error);
			setError("Failed to reject request");
		}
	};

	const handleScan = (detectedCodes: any) => {
		const rawValue = detectedCodes?.[0]?.rawValue;
		if (!rawValue || typeof rawValue !== "string") {
			return;
		}

		try {
			const scannedData = JSON.parse(rawValue);
			if (scannedData.address === user?.wallet?.address) {
				return;
			}
			setScannedData(scannedData);
			setShowRequestDialog(true);
		} catch (error) {
			console.error("Error parsing QR code data:", error);
			toast({
				title: "Error",
				description: "Invalid QR code format",
				variant: "destructive",
			});
		}
	};

	const handleSendRequest = async () => {
		if (!scannedData || !user?.wallet?.address || !event?.id) return;

		try {
			setIsSubmitting(true);
			setError(null);

			// Send connection request
			const result = await sendConnectionRequest({
				senderId: user.wallet.address,
				receiverAddress: scannedData.address,
				eventId: event.id,
			});

			if (!result.success) {
				toast({
					title: "Error",
					description:
						result.error || "Failed to send connection request",
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Success",
				description: "Connection request sent!",
			});

			// Reset state and refresh data
			setShowRequestDialog(false);
			setScannedData(null);

			// Refresh the pending requests
			await fetchPendingRequests();
		} catch (error) {
			console.error("Error sending request:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to send connection request",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleNFCScan = async () => {
		// Don't proceed if we're not in the browser or the component isn't mounted
		if (!isBrowser || !isMounted || !execHaloCmdWeb) {
			console.error(
				"NFC scanning is only available in browser environments"
			);
			toast({
				title: "Error",
				description: "NFC scanning is not available on this device",
				variant: "destructive",
			});
			return;
		}

		setIsNfcScanning(true);
		console.log("Starting NFC scan...");

		try {
			const command = {
				name: "sign",
				keyNo: 1,
				message: "0123",
			};

			const options = {
				statusCallback: (cause: string) => {
					console.log("NFC Status:", cause);
					switch (cause) {
						case "init":
							toast({
								description:
									"Please tap your NFC tag to the back of your device...",
								duration: 3000,
							});
							break;
						case "retry":
							toast({
								title: "Scan Failed",
								description:
									"Please try tapping your tag again",
								variant: "destructive",
							});
							break;
						case "scanned":
							toast({
								title: "Success!",
								description: "Tag scanned successfully",
								variant: "default",
							});
							break;
						default:
							toast({
								title: "Status",
								description: cause,
								variant: "default",
							});
					}
				},
			};

			console.log("Executing NFC command...");

			const response = await execHaloCmdWeb(command, options);
			console.log("NFC Response:", response);

			if (response.etherAddress) {
				// Verify the NFC address is registered to a user in this event
				const result = await fetch(
					`/api/nfc/verify?nfcAddress=${response.etherAddress}&eventSlug=${eventSlug}`
				).then((res) => res.json());

				if (result.success && result.data) {
					// If successful, set the scanned data in the same format as QR code scans
					setScannedData(result.data);
					setShowRequestDialog(true);
					toast({
						title: "Success",
						description: "NFC user found!",
						variant: "default",
					});
				} else {
					toast({
						title: "Not Found",
						description:
							result.error || "No user found with this NFC tag",
						variant: "destructive",
					});
				}
			}
		} catch (error) {
			console.error("NFC Scan Error:", error);
			toast({
				title: "Scan Failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to scan NFC device",
				variant: "destructive",
			});
		} finally {
			setIsNfcScanning(false);
		}
	};

	const handleRegisterNFC = () => {
		router.push(`/events/${eventSlug}/nfc`);
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 5)}...${address.slice(-5)}`;
	};

	if (loading) {
		return (
			<div className="w-full h-screen flex items-center justify-center">
				<Loader2Icon className="h-8 w-8 animate-spin text-[#5a3e2b]" />
			</div>
		);
	}

	if (!authenticated) {
		return (
			<div className="w-full h-screen flex flex-col items-center justify-center gap-4">
				<h2 className="text-xl font-medium text-[#5a3e2b]">
					Please connect your wallet to continue
				</h2>
				<PrivyLoginButton />
			</div>
		);
	}

	if (!isRegistered) {
		return null; // Will redirect in useEffect
	}

	return (
		<div>
			<div className="w-full h-full flex flex-col items-center pt-16 md:pt-20">
				<Tabs defaultValue="qr" className="mb-8">
					<TabsList className="flex">
						<TabsTrigger
							value="qr"
							className="w-full rounded-md px-4 py-2 flex-1 data-[state=active]:bg-[#5a3e2b]/50 shadow-sm"
						>
							Generate QR
						</TabsTrigger>
						<TabsTrigger
							value="scan"
							className="w-full rounded-md px-4 py-2 flex-1 data-[state=active]:bg-[#5a3e2b]/50 shadow-sm"
						>
							Scan QR
						</TabsTrigger>
						<TabsTrigger
							value="nfc"
							className="w-full rounded-md px-4 py-2 flex-1 data-[state=active]:bg-[#5a3e2b]/50 shadow-sm"
						>
							NFC
						</TabsTrigger>
					</TabsList>
					<TabsContent value="qr" className="mt-4 min-w-64 min-h-64">
						<Card>
							<CardHeader>
								<CardTitle>Your QR Code</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center">
								<QRCodeSVG
									value={JSON.stringify({
										address: user?.wallet?.address,
										primaryTag:
											event?.eventUsers?.find(
												(eu: any) =>
													eu.userId ===
													user?.wallet?.address
											)?.tags?.[0] || "",
										allTags:
											event?.eventUsers?.find(
												(eu: any) =>
													eu.userId ===
													user?.wallet?.address
											)?.tags || [],
									})}
									size={232}
								/>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent
						value="scan"
						className="mt-4 min-w-[17.8rem] min-h-64"
					>
						<Card>
							<CardHeader>
								<CardTitle>Scan QR Code</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center mb-2">
								<div className="size-56">
									<Scanner
										onScan={handleScan}
										onError={(error) => {
											console.error(
												"Scanner error:",
												error
											);
										}}
										constraints={{
											facingMode: "environment",
										}}
										scanDelay={300}
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent
						value="nfc"
						className="mt-4 min-w-[17.8rem] min-h-64"
					>
						<Card>
							<CardHeader>
								<CardTitle>NFC Connection</CardTitle>
								<CardDescription>
									Use NFC tags to connect with other attendees
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center gap-4">
								<div className="w-24 h-24 mb-2">
									<img
										src="https://cdn-icons-png.flaticon.com/512/4305/4305512.png"
										alt="NFC Connection"
										className="w-full h-full object-contain"
									/>
								</div>
								<div className="space-y-4 w-full">
									<Button
										onClick={handleNFCScan}
										disabled={isNfcScanning}
										className={`w-full bg-[#6b8e50] text-white py-4 px-6 rounded-xl 
										flex items-center justify-center gap-3 
										${isNfcScanning ? "opacity-80 cursor-not-allowed" : "hover:bg-[#5a7a42]"} 
										transition-all shadow-md`}
									>
										{isNfcScanning ? (
											<>
												<Loader2 className="h-5 w-5 animate-spin" />
												Scanning...
											</>
										) : (
											"Scan NFC Tag"
										)}
									</Button>

									<Button
										onClick={handleRegisterNFC}
										variant="outline"
										className="w-full border-[#b89d65] text-[#5a3e2b] hover:bg-[#f0e6c0]"
									>
										Register Your NFC Tag
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Connection Request Dialog */}
				{showRequestDialog && scannedData && (
					<ConnectionRequestDialog
						address={scannedData}
						onClose={() => {
							setShowRequestDialog(false);
							setScannedData(null);
							setError(null);
						}}
						onConfirm={handleSendRequest}
					/>
				)}

				{/* Pending Requests Sections */}
				{isLoadingRequests ? (
					<div className="w-full max-w-md flex justify-center py-8">
						<Loader2Icon className="h-8 w-8 animate-spin text-[#5a3e2b]" />
					</div>
				) : (
					<div className="w-11/12 md:w-full max-w-md space-y-8">
						{/* Received Requests */}
						{pendingRequests.filter((r) => r.type === "received")
							.length > 0 && (
							<div className="overflow-hidden mb-8">
								<div className="">
									<div className="flex items-center gap-2 mb-4 sm:mb-6">
										<UserPlusIcon className="w-6 h-6 text-[#6b8e50]" />
										<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
											Incoming Requests (
											{
												pendingRequests.filter(
													(r) => r.type === "received"
												).length
											}
											)
										</h2>
									</div>
									<div className="space-y-4 sm:space-y-6">
										{pendingRequests
											.filter(
												(connection) =>
													connection.type ===
													"received"
											)
											.map((connection) => (
												<ConnectionCard
													key={connection.id}
													connection={connection}
													truncateAddress={
														truncateAddress
													}
													onAccept={() =>
														handleAcceptRequest(
															connection.id
														)
													}
													onReject={() =>
														handleRejectRequest(
															connection.id
														)
													}
												/>
											))}
									</div>
								</div>
							</div>
						)}

						{/* Sent Requests */}
						{pendingRequests.filter((r) => r.type === "sent")
							.length > 0 && (
							<div className="overflow-hidden mb-8">
								<div className="">
									<div className="flex items-center gap-2 mb-4 sm:mb-6">
										<UserPlusIcon className="w-6 h-6 text-[#6b8e50]" />
										<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
											Sent Requests (
											{
												pendingRequests.filter(
													(r) => r.type === "sent"
												).length
											}
											)
										</h2>
									</div>
									<div className="space-y-4 sm:space-y-6">
										{pendingRequests
											.filter(
												(connection) =>
													connection.type === "sent"
											)
											.map((connection) => (
												<ConnectionCard
													key={connection.id}
													connection={connection}
													truncateAddress={
														truncateAddress
													}
													isPending
												/>
											))}
									</div>
								</div>
							</div>
						)}

						{/* Recent Connections Section */}
						{(isLoadingRecent || recentConnections.length > 0) && (
							<div className="overflow-hidden mb-8">
								<div className="">
									<div className="flex items-center gap-2 mb-4 sm:mb-6">
										<UserPlusIcon className="w-6 h-6 text-[#6b8e50]" />
										<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
											Recent Connections
										</h2>
									</div>
									{isLoadingRecent ? (
										<div className="w-full flex justify-center py-8">
											<Loader2Icon className="h-8 w-8 animate-spin text-[#5a3e2b]" />
										</div>
									) : (
										<div className="space-y-4 sm:space-y-6">
											{recentConnections.map(
												(connection) => (
													<ConnectionCard
														key={connection.id}
														connection={connection}
														truncateAddress={
															truncateAddress
														}
													/>
												)
											)}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

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
import { Loader2Icon, UserPlusIcon, X } from "lucide-react";
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
} from "@/actions/connections.action";

interface Connection {
	id: string;
	address: string;
	name: string;
	matchedInterests: string[];
	status: "accepted" | "pending" | "rejected";
	timestamp: string;
	xpEarned?: number;
	type: "sent" | "received";
}

interface ConnectionRequestDialogProps {
	address: string;
	onClose: () => void;
	onConfirm: () => void;
}

const ConnectionRequestDialog = ({
	address,
	onClose,
	onConfirm,
}: ConnectionRequestDialogProps) => {
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
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<p className="text-[#5a3e2b] mb-6">
					Would you like to send a connection request to:
					<br />
					<span className="font-mono text-sm break-all bg-[#f0e6c0] px-2 py-1 rounded mt-2 block">
						{address}
					</span>
				</p>
				<div className="flex justify-end gap-3">
					<Button
						onClick={onClose}
						variant="outline"
						className="border-[#b89d65] text-[#5a3e2b] hover:bg-[#f0e6c0]"
					>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						className="bg-[#6b8e50] hover:bg-[#5a7a42] text-white"
					>
						Send Request
					</Button>
				</div>
			</div>
		</div>
	);
};

export default function page() {
	const [scannedData, setScannedData] = useState<string | null>(null);
	const [showRequestDialog, setShowRequestDialog] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const address = "0x1234567890123456789012345678901234567890";
	const router = useRouter();
	const params = useParams();
	const { user, ready, authenticated, login } = usePrivy();
	const [event, setEvent] = useState<any>(null);
	const [isRegistered, setIsRegistered] = useState(false);
	const [loading, setLoading] = useState(true);
	const eventSlug = params.eventname as string;
	const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
	const [isLoadingRequests, setIsLoadingRequests] = useState(false);

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
		if (!loading && authenticated && !isRegistered && ready) {
			router.push(`/events/${eventSlug}/register`);
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

	// Add effect to fetch pending requests when event or user changes
	useEffect(() => {
		if (event?.id && user?.wallet?.address && isRegistered) {
			fetchPendingRequests();
		}
	}, [event?.id, user?.wallet?.address, isRegistered]);

	// Update the accept/reject handlers
	const handleAcceptRequest = async (id: string) => {
		if (!event?.id) return;

		try {
			const result = await updateConnectionStatus({
				connectionId: id,
				status: "ACCEPTED",
				eventId: event.id,
			});

			if (result.success) {
				// Refresh the pending requests
				fetchPendingRequests();
			} else {
				setError(result.error || "Failed to accept request");
			}
		} catch (error) {
			console.error("Error accepting request:", error);
			setError("Failed to accept request");
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
		if (
			!rawValue ||
			typeof rawValue !== "string" ||
			rawValue === user?.wallet?.address
		) {
			return;
		}
		setScannedData(rawValue);
		setShowRequestDialog(true);
	};

	const handleSendRequest = async () => {
		if (!scannedData || !user?.wallet?.address || !event?.id) return;

		try {
			setIsSubmitting(true);
			setError(null);

			const result = await sendConnectionRequest({
				senderId: user.wallet.address,
				receiverAddress: scannedData,
				eventId: event.id,
			});

			if (!result.success) {
				setError(result.error || "Failed to send connection request");
				return;
			}

			setShowRequestDialog(false);
			setScannedData(null);
		} catch (error) {
			console.error("Error sending connection request:", error);
			setError("Failed to send connection request");
		} finally {
			setIsSubmitting(false);
		}
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
			<div className="w-full h-full flex flex-col items-center pt-20">
				{error && (
					<div className="mb-4 p-4 bg-red-100 text-red-600 rounded-lg">
						{error}
					</div>
				)}
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
					</TabsList>
					<TabsContent value="qr" className="mt-4 min-w-64 min-h-64">
						<Card>
							<CardHeader>
								<CardTitle>Your QR Code</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center">
								<QRCodeSVG
									value={user?.wallet?.address || ""}
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
					<div className="w-full max-w-md space-y-8">
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
					</div>
				)}
			</div>
		</div>
	);
}

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
import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ConnectionCard } from "@/components/common/connectionCard";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { getEventBySlug } from "@/actions/events.action";
import { PrivyLoginButton } from "@/components/common/connectbtn";

interface Connection {
	id: number;
	address: string;
	name: string;
	matchedInterests: string[];
	status: "accepted" | "pending" | "rejected";
	timestamp: string;
	xpEarned?: number;
}

export default function page() {
	const [scannedData, setScannedData] = useState<string | null>(null);
	const address = "0x1234567890123456789012345678901234567890";
	const router = useRouter();
	const params = useParams();
	const { user, ready, authenticated, login } = usePrivy();
	const [event, setEvent] = useState<any>(null);
	const [isRegistered, setIsRegistered] = useState(false);
	const [loading, setLoading] = useState(true);
	const eventSlug = params.eventname as string;

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

	// Mock data for demonstration
	const [connections, setConnections] = useState<Connection[]>([
		{
			id: 1,
			address: "0x1234567890abcdef1234567890abcdef12345678",
			name: "Alice",
			matchedInterests: ["DeFi", "NFTs", "Gaming"],
			status: "pending",
			timestamp: new Date().toISOString(),
		},
		{
			id: 2,
			address: "0xabcdef1234567890abcdef1234567890abcdef12",
			name: "Bob",
			matchedInterests: ["DAOs", "DeFi"],
			status: "pending",
			timestamp: new Date().toISOString(),
		},
	]);

	const pendingRequests = connections.filter(
		(conn) => conn.status === "pending"
	);

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 5)}...${address.slice(-5)}`;
	};

	const handleAcceptRequest = (id: number) => {
		console.log("Accepting request:", id);
		setConnections(
			connections.map((conn) =>
				conn.id === id
					? { ...conn, status: "accepted", xpEarned: 50 }
					: conn
			)
		);
	};

	const handleRejectRequest = (id: number) => {
		console.log("Rejecting request:", id);
		setConnections(
			connections.map((conn) =>
				conn.id === id ? { ...conn, status: "rejected" } : conn
			)
		);
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
				<h2 className="text-xl font-medium text-[#5a3e2b]">Please connect your wallet to continue</h2>
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
								<QRCodeSVG value={address || ""} size={232} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent
						value="scan"
						className="mt-4 min-w-[17.8rem] min-h-64"
					>
						<Card>
							<CardHeader>
								<CardTitle>
									{scannedData && scannedData !== address
										? "Scanned Address"
										: "Scan QR Code"}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center mb-2">
								{scannedData && scannedData !== address ? (
									<div className="text-center">
										<p className="mb-4 break-all bg-muted p-2 rounded">
											{scannedData}
										</p>
										<Button
											// onClick={() =>
											// 	sendRequestMutation.mutate(
											// 		scannedData
											// 	)
											// }
											className="w-full"
										>
											{
												// @ts-ignore
												!sendRequestMutation?.isLoading ? (
													"Send Request"
												) : (
													<Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
												)
											}
										</Button>
									</div>
								) : (
									<div className="size-56">
										<Scanner
											onScan={(data) => {
												console.log(data);
											}}
											onError={() => {
												console.log("error");
											}}
											constraints={{
												facingMode: "environment",
											}}
											scanDelay={300}
										/>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Incoming Requests Section */}
				{pendingRequests.length > 0 && (
					<div className="overflow-hidden mb-8 w-full max-w-md">
						<div className="">
							<div className="flex items-center gap-2 mb-4 sm:mb-6">
								<UserPlusIcon className="w-6 h-6 text-[#6b8e50]" />
								<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
									Incoming Requests
								</h2>
							</div>
							<div className="space-y-4 sm:space-y-6">
								{pendingRequests.map((connection) => (
									<ConnectionCard
										key={connection.id}
										connection={connection}
										truncateAddress={truncateAddress}
										onAccept={() =>
											handleAcceptRequest(connection.id)
										}
										onReject={() =>
											handleRejectRequest(connection.id)
										}
									/>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

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

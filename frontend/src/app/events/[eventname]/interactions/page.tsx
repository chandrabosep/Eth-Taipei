"use client";

import React, { useState, useEffect } from "react";
import {
	UserCircleIcon,
	ClockIcon,
	CheckCircleIcon,
	XMarkIcon,
	UserPlusIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionCard } from "@/components/common/connectionCard";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { getEventBySlug } from "@/actions/events.action";
import { PrivyLoginButton } from "@/components/common/connectbtn";
import {
	getPendingRequests,
	updateConnectionStatus,
	getRecentConnections,
} from "@/actions/connections.action";
import { useToast } from "@/hooks/use-toast";

import {wagmiAbi} from '@/app/create-event/abi'
import {publicClient, getWalletClient, chainConfig  ,walletClient} from '@/app/create-event/config'
import { createWalletClient, custom, parseGwei } from 'viem'
import { createPublicClient , http } from 'viem'
import { celo } from "viem/chains";





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

const truncateAddress = (address: string) => {
	return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export default function InteractionsPage() {
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


	const [data, setData] = useState<any[]>([]);

	useEffect(() => {
	  const getData = async() => {
		try {
		  // Check if user wallet is connected
		  if (!user?.wallet?.address) {
			console.log("No wallet connected");
			return;
		  }
		  
		  // Use the connected wallet address
		  const contractData = await publicClient.readContract({
			address: "0x723733980ce3881d2c9421E3A76bB61636E47c1e", 
			abi: wagmiAbi, 
			functionName: "connectWithUser", 
			args: [user.wallet.address as `0x${string}`]
		  });
		  
		  console.log("XP for user address:", contractData);
		  
		  // Update the data with the fetched XP
		  // You'll need to define updatedLeaderboard based on your needs
		  const updatedLeaderboard = [
			{ 
			  id: 1, 
			  address: user.wallet.address, 
			  connectionsMade: 15, 
			  xp: Number(contractData) || 0 
			}
		  ];
		  
		  setData(updatedLeaderboard);
		} catch (error) {
		  console.error("Error fetching XP data:", error);
		}
	  };
	  
	  // Only run when user changes
	  if (user?.wallet?.address) {
		getData();
	  }
	}, [user?.wallet?.address]);
  

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
				toast({
					title: "Error",
					description:
						result.error || "Failed to fetch pending requests",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error fetching pending requests:", error);
		} finally {
			setIsLoadingRequests(false);
		}
	};

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

	useEffect(() => {
		if (event?.id && user?.wallet?.address && isRegistered) {
			fetchPendingRequests();
			fetchRecentConnections();
		}
	}, [event?.id, user?.wallet?.address, isRegistered]);

	const handleAcceptRequest = async (id: string, otherUserAddress: string) => {
		if (!event?.id) return;

		try {
			// First update the connection status in your database
			const result = await updateConnectionStatus({
				connectionId: id,
				status: "ACCEPTED",
				eventId: event.id,
			});

			if (result.success) {
				// Now call the smart contract to record the connection on-chain
				try {
					// Check if user wallet is connected
					if (!user?.wallet?.address) {
						console.log("No wallet connected");
						toast({
							title: "Error",
							description: "Wallet not connected",
							variant: "destructive",
						});
						return;
					}

					// Create a wallet client for the transaction
					const chain = celo; // Using Celo instead of Base Sepolia
					const walletClient = createWalletClient({
						chain,
						transport: custom(window.ethereum)
					});

					// Prepare the transaction
					const { request } = await publicClient.simulateContract({
						address: "0x723733980ce3881d2c9421E3A76bB61636E47c1e",
						abi: wagmiAbi,
						functionName: "connectWithUser",
						args: [otherUserAddress as `0x${string}`],
						account: user.wallet.address as `0x${string}`
					});

					// Execute the transaction
					const hash = await walletClient.writeContract(request);
					
					// Wait for transaction confirmation
					const receipt = await publicClient.waitForTransactionReceipt({hash});
					
					console.log("Connection recorded on-chain:", receipt);
					
					toast({
						title: "Success",
						description: "Connection request accepted and recorded on-chain!",
						variant: "default",
					});
				} catch (error) {
					console.error("Error recording connection on-chain:", error);
					toast({
						title: "Warning",
						description: "Connection accepted but failed to record on-chain. Try again later.",
						variant: "destructive",
					});
				}
				
				// Refresh the UI
				fetchPendingRequests();
				fetchRecentConnections();
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to accept request",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error accepting request:", error);
			toast({
				title: "Error",
				description: "Failed to accept request",
				variant: "destructive",
			});
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
				toast({
					title: "Success",
					description: "Connection request rejected",
					variant: "default",
				});
				fetchPendingRequests();
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to reject request",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error rejecting request:", error);
			toast({
				title: "Error",
				description: "Failed to reject request",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[#5a3e2b]" />
			</div>
		);
	}

	if (!authenticated) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8 flex flex-col items-center justify-center gap-4">
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

	const acceptedConnections = recentConnections.filter(
		(conn) => conn.status === "accepted"
	);

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl sm:text-4xl font-serif text-[#5a3e2b] mb-6 sm:mb-8">
					Your <span className="text-[#6b8e50]">Interactions</span>
				</h1>

				{/* Stats Overview */}
				<div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8 sm:mb-12">
					{[
						{
							label: "Total Connections",
							value: acceptedConnections.length.toString(),
						},
						{
							label: "Pending Requests",
							value: pendingRequests.length.toString(),
						},
						{
							label: "XP from Connections",
							value: acceptedConnections
								.reduce(
									(sum, conn) => sum + (conn.xpEarned || 0),
									0
								)
								.toString(),
						},
					].map((stat, index) => (
						<div
							key={index}
							className="bg-[#f0e6c0] rounded-xl p-3 sm:p-6 border-2 border-[#b89d65] text-center"
						>
							<p className="text-lg sm:text-3xl font-bold text-[#5a3e2b] mb-1 sm:mb-2">
								{stat.value}
							</p>
							<p className="text-[10px] leading-tight sm:text-base text-[#5a3e2b]/60">
								{stat.label}
							</p>
						</div>
					))}
				</div>

				{isLoadingRequests ? (
					<div className="w-full flex justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-[#5a3e2b]" />
					</div>
				) : (
					<div className="space-y-8">
						{/* Received Requests Section */}
						{pendingRequests.filter((r) => r.type === "received")
							.length > 0 && (
							<div className="bg-[#f0e6c0] rounded-xl border-2 border-[#b89d65] overflow-hidden mb-8">
								<div className="p-4 sm:p-6">
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
													onAccept={(otherUserAddress) =>
														handleAcceptRequest(
															connection.id,
															otherUserAddress
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

						{/* Sent Requests Section */}
						{pendingRequests.filter((r) => r.type === "sent")
							.length > 0 && (
							<div className="bg-[#f0e6c0] rounded-xl border-2 border-[#b89d65] overflow-hidden mb-8">
								<div className="p-4 sm:p-6">
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
							<div className="bg-[#f0e6c0] rounded-xl border-2 border-[#b89d65] overflow-hidden">
								<div className="p-4 sm:p-6">
									<div className="flex items-center gap-2 mb-4 sm:mb-6">
										<CheckCircleIcon className="w-6 h-6 text-[#6b8e50]" />
										<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
											Recent Connections
										</h2>
									</div>
									{isLoadingRecent ? (
										<div className="w-full flex justify-center py-8">
											<Loader2 className="h-8 w-8 animate-spin text-[#5a3e2b]" />
										</div>
									) : (
										<div className="space-y-8">
											{/* Received Connections */}
											{recentConnections.filter(
												(c) => c.type === "received"
											).length > 0 && (
												<div>
													<h3 className="text-lg font-medium text-[#5a3e2b] mb-4">
														Received Connections
													</h3>
													<div className="space-y-4">
														{recentConnections
															.filter(
																(connection) =>
																	connection.type ===
																	"received"
															)
															.map(
																(
																	connection
																) => (
																	<ConnectionCard
																		key={
																			connection.id
																		}
																		connection={
																			connection
																		}
																		truncateAddress={
																			truncateAddress
																		}
																	/>
																)
															)}
													</div>
												</div>
											)}

											{/* Sent Connections */}
											{recentConnections.filter(
												(c) => c.type === "sent"
											).length > 0 && (
												<div>
													<h3 className="text-lg font-medium text-[#5a3e2b] mb-4">
														Sent Connections
													</h3>
													<div className="space-y-4">
														{recentConnections
															.filter(
																(connection) =>
																	connection.type ===
																	"sent"
															)
															.map(
																(
																	connection
																) => (
																	<ConnectionCard
																		key={
																			connection.id
																		}
																		connection={
																			connection
																		}
																		truncateAddress={
																			truncateAddress
																		}
																	/>
																)
															)}
													</div>
												</div>
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

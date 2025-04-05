"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { getEventBySlug } from "@/actions/events.action";
import { registerNfcAddress } from "@/actions/nfc.action";
import { PrivyLoginButton } from "@/components/common/connectbtn";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HaloCommand {
	name: "sign";
	keyNo: number;
	message: string;
	legacySignCommand?: boolean;
}

interface HaloOptions {
	statusCallback: (cause: string) => void;
}

interface HaloResponse {
	etherAddress: string;
	publicKey: string;
	signature: string;
}

export default function NFCRegistrationPage() {
	const router = useRouter();
	const params = useParams();
	const { toast } = useToast();
	const { user, ready, authenticated, login } = usePrivy();
	const [isScanning, setIsScanning] = useState(false);
	const [isRegistering, setIsRegistering] = useState(false);
	const [nfcAddress, setNfcAddress] = useState<string | null>(null);
	const [event, setEvent] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [isRegistered, setIsRegistered] = useState(false);
	const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

							// Check if user already has an NFC tag registered
							const currentUser = eventData.eventUsers.find(
								(eu: any) => eu.userId === user.wallet?.address
							);
							if (currentUser && currentUser.nfcAddress) {
								setNfcAddress(currentUser.nfcAddress);
								setRegistrationSuccess(true);
							}
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

	const handleNFCScan = async () => {
		setIsScanning(true);
		console.log("Starting NFC scan...");

		try {
			const command: HaloCommand = {
				name: "sign",
				keyNo: 1,
				message: "0123",
			};

			const options: HaloOptions = {
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

			const response = (await execHaloCmdWeb(
				command,
				options
			)) as HaloResponse;
			console.log("NFC Response:", response);

			if (response.etherAddress) {
				setNfcAddress(response.etherAddress);
				toast({
					title: "Success",
					description: "NFC device scanned successfully!",
					variant: "default",
				});
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
			setIsScanning(false);
		}
	};

	const handleRegisterNFC = async () => {
		if (!nfcAddress || !user?.wallet?.address) return;

		setIsRegistering(true);

		try {
			// Log registration attempt for debugging
			console.log("Attempting to register NFC address:", {
				userId: user.wallet.address,
				eventSlug,
				nfcAddress,
			});

			const result = await registerNfcAddress({
				userId: user.wallet.address,
				eventSlug,
				nfcAddress: nfcAddress,
			});

			console.log("NFC registration result:", result);

			if (result.success) {
				setRegistrationSuccess(true);
				toast({
					title: "Success",
					description: "NFC tag registered successfully!",
					variant: "default",
				});
			} else {
				console.error("NFC registration failed:", result.error);
				toast({
					title: "Registration Failed",
					description:
						result.error ||
						"Failed to register NFC tag. Please try again.",
					variant: "destructive",
					duration: 5000,
				});
			}
		} catch (error) {
			console.error("NFC Registration Error:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			toast({
				title: "Registration Failed",
				description: `Failed to register NFC tag: ${errorMessage}`,
				variant: "destructive",
				duration: 5000,
			});
		} finally {
			setIsRegistering(false);
		}
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const handleReturnToEvent = () => {
		router.push(`/events/${eventSlug}`);
	};

	if (loading) {
		return (
			<div className="w-full h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[#5a3e2b]" />
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
		<div className="min-h-screen bg-[#f8f5e6] flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-md text-center space-y-8">
				<div className="w-48 h-48 mx-auto mb-8 relative">
					<img
						src="https://cdn-icons-png.flaticon.com/512/4305/4305512.png"
						alt="NFC Registration"
						className="w-full h-full object-contain"
					/>
				</div>

				<Card className="border-2 border-[#b89d65]">
					<CardHeader>
						<CardTitle className="text-2xl font-serif text-[#5a3e2b]">
							{registrationSuccess
								? "NFC Tag Registered"
								: "Register NFC Tag"}
						</CardTitle>
						<CardDescription>
							{registrationSuccess
								? "Your NFC tag has been successfully registered to your profile"
								: "Tap your NFC tag to register it to your event profile"}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						{nfcAddress && (
							<div className="bg-[#f0e6c0] rounded-xl p-4 border-2 border-[#b89d65]">
								<p className="text-sm text-[#5a3e2b]/70 mb-1">
									NFC Tag Address:
								</p>
								<p className="text-lg font-medium text-[#5a3e2b] break-all">
									{truncateAddress(nfcAddress)}
								</p>
								<button
									onClick={() =>
										navigator.clipboard.writeText(
											nfcAddress
										)
									}
									className="mt-2 text-sm text-[#6b8e50] hover:text-[#5a7a42]"
								>
									Copy Address
								</button>
							</div>
						)}

						{registrationSuccess ? (
							<p className="text-[#5a3e2b]/70">
								This NFC tag is now linked to your profile. You
								can use it for connections at the event.
							</p>
						) : (
							<p className="text-[#5a3e2b]/70">
								After scanning your NFC tag, you'll need to
								register it to your profile before using it at
								the event.
							</p>
						)}
					</CardContent>

					<CardFooter className="flex flex-col gap-3">
						{registrationSuccess ? (
							<Button
								onClick={handleReturnToEvent}
								className="w-full bg-[#6b8e50] text-white py-4 px-6 rounded-xl 
                hover:bg-[#5a7a42] transition-all transform hover:scale-[1.02] active:scale-[0.98]
                shadow-lg border-2 border-[#5a7a42]"
							>
								Return to Event
							</Button>
						) : (
							<>
								{!nfcAddress ? (
									<Button
										onClick={handleNFCScan}
										disabled={isScanning}
										className={`w-full bg-[#6b8e50] text-white py-4 px-6 rounded-xl 
                    flex items-center justify-center gap-3 
                    ${
						isScanning
							? "opacity-80 cursor-not-allowed"
							: "hover:bg-[#5a7a42]"
					} 
                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    shadow-lg border-2 border-[#5a7a42]`}
									>
										{isScanning ? (
											<>
												<Loader2 className="h-5 w-5 animate-spin" />
												Scanning...
											</>
										) : (
											"Scan NFC Tag"
										)}
									</Button>
								) : (
									<Button
										onClick={handleRegisterNFC}
										disabled={isRegistering}
										className={`w-full bg-[#6b8e50] text-white py-4 px-6 rounded-xl 
                    flex items-center justify-center gap-3 
                    ${
						isRegistering
							? "opacity-80 cursor-not-allowed"
							: "hover:bg-[#5a7a42]"
					} 
                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    shadow-lg border-2 border-[#5a7a42]`}
									>
										{isRegistering ? (
											<>
												<Loader2 className="h-5 w-5 animate-spin" />
												Registering...
											</>
										) : (
											"Register NFC Tag"
										)}
									</Button>
								)}
								<Button
									onClick={handleReturnToEvent}
									variant="outline"
									className="w-full border-[#b89d65] text-[#5a3e2b] hover:bg-[#f0e6c0]"
								>
									Cancel
								</Button>
							</>
						)}
					</CardFooter>
				</Card>

				<p className="text-sm text-[#5a3e2b]/60 mt-6">
					Make sure NFC is enabled on your device and your tag is
					ready to scan
				</p>
			</div>
		</div>
	);
}

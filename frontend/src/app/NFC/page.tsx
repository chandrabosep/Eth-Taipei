"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Dynamic import for the NFC library to avoid server-side rendering issues
import dynamic from "next/dynamic";

// Define interfaces for the NFC functionality
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

// Dynamically import the execHaloCmdWeb function with no SSR
const NfcHandler = dynamic(
	() => import("./NfcHandler").then((mod) => mod.NfcHandler),
	{ ssr: false }
);

export default function NFCPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [isScanning, setIsScanning] = useState(false);
	const [connectedAddress, setConnectedAddress] = useState<string | null>(
		null
	);
	const [isBrowser, setIsBrowser] = useState(false);

	// Check if we're in the browser
	useEffect(() => {
		setIsBrowser(true);
	}, []);

	const handleNFCConnect = async () => {
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

			// We'll delegate the actual NFC handling to the dynamically imported component
			// This is managed by the NfcHandler component
		} catch (error) {
			console.error("NFC Connection Error:", error);
			toast({
				title: "Connection Failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to connect NFC device",
				variant: "destructive",
			});
		} finally {
			setIsScanning(false);
		}
	};

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	// If we're not in the browser, return a loading state or placeholder
	if (!isBrowser) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex flex-col items-center justify-center p-6">
				<div className="w-full max-w-md text-center space-y-8">
					<p>Loading NFC functionality...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#f8f5e6] flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-md text-center space-y-8">
				<div className="w-48 h-48 mx-auto mb-8 relative">
					<img
						src="https://cdn-icons-png.flaticon.com/512/4305/4305512.png"
						alt="NFC Connection"
						className="w-full h-full object-contain"
					/>
				</div>

				<div className="space-y-4 mb-12">
					<h1 className="text-3xl font-serif text-[#5a3e2b]">
						Connect with NFC
					</h1>
					<p className="text-[#5a3e2b]/70">
						Tap your NFC tag to the back of your device to connect
					</p>
				</div>

				{connectedAddress && (
					<div className="bg-[#f0e6c0] rounded-xl p-4 border-2 border-[#b89d65] mb-6">
						<p className="text-sm text-[#5a3e2b]/70 mb-1">
							Connected Address:
						</p>
						<p className="text-lg font-medium text-[#5a3e2b] break-all">
							{truncateAddress(connectedAddress)}
						</p>
						<button
							onClick={() =>
								navigator.clipboard.writeText(connectedAddress)
							}
							className="mt-2 text-sm text-[#6b8e50] hover:text-[#5a7a42]"
						>
							Copy Address
						</button>
					</div>
				)}

				{isBrowser && (
					<NfcHandler
						isScanning={isScanning}
						setIsScanning={setIsScanning}
						setConnectedAddress={setConnectedAddress}
					/>
				)}

				<p className="text-sm text-[#5a3e2b]/60 mt-6">
					Make sure NFC is enabled on your device and your tag is
					ready to scan
				</p>
			</div>
		</div>
	);
}

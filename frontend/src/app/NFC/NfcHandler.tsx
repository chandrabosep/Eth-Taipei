"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import { useToast } from "@/hooks/use-toast";

interface NfcHandlerProps {
	isScanning: boolean;
	setIsScanning: React.Dispatch<React.SetStateAction<boolean>>;
	setConnectedAddress: React.Dispatch<React.SetStateAction<string | null>>;
}

export function NfcHandler({
	isScanning,
	setIsScanning,
	setConnectedAddress,
}: NfcHandlerProps) {
	const { toast } = useToast();

	const handleNfcScan = async () => {
		setIsScanning(true);
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
				setConnectedAddress(response.etherAddress);
				toast({
					title: "Success",
					description: "NFC device connected successfully!",
					variant: "default",
				});
			}
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

	return (
		<Button
			onClick={handleNfcScan}
			disabled={isScanning}
			className={`w-full bg-[#6b8e50] text-white py-4 px-6 rounded-xl 
      flex items-center justify-center gap-3 
      ${isScanning ? "opacity-80 cursor-not-allowed" : "hover:bg-[#5a7a42]"} 
      transition-all transform hover:scale-[1.02] active:scale-[0.98]
      shadow-lg border-2 border-[#5a7a42]`}
		>
			{isScanning ? (
				<>
					<Loader2 className="h-5 w-5 animate-spin" />
					Scanning...
				</>
			) : (
				"Connect NFC Device"
			)}
		</Button>
	);
}

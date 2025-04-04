"use client";
import React, { useState } from "react";
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
import { Loader2Icon } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function page() {
	const [scannedData, setScannedData] = useState<string | null>(null);
	const address = "0x1234567890123456789012345678901234567890";
	return (
		<div>
			<div className="w-full h-full flex flex-col items-center pt-20">
				<Tabs defaultValue="qr" className="mb-8">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="qr">Generate QR</TabsTrigger>
						<TabsTrigger value="scan">Scan QR</TabsTrigger>
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
			</div>
		</div>
	);
}

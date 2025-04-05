"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

export default function NFCPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

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
                                description: "Please tap your NFC tag to the back of your device...",
                                duration: 3000,
                            });
                            break;
                        case "retry":
                            toast({
                                title: "Scan Failed",
                                description: "Please try tapping your tag again",
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
                }
            };

            console.log("Executing NFC command...");
            
            const response = await execHaloCmdWeb(command, options) as HaloResponse;
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
            console.error('NFC Connection Error:', error);
            toast({
                title: "Connection Failed",
                description: error instanceof Error ? error.message : "Failed to connect NFC device",
                variant: "destructive",
            });
        } finally {
            setIsScanning(false);
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

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
                        <p className="text-sm text-[#5a3e2b]/70 mb-1">Connected Address:</p>
                        <p className="text-lg font-medium text-[#5a3e2b] break-all">
                            {truncateAddress(connectedAddress)}
                        </p>
                        <button 
                            onClick={() => navigator.clipboard.writeText(connectedAddress)}
                            className="mt-2 text-sm text-[#6b8e50] hover:text-[#5a7a42]"
                        >
                            Copy Address
                        </button>
                    </div>
                )}

                <button
                    onClick={handleNFCConnect}
                    disabled={isScanning}
                    className={`w-full bg-[#6b8e50] text-white py-4 px-6 rounded-xl 
                    flex items-center justify-center gap-3 
                    ${isScanning ? 'opacity-80 cursor-not-allowed' : 'hover:bg-[#5a7a42]'} 
                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                    shadow-lg border-2 border-[#5a7a42]`}
                >
                    {isScanning ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Scanning...
                        </>
                    ) : (
                        connectedAddress ? 'Scan Again' : 'Connect NFC Device'
                    )}
                </button>

                <p className="text-sm text-[#5a3e2b]/60 mt-6">
                    Make sure NFC is enabled on your device and your tag is ready to scan
                </p>
            </div>
        </div>
    );
}
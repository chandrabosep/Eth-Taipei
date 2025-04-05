"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";
import { http, createConfig } from "@wagmi/core";
import { baseSepolia, mainnet, base } from "@wagmi/core/chains";
import Nav from "../common/nav";
import BottomNav from "../common/bottomNav";
import { usePathname } from "next/navigation";
import { Toaster } from "../ui/toaster";

export const wagmiConfig = createConfig({
	chains: [baseSepolia, mainnet, base],
	transports: {
		[baseSepolia.id]: http(),
		[mainnet.id]: http(),
		[base.id]: http(),
	},
});

export default function Wrapper({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isEventRoute = pathname.startsWith("/events/");
	const eventName = isEventRoute ? pathname.split("/")[2] : null;

	return (
		<>
			<PrivyProvider
				appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
				config={{
					loginMethods: [
						"email",
						"wallet",
						"twitter",
						"google",
						"discord",
						"apple",
						"farcaster",
						"passkey",
					],
					appearance: {
						theme: "light",
						accentColor: "#676FFF",
					},
					embeddedWallets: {
						createOnLogin: "users-without-wallets",
					},
					defaultChain: baseSepolia,
					supportedChains: [baseSepolia],
				}}
			>
				<div className="flex flex-col min-h-screen">
					<Nav />
					<main className="flex-1 overflow-y-auto pb-16 md:pb-0">
						{children}
						<Toaster />
					</main>
					{isEventRoute && eventName && (
						<BottomNav eventName={eventName} />
					)}
				</div>
			</PrivyProvider>
		</>
	);
}

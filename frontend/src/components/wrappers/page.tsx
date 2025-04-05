"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";
import { http, createConfig } from "@wagmi/core";
import { baseSepolia, mainnet, base } from "@wagmi/core/chains";
import Nav from "../common/nav";
import BottomNav from "../common/bottomNav";

export const wagmiConfig = createConfig({
	chains: [baseSepolia, mainnet, base],
	transports: {
		[baseSepolia.id]: http(),
		[mainnet.id]: http(),
		[base.id]: http(),
	},
});

export default function Wrapper({ children }: { children: React.ReactNode }) {
	return (
		<>
			<PrivyProvider
				appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
				config={{
					appearance: {
						theme: "light",
						accentColor: "#676FFF",
						logo: "https://your-logo-url",
					},
					embeddedWallets: {
						createOnLogin: "users-without-wallets",
					},
				}}
			>
				<div className="flex flex-col min-h-screen">
					<Nav />
					<main className="flex-1 overflow-y-auto pb-16 md:pb-0">
						{children}
					</main>
					<BottomNav />
				</div>
			</PrivyProvider>
		</>
	);
}

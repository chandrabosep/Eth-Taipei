"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";
import { http, createConfig } from "@wagmi/core";
import { baseSepolia, mainnet, base } from "@wagmi/core/chains";

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
				{children}
			</PrivyProvider>
		</>
	);
}

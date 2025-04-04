import React from "react";
import { PrivyLoginButton, PrivyLogoutButton } from "./connectbtn";
import { usePrivy } from "@privy-io/react-auth";

export default function Nav() {
	const { user, authenticated } = usePrivy();

	return (
		<div className="flex justify-between items-center p-4">
			{authenticated ? (
				<div className="flex items-center gap-4">
					<span className="text-sm font-medium truncate max-w-[200px]">
						{user?.wallet?.address}
					</span>
					<PrivyLogoutButton />
				</div>
			) : (
				<PrivyLoginButton />
			)}
		</div>
	);
}

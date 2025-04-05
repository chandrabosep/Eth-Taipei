import React from "react";
import { PrivyLoginButton, PrivyLogoutButton } from "./connectbtn";
import { usePrivy } from "@privy-io/react-auth";

export default function Nav() {
	const { user, authenticated } = usePrivy();

	return (
		<div className="flex justify-between items-center p-4">
			{authenticated ? <PrivyLogoutButton /> : <PrivyLoginButton />}
		</div>
	);
}

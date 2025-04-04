"use client";

import { Button } from "@/components/ui/button";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { LogIn } from "lucide-react";

export const PrivyLogoutButton = () => {
	const { logout } = usePrivy();
	return <Button onClick={logout}>Log out</Button>;
};

type PrivyLoginButtonProps = {
	className?: string;
	variant?: "contained" | "outlined";
};

export function PrivyLoginButton({
	className = "bg-orange-500 text-white hover:bg-orange-600",
	variant = "contained",
}: PrivyLoginButtonProps) {
	const { ready, authenticated } = usePrivy();
	const { login } = useLogin({
		onError: (error) => {
			console.error("Login error:", error);
		},
		onComplete: ({ user }) => {
			console.log("Login complete:", user);
		},
	});

	const disableLogin = !ready || (ready && authenticated);
	const buttonVariant = variant === "outlined" ? "outline" : "default";

	return (
		<Button
			size="lg"
			variant={buttonVariant}
			disabled={disableLogin}
			onClick={() => login()}
			className={`h-12 w-full text-lg font-semibold md:max-w-48 ${className}`}
		>
			<LogIn className="mr-2 h-4 w-4" />
			Connect
		</Button>
	);
}

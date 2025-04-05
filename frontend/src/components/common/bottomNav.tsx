"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Trophy, Users, User } from "lucide-react";

export default function BottomNav() {
	const router = useRouter();
	const pathname = usePathname();

	const tabs = [
		{ name: "Home", icon: Home, path: "/events" },
		{ name: "Quests", icon: Trophy, path: "/quests" },
		{ name: "Interactions", icon: Users, path: "/interactions" },
		{ name: "Profile", icon: User, path: "/profile" },
	];

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-[#f0e6c0] border-t-2 border-[#b89d65] md:hidden">
			<div className="flex justify-around items-center h-16">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = pathname === tab.path;
					return (
						<button
							key={tab.name}
							onClick={() => router.push(tab.path)}
							className={`flex flex-col items-center justify-center w-full h-full ${
								isActive
									? "text-[#5a3e2b]"
									: "text-[#5a3e2b]/60"
							}`}
						>
							<Icon className="w-6 h-6" />
							<span className="text-xs mt-1">{tab.name}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

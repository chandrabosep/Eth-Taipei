"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Trophy, Users, User, LayoutDashboard } from "lucide-react";
import { useEventAdmin } from "@/hooks/useEventAdmin";

interface BottomNavProps {
	eventName: string;
}

export default function BottomNav({ eventName }: BottomNavProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { isAdmin, loading } = useEventAdmin(eventName);

	const baseTabs = [
		{ name: "Home", icon: Home, path: `/events/${eventName}` },
		{ name: "Quests", icon: Trophy, path: `/events/${eventName}/quests` },
		{
			name: "Interactions",
			icon: Users,
			path: `/events/${eventName}/interactions`,
		},
	];

	const adminTab = {
		name: "Dashboard",
		icon: LayoutDashboard,
		path: `/events/${eventName}/dashboard`,
	};

	const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

	// Check if the current path matches any of our tab paths
	const isActivePath = (path: string) => {
		return pathname.startsWith(path);
	};

	if (loading) return null;

	return (
		<>
			{/* Mobile Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0 bg-[#f0e6c0] border-t-2 border-[#b89d65] md:hidden z-10">
				<div className="flex justify-around items-center h-16">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = isActivePath(tab.path);
						return (
							<button
								key={tab.name}
								onClick={() => router.push(tab.path)}
								className={`flex flex-col items-center justify-center w-full h-full ${
									isActive
										? "text-[#5a3e2b]"
										: "text-[#5a3e2b]/60 hover:text-[#5a3e2b]/80"
								}`}
							>
								<Icon className="w-6 h-6" />
								<span className="text-xs mt-1">{tab.name}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Desktop Side Navigation */}
			<div className="hidden md:block fixed left-0 top-1/2 transform -translate-y-1/2 h-fit w-20 bg-[#f0e6c0] border-2 border-[#b89d65] z-10 ml-4 rounded-full">
				<div className="flex flex-col items-center py-8 h-full">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = isActivePath(tab.path);
						return (
							<button
								key={tab.name}
								onClick={() => router.push(tab.path)}
								className={`flex flex-col items-center justify-center w-full py-4 ${
									isActive
										? "text-[#5a3e2b] bg-[#f0e6c0]/70"
										: "text-[#5a3e2b]/60 hover:text-[#5a3e2b]/80 hover:bg-[#f0e6c0]/50"
								} transition-colors`}
							>
								<Icon className="w-6 h-6" />
								<span className="text-xs mt-2 text-center px-1">
									{tab.name}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</>
	);
}

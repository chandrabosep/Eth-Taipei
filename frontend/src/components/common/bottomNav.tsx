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
		{ name: "Profile", icon: User, path: `/events/${eventName}/profile` },
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
		<div className="fixed bottom-0 left-0 right-0 bg-[#f0e6c0] border-t-2 border-[#b89d65] md:hidden">
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

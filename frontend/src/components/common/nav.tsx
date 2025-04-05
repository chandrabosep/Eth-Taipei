import React, { useState } from "react";
import { PrivyLoginButton, PrivyLogoutButton } from "./connectbtn";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Nav() {
	const { user, authenticated } = usePrivy();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navItems = [
		{ name: "Events", href: "/events" },
		{ name: "Create Event", href: "/create-event" },
		{ name: "Dashboard", href: "/dashboard" },
	];

	return (
		<nav className="bg-[#f0e6c0] border-b-2 border-[#b89d65]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center">
						<Link href="/" className="font-serif text-xl text-[#5a3e2b] font-bold">
							ConnectWeb3
						</Link>
					</div>
					
					{/* Desktop navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navItems.map((item) => (
							<Link 
								key={item.name}
								href={item.href}
								className="text-[#5a3e2b] hover:text-[#6b8e50] font-medium"
							>
								{item.name}
							</Link>
						))}
						<div className="ml-4">
							{authenticated ? <PrivyLogoutButton /> : <PrivyLoginButton />}
						</div>
					</div>
					
					{/* Mobile menu button */}
					<div className="flex md:hidden">
						<button
							type="button"
							className="text-[#5a3e2b] hover:text-[#6b8e50]"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							<span className="sr-only">Open main menu</span>
							{mobileMenuOpen ? (
								<XMarkIcon className="block h-6 w-6" aria-hidden="true" />
							) : (
								<Bars3Icon className="block h-6 w-6" aria-hidden="true" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu, show/hide based on menu state */}
			{mobileMenuOpen && (
				<div className="md:hidden">
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#f8f5e6] border-b-2 border-[#b89d65]">
						{navItems.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className="block px-3 py-2 rounded-md text-base font-medium text-[#5a3e2b] hover:bg-[#e6ddb5]"
								onClick={() => setMobileMenuOpen(false)}
							>
								{item.name}
							</Link>
						))}
						<div className="px-3 py-2">
							{authenticated ? <PrivyLogoutButton /> : <PrivyLoginButton />}
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}

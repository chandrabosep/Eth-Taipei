import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Wrapper from "@/components/wrappers/page";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Your App Name",
	description: "Your app description",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Wrapper>{children}</Wrapper>
			</body>
		</html>
	);
}

"use client";

import React, { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface Quest {
	id: string;
	title: string;
	description: string;
	xpReward: number;
	isCompleted: boolean;
}

export default function QuestsPage() {
	const [quests] = useState<Quest[]>([
		{
			id: "1",
			title: "Network Novice",
			description: "Make your first 3 connections at the event",
			xpReward: 50,
			isCompleted: true
		},
		{
			id: "2",
			title: "Interest Explorer",
			description: "Connect with 3 people who share your interests",
			xpReward: 100,
			isCompleted: true
		},
		{
			id: "3",
			title: "Social Butterfly",
			description: "Complete 5 successful connections",
			xpReward: 150,
			isCompleted: false
		},
		{
			id: "4",
			title: "Connection Master",
			description: "Connect with 10 different people at the event",
			xpReward: 200,
			isCompleted: false
		}
	]);

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-4 sm:p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl sm:text-4xl font-serif text-[#5a3e2b] mb-6 sm:mb-8">
					Event <span className="text-[#6b8e50]">Quests</span>
				</h1>

				<div className="grid gap-4 sm:gap-6">
					{quests.map((quest) => (
						<div
							key={quest.id}
							className={cn(
								"bg-white rounded-lg border-2 p-4 sm:p-6",
								quest.isCompleted
									? "border-[#6b8e50]"
									: "border-[#b89d65]"
							)}
						>
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-lg sm:text-xl font-medium text-[#5a3e2b] mb-2">
										{quest.title}
									</h3>
									<p className="text-sm text-[#5a3e2b]/70 mb-3">
										{quest.description}
									</p>
									<span className="bg-[#6b8e50]/10 text-[#6b8e50] px-2 py-1 rounded text-sm">
										+{quest.xpReward} XP
									</span>
								</div>
								<div className="flex items-center">
									{quest.isCompleted && (
										<CheckCircleIcon className="w-6 h-6 text-[#6b8e50]" />
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
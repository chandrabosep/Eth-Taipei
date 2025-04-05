"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
	UsersIcon,
	TrophyIcon,
	SparklesIcon,
	ShareIcon,
	CheckCircleIcon,
	XCircleIcon,
	EyeIcon,
	ClipboardIcon,
	Loader2,
	Shuffle,
} from "lucide-react";
import { getEventBySlug, addOrganizer } from "@/actions/events.action";
import { updateUserStatus } from "@/actions/dashboard.action";
import { randomlyAssignQuestsToUsers } from "@/actions/quest";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

interface EventUser {
	id: string;
	user: {
		id?: string; // Added id field to user object
		name: string | null;
		address: string;
	};
	status: "PENDING" | "ACCEPTED" | "REJECTED";
	tags: string[];
	createdAt: Date;
	xp?: number;
	connections?: Array<any>;
	completedQuests?: Array<any>;
	about?: string;
}

interface EventData {
	id: string;
	name: string;
	image?: string;
	pictureUrl?: string | null;
	startDate: Date;
	eventUsers: EventUser[];
	creatorAddress: string;
	organizers: Array<{ address: string; role?: string }>;
	slug: string;
}

interface UserModalProps {
	user: EventUser | null;
	onClose: () => void;
	onAction: (userId: string, action: "approve" | "reject") => void;
}

interface AddUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (formData: AddUserFormData) => void;
}

interface AddOrganizerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (formData: AddOrganizerFormData) => void;
}

interface AddUserFormData {
	name: string;
	walletAddress: string;
	country: string;
	interests: string[];
	meetingPreferences: string[];
}

interface AddOrganizerFormData {
	address: string;
	role: string;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onAction }) => {
	if (!user) return null;

	const getStatusDisplay = (status: EventUser["status"]) => {
		if (status === "ACCEPTED") return "Approved";
		return status.charAt(0) + status.slice(1).toLowerCase();
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#f8f5e6] rounded-xl p-4 sm:p-8 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-start mb-6">
					<h3 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
						{user.user.name || "Anonymous"}
					</h3>
					<button
						onClick={onClose}
						className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
					>
						✕
					</button>
				</div>

				<div className="space-y-6">
					<div>
						<p className="text-sm text-[#5a3e2b]/60">
							Wallet Address
						</p>
						<p className="text-[#5a3e2b] font-mono text-xs sm:text-sm break-all">
							{user.user.address}
						</p>
					</div>

					<div>
						<p className="text-sm text-[#5a3e2b]/60">About</p>
						<p className="text-[#5a3e2b]">
							{user.about || "No description provided"}
						</p>
					</div>

					<div>
						<p className="text-sm text-[#5a3e2b]/60">Interests</p>
						<div className="flex flex-wrap gap-2 mt-2">
							{user.tags?.map((tag, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-[#6b8e50]/10 text-[#6b8e50] rounded-full text-sm"
								>
									{tag}
								</span>
							))}
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-[#f0e6c0] p-4 rounded-lg">
							<p className="text-sm text-[#5a3e2b]/60">
								XP Earned
							</p>
							<p className="text-xl font-bold text-[#5a3e2b]">
								{user.xp || 0}
							</p>
						</div>
						<div className="bg-[#f0e6c0] p-4 rounded-lg">
							<p className="text-sm text-[#5a3e2b]/60">
								Connections
							</p>
							<p className="text-xl font-bold text-[#5a3e2b]">
								{user.connections?.length || 0}
							</p>
						</div>
						<div className="bg-[#f0e6c0] p-4 rounded-lg">
							<p className="text-sm text-[#5a3e2b]/60">Quests</p>
							<p className="text-xl font-bold text-[#5a3e2b]">
								{user.completedQuests?.length || 0}
							</p>
						</div>
					</div>

					{user.status === "PENDING" && (
						<div className="flex flex-col sm:flex-row gap-4 mt-8">
							<button
								onClick={() => onAction(user.id, "approve")}
								className="flex-1 bg-[#6b8e50] text-white py-2 px-4 rounded-lg hover:bg-[#5a7a42] transition-colors"
							>
								Approve
							</button>
							<button
								onClick={() => onAction(user.id, "reject")}
								className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
							>
								Reject
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const AddUserModal = ({ isOpen, onClose, onSubmit }: AddUserModalProps) => {
	const [formData, setFormData] = useState<AddUserFormData>({
		name: "",
		walletAddress: "",
		country: "",
		interests: [""],
		meetingPreferences: [""],
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
		setFormData({
			name: "",
			walletAddress: "",
			country: "",
			interests: [""],
			meetingPreferences: [""],
		});
		onClose();
	};

	const addInterest = () => {
		setFormData((prev) => ({
			...prev,
			interests: [...prev.interests, ""],
		}));
	};

	const removeInterest = (index: number) => {
		setFormData((prev) => ({
			...prev,
			interests: prev.interests.filter((_, i) => i !== index),
		}));
	};

	const updateInterest = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			interests: prev.interests.map((interest, i) =>
				i === index ? value : interest
			),
		}));
	};

	const addMeetingPreference = () => {
		setFormData((prev) => ({
			...prev,
			meetingPreferences: [...prev.meetingPreferences, ""],
		}));
	};

	const removeMeetingPreference = (index: number) => {
		setFormData((prev) => ({
			...prev,
			meetingPreferences: prev.meetingPreferences.filter(
				(_, i) => i !== index
			),
		}));
	};

	const updateMeetingPreference = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			meetingPreferences: prev.meetingPreferences.map((pref, i) =>
				i === index ? value : pref
			),
		}));
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#f8f5e6] rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-xl font-medium text-[#5a3e2b]">
						Add User
					</h3>
					<button
						onClick={onClose}
						className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
					>
						✕
					</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Name Input */}
					<div>
						<label className="block text-sm text-[#5a3e2b] mb-2">
							Name
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									name: e.target.value,
								}))
							}
							className="w-full px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
								focus:outline-none focus:border-[#8c7851]"
							placeholder="Enter name"
							required
						/>
					</div>

					{/* Wallet Address Input */}
					<div>
						<label className="block text-sm text-[#5a3e2b] mb-2">
							Wallet Address
						</label>
						<input
							type="text"
							value={formData.walletAddress}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									walletAddress: e.target.value,
								}))
							}
							className="w-full px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
								focus:outline-none focus:border-[#8c7851] font-mono"
							placeholder="0x..."
							required
						/>
					</div>

					{/* Country Input */}
					<div>
						<label className="block text-sm text-[#5a3e2b] mb-2">
							Country
						</label>
						<input
							type="text"
							value={formData.country}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									country: e.target.value,
								}))
							}
							className="w-full px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
								focus:outline-none focus:border-[#8c7851]"
							placeholder="Enter country"
							required
						/>
					</div>

					{/* Interests Input */}
					<div>
						<label className="block text-sm text-[#5a3e2b] mb-2">
							Interests
						</label>
						<div className="space-y-3">
							{formData.interests.map((interest, index) => (
								<div key={index} className="flex gap-2">
									<input
										type="text"
										value={interest}
										onChange={(e) =>
											updateInterest(
												index,
												e.target.value
											)
										}
										className="flex-1 px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
											focus:outline-none focus:border-[#8c7851]"
										placeholder="Enter an interest"
										required
									/>
									{index > 0 && (
										<button
											type="button"
											onClick={() =>
												removeInterest(index)
											}
											className="px-3 py-2 text-red-500 hover:text-red-600"
										>
											✕
										</button>
									)}
								</div>
							))}
							<button
								type="button"
								onClick={addInterest}
								className="text-sm text-[#6b8e50] hover:text-[#5a7a42]"
							>
								+ Add another interest
							</button>
						</div>
					</div>

					{/* Meeting Preferences Input */}
					<div>
						<label className="block text-sm text-[#5a3e2b] mb-2">
							Who would you like to meet?
						</label>
						<div className="space-y-3">
							{formData.meetingPreferences.map(
								(preference, index) => (
									<div key={index} className="flex gap-2">
										<input
											type="text"
											value={preference}
											onChange={(e) =>
												updateMeetingPreference(
													index,
													e.target.value
												)
											}
											className="flex-1 px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
											focus:outline-none focus:border-[#8c7851]"
											placeholder="Enter who you'd like to meet"
											required
										/>
										{index > 0 && (
											<button
												type="button"
												onClick={() =>
													removeMeetingPreference(
														index
													)
												}
												className="px-3 py-2 text-red-500 hover:text-red-600"
											>
												✕
											</button>
										)}
									</div>
								)
							)}
							<button
								type="button"
								onClick={addMeetingPreference}
								className="text-sm text-[#6b8e50] hover:text-[#5a7a42]"
							>
								+ Add another preference
							</button>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-[#5a3e2b] hover:bg-[#f0e6c0] rounded-lg"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-[#b89d65] hover:bg-[#a08a55] text-white rounded-lg"
						>
							Add User
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const AddOrganizerModal = ({
	isOpen,
	onClose,
	onSubmit,
}: AddOrganizerModalProps) => {
	const [formData, setFormData] = useState({
		address: "",
		role: "organizer",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
		setFormData({ address: "", role: "organizer" });
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#f8f5e6] rounded-xl p-6 w-full max-w-md">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-medium text-[#5a3e2b]">
						Add Organizer
					</h3>
					<button
						onClick={onClose}
						className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
					>
						✕
					</button>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Wallet Address Input */}
					<div>
						<label className="block text-sm text-[#5a3e2b] mb-2">
							Wallet Address
						</label>
						<input
							type="text"
							value={formData.address}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									address: e.target.value,
								}))
							}
							className="w-full px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
								focus:outline-none focus:border-[#8c7851] font-mono"
							placeholder="0x..."
							required
						/>
					</div>
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-[#5a3e2b] hover:bg-[#f0e6c0] rounded-lg"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-[#b89d65] hover:bg-[#a08a55] text-white rounded-lg"
						>
							Add Organizer
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default function DashboardPage() {
	const params = useParams();
	const router = useRouter();
	const { user, ready } = usePrivy();
	const { toast } = useToast();
	const eventSlug = params.eventname as string;
	const [eventData, setEventData] = useState<EventData | null>(null);
	const [loading, setLoading] = useState(true);
	const [accessChecked, setAccessChecked] = useState(false);
	const [selectedUser, setSelectedUser] = useState<EventUser | null>(null);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);
	const [isUserModalOpen, setIsUserModalOpen] = useState(false);
	const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
	const [approvingUser, setApprovingUser] = useState<string | null>(null);
	const [assigningQuests, setAssigningQuests] = useState(false);
	const [questCount, setQuestCount] = useState(3);
	const [showQuestCountModal, setShowQuestCountModal] = useState(false);
	const [isLoadingAction, setIsLoadingAction] = useState(false);
	const [generatingQuestionsFor, setGeneratingQuestionsFor] = useState<{
		[key: string]: boolean;
	}>({});
	const [questPollingTimers, setQuestPollingTimers] = useState<{
		[key: string]: NodeJS.Timeout;
	}>({});

	const getStatusDisplay = (status: EventUser["status"]) => {
		if (status === "ACCEPTED") return "Approved";
		return status.charAt(0) + status.slice(1).toLowerCase();
	};

	const fetchEventData = async () => {
		try {
			const data = await getEventBySlug(eventSlug);
			if (data) {
				setEventData(data);
			}
		} catch (error) {
			console.error("Error fetching event data:", error);
		}
	};

	useEffect(() => {
		console.log("Effect running with:", {
			ready,
			userExists: !!user,
			walletExists: !!user?.wallet,
			walletAddress: user?.wallet?.address,
			eventSlug,
		});

		// Don't run the effect until Privy is ready
		if (!ready) {
			console.log("Waiting for Privy to be ready...");
			return;
		}

		const checkAccessAndFetchData = async () => {
			try {
				// If no wallet is connected, redirect to home
				if (!user?.wallet?.address) {
					console.log("No wallet connected - user state:", {
						user,
						wallet: user?.wallet,
						address: user?.wallet?.address,
					});
					router.push("/");
					return;
				}

				console.log("Fetching data for event slug:", eventSlug);
				console.log("Connected wallet address:", user.wallet.address);

				const data = await getEventBySlug(eventSlug);
				if (!data) {
					console.error("Event not found");
					router.push("/events");
					return;
				}

				console.log("Event data:", {
					name: data.name,
					creatorAddress: data.creatorAddress,
					organizersCount: data.organizers?.length || 0,
					organizers: data.organizers?.map((org) => org.address),
				});

				// Check if user has access
				const userAddress = user.wallet.address.toLowerCase();
				const isCreator =
					data.creatorAddress?.toLowerCase() === userAddress;
				const isOrganizer =
					data.organizers?.some(
						(org) => org.address?.toLowerCase() === userAddress
					) || false;

				console.log("Access check:", {
					userAddress,
					creatorAddress: data.creatorAddress?.toLowerCase(),
					isCreator,
					isOrganizer,
					organizerAddresses: data.organizers?.map((org) =>
						org.address?.toLowerCase()
					),
				});

				if (!isCreator && !isOrganizer) {
					console.log(
						"Access denied: User is not creator or organizer"
					);
					router.push(`/events/${eventSlug}`);
					return;
				}

				console.log("Access granted!");
				setEventData(data);
				setAccessChecked(true);
			} catch (error) {
				console.error("Error checking access:", error);
				router.push("/events");
			} finally {
				setLoading(false);
			}
		};

		checkAccessAndFetchData();
	}, [eventSlug, router, user?.wallet?.address, ready]);

	// Show loading state while Privy is initializing
	if (!ready) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">
					Initializing wallet connection...
				</div>
			</div>
		);
	}

	if (!user?.wallet?.address) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">
					Please connect your wallet to access the dashboard
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">Loading...</div>
			</div>
		);
	}

	if (!eventData || !accessChecked) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b]">
					Access denied or event not found
				</div>
			</div>
		);
	}

	// Calculate stats
	const totalAttendees = eventData.eventUsers.length;
	const totalXP = eventData.eventUsers.reduce(
		(sum, user) => sum + (user.xp || 0),
		0
	);
	const averageConnections = Math.round(
		eventData.eventUsers.reduce(
			(sum, user) => sum + (user.connections?.length || 0),
			0
		) / totalAttendees || 0
	);
	const questsCompleted = eventData.eventUsers.reduce(
		(sum, user) => sum + (user.completedQuests?.length || 0),
		0
	);

	// Calculate interest groups
	const interestGroups = eventData.eventUsers.reduce(
		(groups: Record<string, number>, user) => {
			user.tags?.forEach((tag: string) => {
				groups[tag] = (groups[tag] || 0) + 1;
			});
			return groups;
		},
		{}
	);

	const sortedInterestGroups = Object.entries(interestGroups)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	// Add a cleanup function for polling timers
	useEffect(() => {
		return () => {
			// Clean up all polling intervals when component unmounts
			Object.values(questPollingTimers).forEach((timer) =>
				clearTimeout(timer)
			);
		};
	}, [questPollingTimers]);

	// Function to check question generation status
	const checkQuestionStatus = async (eventUserId: string) => {
		try {
			const response = await fetch(
				`/api/questions/status?eventUserId=${eventUserId}`
			);

			if (!response.ok) {
				// Handle non-2xx responses
				const errorData = await response
					.json()
					.catch(() => ({ error: "Unknown error" }));
				console.error(
					`Error status ${response.status}: ${
						errorData.error || "Unknown error"
					}`
				);

				// Clear the polling state on API errors
				setGeneratingQuestionsFor((prev) => ({
					...prev,
					[eventUserId]: false,
				}));

				// Clear the polling timer
				if (questPollingTimers[eventUserId]) {
					clearTimeout(questPollingTimers[eventUserId]);
					setQuestPollingTimers((prev) => {
						const newTimers = { ...prev };
						delete newTimers[eventUserId];
						return newTimers;
					});
				}

				// Show error toast
				toast({
					title: "Error",
					description:
						errorData.error || "Failed to check question status",
					variant: "destructive",
					duration: 3000,
				});

				return;
			}

			const data = await response.json();

			if (data.success && data.data.isComplete) {
				// Questions have been generated successfully
				console.log(`Questions generated for user ${eventUserId}`);
				setGeneratingQuestionsFor((prev) => ({
					...prev,
					[eventUserId]: false,
				}));

				// Clear the polling timer
				if (questPollingTimers[eventUserId]) {
					clearTimeout(questPollingTimers[eventUserId]);
					setQuestPollingTimers((prev) => {
						const newTimers = { ...prev };
						delete newTimers[eventUserId];
						return newTimers;
					});
				}

				// Show success toast
				toast({
					title: "Success",
					description: `Generated ${data.data.questionCount} quests for user`,
					duration: 3000,
				});

				// Refresh the user list to show updated status
				fetchEventData();
			} else {
				// Continue polling if not complete
				const timer = setTimeout(
					() => checkQuestionStatus(eventUserId),
					3000
				);
				setQuestPollingTimers((prev) => ({
					...prev,
					[eventUserId]: timer,
				}));
			}
		} catch (error) {
			console.error("Error checking question status:", error);

			// Clear polling state on any error
			setGeneratingQuestionsFor((prev) => ({
				...prev,
				[eventUserId]: false,
			}));

			// Clear the timer
			if (questPollingTimers[eventUserId]) {
				clearTimeout(questPollingTimers[eventUserId]);
				setQuestPollingTimers((prev) => {
					const newTimers = { ...prev };
					delete newTimers[eventUserId];
					return newTimers;
				});
			}

			// Show error toast
			toast({
				title: "Error",
				description: "Failed to check question status",
				variant: "destructive",
				duration: 3000,
			});
		}
	};

	const handleUserAction = async (
		userId: string,
		action: "approve" | "reject"
	) => {
		setIsLoadingAction(true);
		try {
			const status = action === "approve" ? "ACCEPTED" : "REJECTED";
			const result = await updateUserStatus(
				eventData?.id || "",
				userId,
				status
			);

			// Only start polling if this is an approval action
			if (result.success && status === "ACCEPTED") {
				// Mark as generating questions
				setGeneratingQuestionsFor((prev) => ({
					...prev,
					[userId]: true,
				}));

				// Show in-progress toast
				toast({
					title: "Generating Quests",
					description:
						"Quest generation has started in the background",
					duration: 3000,
				});

				// Start polling for status
				checkQuestionStatus(userId);
			}

			if (result.success) {
				// Show general success message
				toast({
					title: "Success",
					description: `User ${
						action === "approve" ? "approved" : "rejected"
					} successfully`,
					duration: 3000,
				});

				fetchEventData();
				setSelectedUser(null);
			} else {
				toast({
					title: "Error",
					description: result.error || `Failed to ${action} user`,
					variant: "destructive",
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Error updating user status:", error);
			toast({
				title: "Error",
				description: `Failed to ${action} user`,
				variant: "destructive",
				duration: 3000,
			});
		}
		setIsLoadingAction(false);
	};

	const copyEventLink = async () => {
		const link = `${window.location.origin}/events/${eventData?.slug}/register`;
		try {
			await navigator.clipboard.writeText(link);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleAddUser = async (formData: AddUserFormData) => {
		try {
			// TODO: Implement API call to add user with all fields
			console.log("Adding user:", formData);
			// Update local state if needed
		} catch (error) {
			console.error("Error adding user:", error);
		}
	};

	const handleAddOrganizer = async (formData: AddOrganizerFormData) => {
		try {
			if (!eventData?.id) {
				throw new Error("Event ID not found");
			}

			const result = await addOrganizer({
				eventId: eventData.id,
				address: formData.address,
				role: "organizer",
			});

			// Update local state
			setEventData((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					organizers: [
						...prev.organizers,
						{
							address: formData.address,
							role: "organizer",
						},
					],
				};
			});

			// Show success message using toast
			toast({
				title: "Success",
				description: "Organizer added successfully!",
				variant: "default",
			});
		} catch (error: any) {
			console.error("Error adding organizer:", error);
			toast({
				title: "Error",
				description: error.message || "Failed to add organizer",
				variant: "destructive",
			});
		}
	};

	const handleRandomAssignment = async () => {
		try {
			setAssigningQuests(true);
			const result = await randomlyAssignQuestsToUsers(
				eventData.id,
				questCount
			);
			if (result.success && result.data) {
				// Update the UI to reflect new assignments
				setEventData((prev) => {
					if (!prev) return prev;

					// Update the eventUsers with their new assigned quests
					const updatedUsers = prev.eventUsers.map((user) => {
						const userAssignments =
							result.data.userQuestAssignments.find(
								(ua) => ua.userId === user.user.id
							);
						return {
							...user,
							completedQuests: [
								...(user.completedQuests || []),
								...(userAssignments?.quests || []),
							],
						};
					});

					return {
						...prev,
						eventUsers: updatedUsers,
					};
				});

				toast({
					title: "Success",
					description: `Successfully assigned ${result.data.assignedQuestsCount} quests between ${result.data.userQuestAssignments.length} users`,
					variant: "default",
				});
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to assign quests",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error assigning quests:", error);
			toast({
				title: "Error",
				description: "Failed to assign quests",
				variant: "destructive",
			});
		} finally {
			setAssigningQuests(false);
			setShowQuestCountModal(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Hero Section */}
			<div className="relative h-64 bg-[#f0e6c0] border-b-2 border-[#b89d65]">
				<img
					src={eventData.pictureUrl || "/event-fall.jpg"}
					alt={eventData.name}
					className="w-full h-full object-cover"
				/>

				<div className="absolute inset-0 bg-gradient-to-t from-[#f8f5e6] to-transparent" />
				<div className="absolute bottom-8 left-8 right-8">
					<h1 className="text-4xl md:text-5xl font-serif text-[#5a3e2b]">
						{eventData.name}
					</h1>
					<p className="text-[#5a3e2b]/80 mt-2">
						{new Date(eventData.startDate).toLocaleDateString(
							"en-US",
							{
								day: "numeric",
								month: "long",
								year: "numeric",
							}
						)}
					</p>
				</div>
			</div>

			<div className="">
				<div className="max-w-7xl mx-auto px-8 py-12">
					{/* Share Event Section */}
					<div className="bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65] mb-12">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-6">
								<div className="w-24 h-24 rounded-lg overflow-hidden bg-[#f8f5e6] border-2 border-[#b89d65]">
									<img
										src={
											eventData.pictureUrl ||
											"/event-fall.jpg"
										}
										alt={eventData.name}
										className="w-full h-full object-cover"
									/>
								</div>
								<div>
									<h2 className="text-2xl font-serif text-[#5a3e2b]">
										Share {eventData.name}
									</h2>
									<p className="text-[#5a3e2b]/60">
										Invite more people to join your event
									</p>
								</div>
							</div>
							<button
								onClick={copyEventLink}
								className="flex items-center gap-2 bg-[#6b8e50] text-white px-6 py-3 rounded-lg hover:bg-[#5a7a42] transition-colors"
							>
								{copySuccess ? (
									<>
										<CheckCircleIcon className="w-5 h-5" />
										Copied!
									</>
								) : (
									<>
										<ClipboardIcon className="w-5 h-5" />
										Copy Link
									</>
								)}
							</button>
						</div>
					</div>

					{questsCompleted === 0 && (
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
							<div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 md:mb-8 rounded-r-lg flex-grow">
								<div className="flex items-start">
									<div className="flex-shrink-0">
										<SparklesIcon
											className="h-5 w-5 text-amber-400"
											aria-hidden="true"
										/>
									</div>
									<div className="ml-3">
										<h3 className="text-sm font-medium text-amber-800">
											Quests Management
										</h3>
										<div className="mt-2 text-sm text-amber-700">
											<p>
												No quests have been assigned to
												attendees yet. As an organizer,
												you can use the "Randomly Assign
												Quests" button to automatically
												create networking quests for all
												approved attendees.
											</p>
										</div>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									variant="outline"
									onClick={() => setShowQuestCountModal(true)}
									className="bg-[#6b8e50] text-white hover:bg-[#5a7a42] border-[#5a7a42]"
								>
									{assigningQuests ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Assigning...
										</>
									) : (
										<>
											<Shuffle className="w-4 h-4 mr-2" />
											Randomly Assign Quests
										</>
									)}
								</Button>
							</div>
						</div>
					)}

					{/* Key Metrics */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-12">
						{[
							{
								icon: (
									<UsersIcon className="w-6 h-6 sm:w-8 sm:h-8" />
								),
								label: "Total Attendees",
								value: totalAttendees,
								color: "bg-[#6b8e50]",
							},
							{
								icon: (
									<SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8" />
								),
								label: "Total XP Earned",
								value: totalXP.toLocaleString(),
								color: "bg-[#b89d65]",
							},
							{
								icon: (
									<UsersIcon className="w-6 h-6 sm:w-8 sm:h-8" />
								),
								label: "Avg. Connections",
								value: averageConnections,
								color: "bg-[#8c7851]",
							},
							{
								icon: (
									<TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8" />
								),
								label: "Quests Completed",
								value: questsCompleted,
								color: "bg-[#5a7a42]",
							},
						].map((metric, index) => (
							<div
								key={index}
								className="bg-[#f0e6c0] rounded-xl p-4 sm:p-6 border-2 border-[#b89d65] 
									 relative overflow-hidden group hover:shadow-lg transition-all"
							>
								<div
									className={`absolute right-0 top-0 w-16 h-16 sm:w-24 sm:h-24 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 rounded-full 
										 ${metric.color} opacity-10 group-hover:opacity-20 transition-opacity`}
								/>
								<div
									className={`${metric.color} text-[#f8f5e6] p-2 sm:p-3 rounded-lg 
										 inline-flex mb-3 sm:mb-4`}
								>
									{metric.icon}
								</div>
								<p className="text-2xl sm:text-4xl font-bold text-[#5a3e2b] mb-1 sm:mb-2">
									{metric.value}
								</p>
								<p className="text-sm sm:text-base text-[#5a3e2b]/60">
									{metric.label}
								</p>
							</div>
						))}
					</div>

					{/* Interest Distribution */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 custom-scrollbar">
						{/* Interest Groups Chart */}
						<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65] overflow-hidden">
							<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b] mb-4 sm:mb-6">
								Interest Distribution
							</h2>
							<div className="space-y-4 sm:space-y-6 max-h-[400px] overflow-y-auto pr-2">
								{sortedInterestGroups.map((group, index) => (
									<div key={index}>
										<div className="flex justify-between mb-1 sm:mb-2">
											<span className="text-sm sm:text-base text-[#5a3e2b] font-medium">
												{group.name}
											</span>
											<span className="text-sm sm:text-base text-[#5a3e2b]/60">
												{Math.round(
													(group.count /
														totalAttendees) *
														100
												)}
												%
											</span>
										</div>
										<div className="h-2 sm:h-3 bg-[#b89d65]/20 rounded-full overflow-hidden">
											<div
												className="h-full bg-[#6b8e50] rounded-full transition-all duration-500"
												style={{
													width: `${
														(group.count /
															totalAttendees) *
														100
													}%`,
												}}
											/>
										</div>
										<p className="text-xs sm:text-sm text-[#5a3e2b]/60 mt-1">
											{group.count} attendees
										</p>
									</div>
								))}
							</div>
						</div>

						{/* Activity Timeline */}
						<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65] overflow-hidden">
							<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b] mb-4 sm:mb-6">
								Recent Activity
							</h2>
							<div className="space-y-4 sm:space-y-6 max-h-[400px] overflow-y-auto pr-2">
								{/* We'll keep the sample activity data for now */}
								{[
									{
										type: "Quest",
										text: "New quest completed by 5 attendees",
										time: "5 minutes ago",
									},
									{
										type: "Connection",
										text: "15 new connections made",
										time: "15 minutes ago",
									},
									{
										type: "XP",
										text: "500 XP earned collectively",
										time: "30 minutes ago",
									},
									{
										type: "Quest",
										text: "New networking quest unlocked",
										time: "1 hour ago",
									},
									{
										type: "Connection",
										text: "25 attendees joined DeFi discussion",
										time: "2 hours ago",
									},
								].map((activity, index) => (
									<div
										key={index}
										className="flex items-start gap-3 sm:gap-4"
									>
										<div className="w-2 h-2 rounded-full bg-[#6b8e50] mt-2" />
										<div>
											<p className="text-sm sm:text-base text-[#5a3e2b]">
												{activity.text}
											</p>
											<p className="text-xs sm:text-sm text-[#5a3e2b]/60">
												{activity.time}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Users and Organizers Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 custom-scrollbar">
						{/* Organizers Section */}
						<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65]">
							<div className="flex justify-between items-center mb-4 sm:mb-6">
								<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
									Organizers
								</h2>
								<button
									onClick={() =>
										setIsOrganizerModalOpen(true)
									}
									className="px-3 py-1.5 bg-[#b89d65] hover:bg-[#a08a55] text-white 
									rounded-lg text-sm flex items-center gap-2"
								>
									Add Organizer
								</button>
							</div>
							<div className="overflow-x-auto -mx-4 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full">
										<thead>
											<tr className="text-left text-[#5a3e2b]/60">
												<th className="pb-3 sm:pb-4 pl-4 sm:pl-0 pr-2 sm:pr-4 text-xs sm:text-sm">
													Organizer
												</th>
											</tr>
										</thead>
										<tbody>
											{eventData.organizers.map(
												(organizer, index) => (
													<tr
														key={index}
														className="border-t border-[#b89d65]/20"
													>
														<td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-[#5a3e2b] font-mono">
															{organizer.address.slice(
																0,
																4
															)}
															...
															{organizer.address.slice(
																-4
															)}
														</td>
													</tr>
												)
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>

						{/* Registered Users Section */}
						<div className="bg-[#f0e6c0] rounded-xl p-4 sm:p-8 border-2 border-[#b89d65] lg:col-span-2">
							<div className="flex justify-between items-center mb-4 sm:mb-6">
								<h2 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
									Registered Users
								</h2>
								<button
									onClick={() => setIsUserModalOpen(true)}
									className="px-3 py-1.5 bg-[#b89d65] hover:bg-[#a08a55] text-white 
									rounded-lg text-sm flex items-center gap-2"
								>
									Add User
								</button>
							</div>
							<div className="overflow-x-auto -mx-4 sm:mx-0">
								<div className="inline-block min-w-full align-middle">
									<table className="min-w-full">
										<thead>
											<tr className="text-left text-[#5a3e2b]/60">
												<th className="pb-3 sm:pb-4 pl-4 sm:pl-0 pr-2 sm:pr-4 text-xs sm:text-sm">
													Name
												</th>
												<th className="pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm">
													Wallet
												</th>
												<th className="pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm">
													Status
												</th>
												<th className="pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
													Registered
												</th>
												<th className="pb-3 sm:pb-4 pl-2 sm:pl-4 pr-4 sm:pr-0 text-xs sm:text-sm">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{eventData.eventUsers.map(
												(user) => (
													<tr
														key={user.id}
														className="border-t border-[#b89d65]/20"
													>
														<td className="py-3 sm:py-4 pl-4 sm:pl-0 pr-2 sm:pr-4 text-xs sm:text-sm text-[#5a3e2b]">
															{user.user.name ||
																"Anonymous"}
														</td>
														<td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-[#5a3e2b] font-mono">
															{user.user.address.slice(
																0,
																4
															)}
															...
															{user.user.address.slice(
																-4
															)}
														</td>
														<td className="py-3 sm:py-4 px-2 sm:px-4">
															<span
																className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
																	user.status ===
																	"ACCEPTED"
																		? "bg-green-100 text-green-800"
																		: user.status ===
																		  "REJECTED"
																		? "bg-red-100 text-red-800"
																		: "bg-yellow-100 text-yellow-800"
																}`}
															>
																{getStatusDisplay(
																	user.status
																)}
															</span>
														</td>
														<td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-[#5a3e2b]/60 hidden sm:table-cell">
															{new Date(
																user.createdAt
															).toLocaleDateString()}
														</td>
														<td className="py-3 sm:py-4 pl-2 sm:pl-4 pr-4 sm:pr-0">
															<button
																onClick={() =>
																	setSelectedUser(
																		user
																	)
																}
																className="text-[#6b8e50] hover:text-[#5a7a42]"
															>
																<EyeIcon className="w-5 h-5" />
															</button>
														</td>
													</tr>
												)
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* User Modal */}
			{selectedUser && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-[#f8f5e6] rounded-xl p-4 sm:p-8 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto relative">
						<div className="flex justify-between items-start mb-6">
							<h3 className="text-xl sm:text-2xl font-serif text-[#5a3e2b]">
								{selectedUser.user.name || "Anonymous"}
							</h3>
							<button
								onClick={() => setSelectedUser(null)}
								className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
							>
								✕
							</button>
						</div>

						<div className="space-y-6">
							<div>
								<p className="text-sm text-[#5a3e2b]/60">
									Wallet Address
								</p>
								<p className="text-[#5a3e2b] font-mono text-xs sm:text-sm break-all">
									{selectedUser.user.address}
								</p>
							</div>

							<div>
								<p className="text-sm text-[#5a3e2b]/60">
									About
								</p>
								<p className="text-[#5a3e2b]">
									{selectedUser.about ||
										"No description provided"}
								</p>
							</div>

							<div>
								<p className="text-sm text-[#5a3e2b]/60">
									Interests
								</p>
								<div className="flex flex-wrap gap-2 mt-2">
									{selectedUser.tags?.map((tag, index) => (
										<span
											key={index}
											className="px-3 py-1 bg-[#6b8e50]/10 text-[#6b8e50] rounded-full text-sm"
										>
											{tag}
										</span>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="bg-[#f0e6c0] p-4 rounded-lg">
									<p className="text-sm text-[#5a3e2b]/60">
										XP Earned
									</p>
									<p className="text-xl font-bold text-[#5a3e2b]">
										{selectedUser.xp || 0}
									</p>
								</div>
								<div className="bg-[#f0e6c0] p-4 rounded-lg">
									<p className="text-sm text-[#5a3e2b]/60">
										Connections
									</p>
									<p className="text-xl font-bold text-[#5a3e2b]">
										{selectedUser.connections?.length || 0}
									</p>
								</div>
								<div className="bg-[#f0e6c0] p-4 rounded-lg">
									<p className="text-sm text-[#5a3e2b]/60">
										Quests
									</p>
									<p className="text-xl font-bold text-[#5a3e2b]">
										{selectedUser.completedQuests?.length ||
											0}
									</p>
								</div>
							</div>

							{/* Render the loading state for quest generation */}
							{generatingQuestionsFor[selectedUser.id] && (
								<span className="text-yellow-600 text-xs flex items-center">
									<Loader2 className="w-3 h-3 mr-1 animate-spin" />{" "}
									Generating quests...
								</span>
							)}

							{selectedUser.status === "PENDING" && (
								<div className="flex flex-col sm:flex-row gap-4 mt-8">
									<button
										onClick={() =>
											handleUserAction(
												selectedUser.id,
												"approve"
											)
										}
										disabled={
											approvingUser === selectedUser.id
										}
										className={cn(
											"flex-1 bg-[#6b8e50] text-white py-2 px-4 rounded-lg hover:bg-[#5a7a42] transition-colors relative",
											approvingUser === selectedUser.id &&
												"opacity-75"
										)}
									>
										{approvingUser === selectedUser.id ? (
											<>
												<Loader2 className="h-5 w-5 animate-spin mx-auto" />
												<span className="sr-only">
													Approving...
												</span>
											</>
										) : (
											"Approve"
										)}
									</button>
									<button
										onClick={() =>
											handleUserAction(
												selectedUser.id,
												"reject"
											)
										}
										disabled={
											approvingUser === selectedUser.id
										}
										className={cn(
											"flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors",
											approvingUser === selectedUser.id &&
												"opacity-75"
										)}
									>
										Reject
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			<AddUserModal
				isOpen={isUserModalOpen}
				onClose={() => setIsUserModalOpen(false)}
				onSubmit={handleAddUser}
			/>
			<AddOrganizerModal
				isOpen={isOrganizerModalOpen}
				onClose={() => setIsOrganizerModalOpen(false)}
				onSubmit={handleAddOrganizer}
			/>

			{/* Quest Count Modal */}
			{showQuestCountModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-[#f8f5e6] rounded-xl p-6 w-full max-w-md">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-medium text-[#5a3e2b]">
								Number of Quests
							</h3>
							<button
								onClick={() => setShowQuestCountModal(false)}
								className="text-[#5a3e2b]/60 hover:text-[#5a3e2b]"
							>
								✕
							</button>
						</div>
						<div className="mb-6">
							<label className="block text-sm text-[#5a3e2b] mb-2">
								How many quests should be assigned to each user?
							</label>
							<input
								type="number"
								value={questCount}
								onChange={(e) =>
									setQuestCount(
										Math.max(
											1,
											parseInt(e.target.value) || 3
										)
									)
								}
								min="1"
								className="w-full px-3 py-2 border-2 border-[#b89d65] rounded-lg bg-white
									focus:outline-none focus:border-[#8c7851]"
							/>
						</div>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setShowQuestCountModal(false)}
								className="px-4 py-2 text-[#5a3e2b] hover:bg-[#f0e6c0] rounded-lg"
							>
								Cancel
							</button>
							<button
								onClick={handleRandomAssignment}
								disabled={assigningQuests}
								className="px-4 py-2 bg-[#b89d65] hover:bg-[#a08a55] text-white rounded-lg disabled:opacity-50"
							>
								{assigningQuests
									? "Assigning..."
									: "Assign Quests"}
							</button>
						</div>
					</div>
				</div>
			)}

			<Toaster />
		</div>
	);
}

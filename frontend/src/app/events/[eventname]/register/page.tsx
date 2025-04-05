"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { registerForEvent } from "@/actions/users.action";
import { getEventBySlug } from "@/actions/events.action";
import { usePrivy } from "@privy-io/react-auth";

interface SocialProfiles {
	twitter?: string;
	linkedin?: string;
	github?: string;
	telegram?: string;
}

interface FormData {
	name: string;
	bio: string;
	country: string;
	socialProfiles: SocialProfiles;
	interests: string[];
	meetingPreferences: string[];
}

export default function RegisterPage() {
	const params = useParams();
	const router = useRouter();
	const { user } = usePrivy();
	const eventSlug = params.eventname as string;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [event, setEvent] = useState<any>(null);
	const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				const eventData = await getEventBySlug(eventSlug);
				if (!eventData) {
					alert("Event not found");
					router.push("/events");
					return;
				}
				setEvent(eventData);

				if (user?.wallet?.address && eventData.eventUsers) {
					const isRegistered = eventData.eventUsers.some(
						(eu: any) => eu.userId === user.wallet?.address
					);
					setIsAlreadyRegistered(isRegistered);
				}
			} catch (error) {
				console.error("Error fetching event:", error);
				alert("Error loading event details");
				router.push("/events");
			}
		};
		fetchEvent();
	}, [eventSlug, router, user?.wallet?.address]);

	const [formData, setFormData] = useState<FormData>({
		name: "",
		bio: "",
		country: "",
		socialProfiles: {},
		interests: [""], // Initialize with one empty interest
		meetingPreferences: [""], // Initialize with one empty meeting preference
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Check if user is authenticated
		if (!user?.wallet?.address) {
			alert("Please connect your wallet first");
			setIsSubmitting(false);
			return;
		}

		// Check if at least one social profile is provided
		const hasSocialProfile = Object.values(formData.socialProfiles).some(
			(value) => value && value.trim() !== ""
		);

		if (!hasSocialProfile) {
			alert("Please provide at least one social profile");
			setIsSubmitting(false);
			return;
		}

		if (!event) {
			alert("Event not found");
			setIsSubmitting(false);
			return;
		}

		try {
			// Filter out empty interests and meeting preferences
			const cleanedInterests = formData.interests.filter(
				(interest) => interest.trim() !== ""
			);

			const cleanedMeetingPreferences =
				formData.meetingPreferences.filter(
					(pref) => pref.trim() !== ""
				);

			const result = await registerForEvent({
				userId: user.wallet.address,
				eventId: event.id,
				bio: formData.bio,
				socials: formData.socialProfiles as Record<string, string>,
				tags: cleanedInterests,
				meetingPreferences: cleanedMeetingPreferences,
				name: formData.name,
				country: formData.country,
				address: user.wallet.address,
			});

			if (result.success) {
				router.push(`/events/${eventSlug}`);
			} else {
				alert("Registration failed: " + result.error);
			}
		} catch (error) {
			console.error("Error during registration:", error);
			alert("An error occurred during registration");
		} finally {
			setIsSubmitting(false);
		}
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

	const handleSocialProfileChange = (
		platform: keyof SocialProfiles,
		value: string
	) => {
		setFormData((prev) => ({
			...prev,
			socialProfiles: {
				...prev.socialProfiles,
				[platform]: value,
			},
		}));
	};

	if (isAlreadyRegistered) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] p-8">
				<div className="max-w-2xl mx-auto bg-[#f0e6c0] rounded-xl shadow-lg p-6 border-2 border-[#b89d65] text-center">
					<h1 className="text-3xl font-serif text-[#5a3e2b] mb-4">
						Already Registered
					</h1>
					<p className="text-[#5a3e2b] mb-6">
						You have already registered for this event.
					</p>
					<button
						onClick={() => router.push(`/events/${eventSlug}`)}
						className="bg-[#b89d65] hover:bg-[#a08a55] text-[#f8f5e6] 
								font-medium py-3 px-6 rounded-lg border-2 border-[#8c7851] 
								transition-colors focus:outline-none focus:ring-2 focus:ring-[#b89d65]"
					>
						Go to Event Page
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-8 pb-24">
			<div className="max-w-2xl mx-auto bg-[#f0e6c0] rounded-xl shadow-lg p-6 border-2 border-[#b89d65]">
				<h1 className="text-3xl font-serif text-[#5a3e2b] mb-8">
					Register for Event
				</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Name Input */}
					<div>
						<label
							htmlFor="name"
							className="block text-[#5a3e2b] font-medium mb-2"
						>
							Your Name
						</label>
						<input
							type="text"
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									name: e.target.value,
								}))
							}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
									 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
									 focus:border-[#b89d65] transition-colors"
							placeholder="Enter your name"
							required
						/>
					</div>

					{/* Bio Input */}
					<div>
						<label
							htmlFor="bio"
							className="block text-[#5a3e2b] font-medium mb-2"
						>
							Bio
						</label>
						<textarea
							id="bio"
							value={formData.bio}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									bio: e.target.value,
								}))
							}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
									 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
									 focus:border-[#b89d65] transition-colors min-h-[100px]"
							placeholder="Tell us about yourself..."
							required
						/>
					</div>

					{/* Country Input */}
					<div>
						<label
							htmlFor="country"
							className="block text-[#5a3e2b] font-medium mb-2"
						>
							Country
						</label>
						<input
							type="text"
							id="country"
							value={formData.country}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									country: e.target.value,
								}))
							}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
									 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
									 focus:border-[#b89d65] transition-colors"
							placeholder="Enter your country"
							required
						/>
					</div>

					{/* Social Profiles */}
					<div>
						<label className="block text-[#5a3e2b] font-medium mb-2">
							Social Profiles{" "}
							<span className="text-sm text-[#5a3e2b]/60">
								(at least one required)
							</span>
						</label>
						<div className="space-y-3">
							{[
								{
									platform: "twitter",
									label: "Twitter",
									placeholder: "@username",
								},
								{
									platform: "linkedin",
									label: "LinkedIn",
									placeholder: "Profile URL",
								},
								{
									platform: "github",
									label: "GitHub",
									placeholder: "@username",
								},
								{
									platform: "telegram",
									label: "Telegram",
									placeholder: "@username",
								},
							].map(({ platform, label, placeholder }) => (
								<div
									key={platform}
									className="flex items-center gap-2"
								>
									<span className="w-24 text-[#5a3e2b]">
										{label}:
									</span>
									<input
										type="text"
										value={
											formData.socialProfiles[
												platform as keyof SocialProfiles
											] || ""
										}
										onChange={(e) =>
											handleSocialProfileChange(
												platform as keyof SocialProfiles,
												e.target.value
											)
										}
										placeholder={placeholder}
										className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
												 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
												 focus:border-[#b89d65] transition-colors"
									/>
								</div>
							))}
						</div>
						<p className="mt-2 text-sm text-[#5a3e2b]/60">
							Fill in at least one social profile of your choice
						</p>
					</div>

					{/* Dynamic Interests Input */}
					<div>
						<label className="block text-[#5a3e2b] font-medium mb-2">
							Your Interests
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
										placeholder="Enter your interest"
										className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
												 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
												 focus:border-[#b89d65] transition-colors"
									/>
									{formData.interests.length > 1 && (
										<button
											type="button"
											onClick={() =>
												removeInterest(index)
											}
											className="px-3 py-2 rounded-lg border-2 border-[#8c7851] 
													 bg-[#b89d65]/10 text-[#5a3e2b] hover:bg-[#b89d65]/20 
													 transition-colors"
										>
											×
										</button>
									)}
								</div>
							))}

							<button
								type="button"
								onClick={addInterest}
								className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-[#b89d65] 
										 text-[#5a3e2b] hover:bg-[#b89d65]/10 transition-colors"
							>
								+ Add Interest
							</button>
						</div>
					</div>

					{/* Meeting Preferences */}
					<div>
						<label className="block text-[#5a3e2b] font-medium mb-2">
							Who Would You Like to Meet?
						</label>
						<div className="space-y-3">
							{formData.meetingPreferences.map((pref, index) => (
								<div key={index} className="flex gap-2">
									<input
										type="text"
										value={pref}
										onChange={(e) =>
											updateMeetingPreference(
												index,
												e.target.value
											)
										}
										placeholder="e.g., Developers, Investors, Designers"
										className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
												 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
												 focus:border-[#b89d65] transition-colors"
									/>
									{formData.meetingPreferences.length > 1 && (
										<button
											type="button"
											onClick={() =>
												removeMeetingPreference(index)
											}
											className="px-3 py-2 rounded-lg border-2 border-[#8c7851] 
													 bg-[#b89d65]/10 text-[#5a3e2b] hover:bg-[#b89d65]/20 
													 transition-colors"
										>
											×
										</button>
									)}
								</div>
							))}

							<button
								type="button"
								onClick={addMeetingPreference}
								className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-[#b89d65] 
										 text-[#5a3e2b] hover:bg-[#b89d65]/10 transition-colors"
							>
								+ Add Preference
							</button>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-[#b89d65] hover:bg-[#a08a55] text-[#f8f5e6] 
								 font-medium py-3 rounded-lg border-2 border-[#8c7851] 
								 transition-colors focus:outline-none focus:ring-2 focus:ring-[#b89d65]
								 disabled:opacity-70 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Registering..." : "Register"}
					</button>
				</form>
			</div>
		</div>
	);
}

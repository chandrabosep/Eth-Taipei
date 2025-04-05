"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { registerForEvent } from "@/actions/users.action";
import { getEventBySlug } from "@/actions/events.action";
import { usePrivy } from "@privy-io/react-auth";
import { PrivyLoginButton } from "@/components/common/connectbtn";

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
	const { user, ready } = usePrivy();
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
			<div className="min-h-screen bg-[#f8f5e6] flex flex-col items-center justify-center gap-6 p-4">
				<div className="text-[#5a3e2b] text-xl text-center">
					Please connect your wallet to register for this event
				</div>
				<PrivyLoginButton />
			</div>
		);
	}

	if (isAlreadyRegistered) {
		return (
			<div className="min-h-screen bg-[#f8f5e6] flex items-center justify-center p-4">
				<div className="text-[#5a3e2b] text-xl">
					You are already registered for this event.{" "}
					<button
						onClick={() => router.push(`/events/${eventSlug}`)}
						className="text-[#6b8e50] hover:underline"
					>
						Return to event page
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#f8f5e6]">
			{/* Hero Section */}
			<div className="relative h-64 bg-[#f0e6c0] border-b-2 border-[#b89d65]">
				<img
					src={event?.pictureUrl || "/event-fall.jpg"}
					alt={event?.name}
					className="w-full h-full object-cover"
				/>

				<div className="absolute inset-0 bg-gradient-to-t from-[#f8f5e6] to-transparent" />
				<div className="absolute bottom-8 left-8 right-8">
					<h1 className="text-4xl md:text-5xl font-serif text-[#5a3e2b]">
						{event?.name}
					</h1>
					<p className="text-[#5a3e2b]/80 mt-2">
						{event?.startDate &&
							new Date(event.startDate).toLocaleDateString(
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

			<div className="max-w-3xl mx-auto px-8 py-12">
				{/* Event Description */}
				<div className="mb-8 bg-[#f0e6c0] rounded-xl p-6 border-2 border-[#b89d65]">
					<h2 className="text-2xl font-serif text-[#5a3e2b] mb-3">
						About This Event
					</h2>
					<p className="text-[#5a3e2b]/80 whitespace-pre-line">
						{event?.description || "No description available."}
					</p>
				</div>

				<div className="bg-[#f0e6c0] rounded-xl p-6 sm:p-8 border-2 border-[#b89d65] shadow-md">
					<h2 className="text-2xl font-serif text-[#5a3e2b] mb-6">
						Register for Event
					</h2>

					<form onSubmit={handleSubmit} className="space-y-8">
						{/* Basic Information */}
						<div>
							<h3 className="text-lg font-medium text-[#5a3e2b] border-b border-[#b89d65]/30 pb-2 mb-4">
								Basic Information
							</h3>
							<div className="space-y-4">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-[#5a3e2b] mb-1"
									>
										Name
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
										className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6] text-[#5a3e2b] placeholder-[#5a3e2b]/40
												focus:outline-none focus:border-[#6b8e50]"
										placeholder="Your name"
										required
									/>
								</div>

								<div>
									<label
										htmlFor="bio"
										className="block text-sm font-medium text-[#5a3e2b] mb-1"
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
										className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6] text-[#5a3e2b] placeholder-[#5a3e2b]/40
												focus:outline-none focus:border-[#6b8e50] min-h-[100px]"
										placeholder="Tell us about yourself"
										required
									/>
								</div>

								<div>
									<label
										htmlFor="country"
										className="block text-sm font-medium text-[#5a3e2b] mb-1"
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
										className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6] text-[#5a3e2b] placeholder-[#5a3e2b]/40
												focus:outline-none focus:border-[#6b8e50]"
										placeholder="Your country"
										required
									/>
								</div>
							</div>
						</div>

						{/* Social Profiles */}
						<div>
							<h3 className="text-lg font-medium text-[#5a3e2b] border-b border-[#b89d65]/30 pb-2 mb-4">
								Social Profiles
							</h3>
							{Object.keys(formData.socialProfiles).length ===
								0 && (
								<p className="text-sm text-[#5a3e2b]/60 mb-4">
									Please provide at least one social profile
								</p>
							)}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{[
									"twitter",
									"linkedin",
									"github",
									"telegram",
								].map((platform) => (
									<div key={platform}>
										<label
											htmlFor={platform}
											className="block text-sm font-medium text-[#5a3e2b] mb-1 capitalize"
										>
											{platform}
										</label>
										<input
											type="text"
											id={platform}
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
											className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6] text-[#5a3e2b] placeholder-[#5a3e2b]/40
														focus:outline-none focus:border-[#6b8e50]"
											placeholder={`Your ${platform} profile`}
										/>
									</div>
								))}
							</div>
						</div>

						{/* Interests */}
						<div>
							<div className="flex justify-between items-center border-b border-[#b89d65]/30 pb-2 mb-4">
								<h3 className="text-lg font-medium text-[#5a3e2b]">
									Interests
								</h3>
								<button
									type="button"
									onClick={addInterest}
									className="text-sm bg-[#6b8e50] text-white px-3 py-1 rounded-md hover:bg-[#5a7a42] transition-colors"
								>
									+ Add Interest
								</button>
							</div>
							<div className="space-y-4">
								{formData.interests.map((interest, index) => (
									<div
										key={index}
										className="flex gap-2 items-center"
									>
										<input
											type="text"
											value={interest}
											onChange={(e) =>
												updateInterest(
													index,
													e.target.value
												)
											}
											className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6] text-[#5a3e2b] placeholder-[#5a3e2b]/40
													focus:outline-none focus:border-[#6b8e50]"
											placeholder="Enter an interest"
										/>
										{index > 0 && (
											<button
												type="button"
												onClick={() =>
													removeInterest(index)
												}
												className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
											>
												Remove
											</button>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Meeting Preferences */}
						<div>
							<div className="flex justify-between items-center border-b border-[#b89d65]/30 pb-2 mb-4">
								<h3 className="text-lg font-medium text-[#5a3e2b]">
									Meeting Preferences
								</h3>
								<button
									type="button"
									onClick={addMeetingPreference}
									className="text-sm bg-[#6b8e50] text-white px-3 py-1 rounded-md hover:bg-[#5a7a42] transition-colors"
								>
									+ Add Preference
								</button>
							</div>
							<div className="space-y-4">
								{formData.meetingPreferences.map(
									(pref, index) => (
										<div
											key={index}
											className="flex gap-2 items-center"
										>
											<input
												type="text"
												value={pref}
												onChange={(e) =>
													updateMeetingPreference(
														index,
														e.target.value
													)
												}
												className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6] text-[#5a3e2b] placeholder-[#5a3e2b]/40
													focus:outline-none focus:border-[#6b8e50]"
												placeholder="Enter a meeting preference"
											/>
											{index > 0 && (
												<button
													type="button"
													onClick={() =>
														removeMeetingPreference(
															index
														)
													}
													className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
												>
													Remove
												</button>
											)}
										</div>
									)
								)}
							</div>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-[#6b8e50] text-white py-3 px-6 rounded-lg hover:bg-[#5a7a42] transition-colors
									disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-md"
						>
							{isSubmitting ? "Registering..." : "Register"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

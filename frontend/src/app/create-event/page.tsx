"use client";

import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { createEvent } from "@/actions/events.action";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { uploadToPinata } from "@/utils/pinata";

interface FormData {
	eventName: string;
	description: string;
	startDate: string;
	endDate: string;
	features: string[];
	eventImage?: File;
}

export default function CreateEvent() {
	const router = useRouter();
	const { user } = usePrivy();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<FormData>({
		eventName: "",
		description: "",
		startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
		endDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
		features: [""],
	});

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];

		if (file) {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				alert("Please upload an image file");
				return;
			}

			// Validate file size (5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert("Image size should be less than 5MB");
				return;
			}

			setFormData((prev) => ({ ...prev, eventImage: file }));

			// Create preview URL
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const cleanedData = {
				...formData,
				features: formData.features.filter(
					(feature) => feature.trim() !== ""
				),
			};

			const walletAddress = user?.wallet?.address;
			if (!walletAddress) {
				throw new Error(
					"No wallet address found. Please connect your wallet."
				);
			}

			// Upload image to Pinata if provided
			let pictureUrl = "";
			if (formData.eventImage) {
				try {
					console.log("Uploading image to Pinata...");
					pictureUrl = await uploadToPinata(formData.eventImage);
					console.log("Image uploaded successfully:", pictureUrl);
				} catch (error) {
					console.error("Error uploading image:", error);
					throw new Error("Failed to upload event image");
				}
			}

			// Make sure we have at least one feature
			if (cleanedData.features.length === 0) {
				cleanedData.features = ["General"];
			}

			const createdEvent = await createEvent({
				eventName: cleanedData.eventName,
				description: cleanedData.description,
				startDate: cleanedData.startDate,
				endDate: cleanedData.endDate,
				features: cleanedData.features,
				pictureUrl,
				creatorAddress: walletAddress,
			});

			if (createdEvent) {
				router.push(`/events/${createdEvent.slug}/dashboard`);
			} else {
				throw new Error(
					"Failed to create event. No response received."
				);
			}
		} catch (error) {
			console.error("Failed to create event:", error);
			alert(
				`Failed to create event: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const addFeature = () => {
		setFormData((prev) => ({
			...prev,
			features: [...prev.features, ""],
		}));
	};

	const removeFeature = (index: number) => {
		setFormData((prev) => ({
			...prev,
			features: prev.features.filter((_, i) => i !== index),
		}));
	};

	const updateFeature = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			features: prev.features.map((feature, i) =>
				i === index ? value : feature
			),
		}));
	};

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-8">
			<div className="max-w-2xl mx-auto bg-[#f0e6c0] rounded-xl shadow-lg p-6 border-2 border-[#b89d65]">
				<h1 className="text-3xl font-serif text-[#5a3e2b] mb-8">
					Create New Event
				</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Event Name Input */}
					<div>
						<label
							htmlFor="eventName"
							className="block text-[#5a3e2b] font-medium mb-2"
						>
							Event Name
						</label>
						<input
							type="text"
							id="eventName"
							value={formData.eventName}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									eventName: e.target.value,
								}))
							}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
                       text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
                       focus:border-[#b89d65] transition-colors"
							placeholder="Enter event name"
							required
						/>
					</div>

					{/* Description Input */}
					<div>
						<label
							htmlFor="description"
							className="block text-[#5a3e2b] font-medium mb-2"
						>
							Event Description
						</label>
						<textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
                       text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
                       focus:border-[#b89d65] transition-colors min-h-[120px]"
							placeholder="Describe your event..."
							required
						/>
					</div>

					{/* Event Image Upload */}
					<div>
						<label className="block text-[#5a3e2b] font-medium mb-2">
							Event Image
						</label>
						<div className="space-y-4">
							{imagePreview ? (
								<div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-[#b89d65]">
									<img
										src={imagePreview}
										alt="Event preview"
										className="object-cover w-full h-full"
									/>
									<button
										type="button"
										onClick={() => {
											setImagePreview("");
											setFormData((prev) => ({
												...prev,
												eventImage: undefined,
											}));

											if (fileInputRef.current) {
												fileInputRef.current.value = ""; // Reset file input
											}
										}}
										className="absolute top-2 right-2 bg-[#b89d65]/80 text-[#f8f5e6] rounded-full p-1
                             hover:bg-[#a08a55] transition-colors"
									>
										×
									</button>
								</div>
							) : (
								<div
									onClick={() =>
										fileInputRef.current?.click()
									}
									className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-[#b89d65] 
                           text-[#5a3e2b] hover:bg-[#b89d65]/10 transition-colors cursor-pointer
                           flex flex-col items-center justify-center"
								>
									<span>Click to upload event image</span>
									<span className="text-sm text-[#5a3e2b]/60 mt-1">
										Supports: JPG, PNG (Max 5MB)
									</span>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/jpeg,image/png"
										onChange={handleImageChange}
										className="hidden"
									/>
								</div>
							)}
						</div>
					</div>

					{/* Date/Time Inputs */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="startDate"
								className="block text-[#5a3e2b] font-medium mb-2"
							>
								Start Date & Time
							</label>
							<input
								type="datetime-local"
								id="startDate"
								value={formData.startDate}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										startDate: e.target.value,
									}))
								}
								className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
                         text-[#5a3e2b] focus:outline-none focus:border-[#b89d65] transition-colors"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="endDate"
								className="block text-[#5a3e2b] font-medium mb-2"
							>
								End Date & Time
							</label>
							<input
								type="datetime-local"
								id="endDate"
								value={formData.endDate}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										endDate: e.target.value,
									}))
								}
								className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
                         text-[#5a3e2b] focus:outline-none focus:border-[#b89d65] transition-colors"
								required
							/>
						</div>
					</div>

					{/* Dynamic Features Input */}
					<div>
						<label className="block text-[#5a3e2b] font-medium mb-2">
							Event Features
						</label>
						<div className="space-y-3">
							{formData.features.map((feature, index) => (
								<div key={index} className="flex gap-2">
									<input
										type="text"
										value={feature}
										onChange={(e) =>
											updateFeature(index, e.target.value)
										}
										placeholder="Enter feature name"
										className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
                             text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
                             focus:border-[#b89d65] transition-colors"
									/>
									{formData.features.length > 1 && (
										<button
											type="button"
											onClick={() => removeFeature(index)}
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
								onClick={addFeature}
								className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-[#b89d65] 
                         text-[#5a3e2b] hover:bg-[#b89d65]/10 transition-colors"
							>
								+ Add Interest
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
                     disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Creating..." : "Create Event"}
					</button>
				</form>
			</div>
		</div>
	);
}

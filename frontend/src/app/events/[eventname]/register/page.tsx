'use client';

import React, { useState } from 'react';

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
	intrest: string[];
}

export default function RegisterPage() {
	const [formData, setFormData] = useState<FormData>({
		name: '',
		bio: '',
		country: '',
		socialProfiles: {},
		intrest: [''] // Initialize with one empty intrest
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		// Check if at least one social profile is provided
		const hasSocialProfile = Object.values(formData.socialProfiles).some(value => value.trim() !== '');
		
		if (!hasSocialProfile) {
			alert('Please provide at least one social profile');
			return;
		}

		const cleanedData = {
			...formData,
			intrest: formData.intrest.filter(intrest => intrest.trim() !== '')
		};
		console.log(cleanedData);
		// Handle form submission
	};

	const addintrest = () => {
		setFormData(prev => ({
			...prev,
			intrest: [...prev.intrest, '']
		}));
	};

	const removeintrest = (index: number) => {
		setFormData(prev => ({
			...prev,
			intrest: prev.intrest.filter((_, i) => i !== index)
		}));
	};

	const updateintrest = (index: number, value: string) => {
		setFormData(prev => ({
			...prev,
			intrest: prev.intrest.map((intrest, i) => 
				i === index ? value : intrest
			)
		}));
	};

	const handleSocialProfileChange = (platform: keyof SocialProfiles, value: string) => {
		setFormData(prev => ({
			...prev,
			socialProfiles: {
				...prev.socialProfiles,
				[platform]: value
			}
		}));
	};

	return (
		<div className="min-h-screen bg-[#f8f5e6] p-8">
			<div className="max-w-2xl mx-auto bg-[#f0e6c0] rounded-xl shadow-lg p-6 border-2 border-[#b89d65]">
				<h1 className="text-3xl font-serif text-[#5a3e2b] mb-8">Register for Event</h1>
				
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Name Input */}
					<div>
						<label htmlFor="name" className="block text-[#5a3e2b] font-medium mb-2">
							Your Name
						</label>
						<input
							type="text"
							id="name"
							value={formData.name}
							onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
									 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
									 focus:border-[#b89d65] transition-colors"
							placeholder="Enter your name"
							required
						/>
					</div>

					{/* Bio Input */}
					<div>
						<label htmlFor="bio" className="block text-[#5a3e2b] font-medium mb-2">
							Bio
						</label>
						<textarea
							id="bio"
							value={formData.bio}
							onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
							className="w-full px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
									 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
									 focus:border-[#b89d65] transition-colors min-h-[100px]"
							placeholder="Tell us about yourself..."
							required
						/>
					</div>

					{/* Country Input */}
					<div>
						<label htmlFor="country" className="block text-[#5a3e2b] font-medium mb-2">
							Country
						</label>
						<input
							type="text"
							id="country"
							value={formData.country}
							onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
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
							Social Profiles <span className="text-sm text-[#5a3e2b]/60">(at least one required)</span>
						</label>
						<div className="space-y-3">
							{[
								{ platform: 'twitter', label: 'Twitter', placeholder: '@username' },
								{ platform: 'linkedin', label: 'LinkedIn', placeholder: 'Profile URL' },
								{ platform: 'github', label: 'GitHub', placeholder: '@username' },
								{ platform: 'telegram', label: 'Telegram', placeholder: '@username' }
							].map(({ platform, label, placeholder }) => (
								<div key={platform} className="flex items-center gap-2">
									<span className="w-24 text-[#5a3e2b]">{label}:</span>
									<input
										type="text"
										value={formData.socialProfiles[platform as keyof SocialProfiles] || ''}
										onChange={(e) => handleSocialProfileChange(platform as keyof SocialProfiles, e.target.value)}
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

					{/* Dynamic intrest Input */}
					<div>
						<label className="block text-[#5a3e2b] font-medium mb-2">
							Your intrest
						</label>
						<div className="space-y-3">
							{formData.intrest.map((intrest, index) => (
								<div key={index} className="flex gap-2">
									<input
										type="text"
										value={intrest}
										onChange={(e) => updateintrest(index, e.target.value)}
										placeholder="Enter your intrest"
										className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
												 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
												 focus:border-[#b89d65] transition-colors"
									/>
									{formData.intrest.length > 1 && (
										<button
											type="button"
											onClick={() => removeintrest(index)}
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
								onClick={addintrest}
								className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-[#b89d65] 
										 text-[#5a3e2b] hover:bg-[#b89d65]/10 transition-colors"
							>
								+ Add Intrest
							</button>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						className="w-full bg-[#b89d65] hover:bg-[#a08a55] text-[#f8f5e6] 
								 font-medium py-3 rounded-lg border-2 border-[#8c7851] 
								 transition-colors focus:outline-none focus:ring-2 focus:ring-[#b89d65]"
					>
						Register
					</button>
				</form>
			</div>
		</div>
	);
}

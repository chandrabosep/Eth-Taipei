'use client';

import React, { useState } from 'react';

interface FormData {
	name: string;
	interests: string[];
}

export default function RegisterPage() {
	const [formData, setFormData] = useState<FormData>({
		name: '',
		interests: [''] // Initialize with one empty interest
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Filter out empty interests before submitting
		const cleanedData = {
			...formData,
			interests: formData.interests.filter(interest => interest.trim() !== '')
		};
		console.log(cleanedData);
		// Handle form submission
	};

	const addInterest = () => {
		setFormData(prev => ({
			...prev,
			interests: [...prev.interests, '']
		}));
	};

	const removeInterest = (index: number) => {
		setFormData(prev => ({
			...prev,
			interests: prev.interests.filter((_, i) => i !== index)
		}));
	};

	const updateInterest = (index: number, value: string) => {
		setFormData(prev => ({
			...prev,
			interests: prev.interests.map((interest, i) => 
				i === index ? value : interest
			)
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
										onChange={(e) => updateInterest(index, e.target.value)}
										placeholder="Enter your interest"
										className="flex-1 px-4 py-2 rounded-lg border-2 border-[#b89d65] bg-[#f8f5e6]/50 
												 text-[#5a3e2b] placeholder-[#5a3e2b]/50 focus:outline-none 
												 focus:border-[#b89d65] transition-colors"
									/>
									{formData.interests.length > 1 && (
										<button
											type="button"
											onClick={() => removeInterest(index)}
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

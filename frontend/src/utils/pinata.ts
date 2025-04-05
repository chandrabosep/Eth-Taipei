export async function uploadToPinata(file: File): Promise<string> {
	try {
		// Create form data
		const formData = new FormData();
		formData.append("file", file);

		// Upload to Pinata
		const res = await fetch(
			"https://api.pinata.cloud/pinning/pinFileToIPFS",
			{
				method: "POST",
				headers: {
					pinata_api_key:
						process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
					pinata_secret_api_key:
						process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || "",
				},
				body: formData,
			}
		);

		if (!res.ok) {
			throw new Error(`Failed to upload to Pinata: ${res.statusText}`);
		}

		const data = await res.json();

		// Return the IPFS hash
		return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
	} catch (error) {
		console.error("Error uploading to Pinata:", error);
		throw new Error("Failed to upload image to IPFS");
	}
}

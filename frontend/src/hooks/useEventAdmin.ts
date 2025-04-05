import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { isEventAdmin } from "@/utils/auth";

export function useEventAdmin(eventId: string) {
	const { user } = usePrivy();
	const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function checkAdminStatus() {
			if (!user?.wallet?.address) {
				setIsAdmin(false);
				setLoading(false);
				return;
			}

			try {
				const adminStatus = await isEventAdmin(
					eventId,
					user.wallet.address
				);
				setIsAdmin(adminStatus ?? false);
			} catch (error) {
				console.error("Error checking admin status:", error);
				setIsAdmin(false);
			} finally {
				setLoading(false);
			}
		}

		checkAdminStatus();
	}, [eventId, user?.wallet?.address]);

	return { isAdmin, loading };
}

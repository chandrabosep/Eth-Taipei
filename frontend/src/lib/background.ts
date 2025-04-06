/**
 * Utility for running tasks in the background that exceed Vercel's function timeout limit (10s)
 * This allows us to return immediately from serverless functions while still performing
 * long-running tasks asynchronously
 */

/**
 * Run a task in the background, completely detached from the current request
 * This prevents Vercel's serverless function timeout from affecting the background task
 *
 * @param taskFn - The async function to run in the background
 * @param taskName - Optional name for logging purposes
 */
export function runInBackground<T>(
	taskFn: () => Promise<T>,
	taskName: string = "background task"
): void {
	// Use setImmediate to ensure the current function returns before the background task starts
	setImmediate(() => {
		// Execute the task in a completely detached async context
		(async () => {
			try {
				console.log(`Starting background task: ${taskName}`);
				const result = await taskFn();
				console.log(`Background task completed: ${taskName}`, result);
			} catch (error) {
				console.error(`Error in background task (${taskName}):`, error);
			}
		})().catch((err) => {
			console.error(
				`Uncaught error in background task (${taskName}):`,
				err
			);
		});
	});
}

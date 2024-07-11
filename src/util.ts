/**
 * Helper function to build a path from an array of segments.
 * @param {readonly (string | number)[]} segments - The path segments.
 * @returns {string} The constructed path.
 */
export function buildPath(segments: readonly (string | number)[]): string {
	const pathname: string[] = [];
	for (let seg of segments) {
		if (typeof seg === "number") {
			pathname.push(String(seg));
			continue;
		}
		seg = seg.trim();
		if (seg === "") continue;
		if (seg.startsWith("/")) {
			seg = seg.slice(1);
		}
		if (seg.endsWith("/")) {
			seg = seg.slice(0, -1);
		}
		pathname.push(seg);
	}
	return pathname.join("/");
}

/**
 * Merges multiple AbortSignals into a single AbortSignal.
 *
 * @param signals - An array of AbortSignals to merge.
 * @returns A merged AbortSignal that represents all the input signals.
 */
export function mergeSignals(signals: readonly AbortSignal[]): AbortSignal {
	const controller = new AbortController();

	const onAbort = (ev: Event) => {
		if (ev.target instanceof AbortSignal) {
			controller.abort(ev.target.reason);
		} else {
			controller.abort();
		}
	};

	const cleanup = () => {
		for (const signal of signals) {
			signal.removeEventListener("abort", onAbort);
		}
	};

	for (const signal of signals) {
		if (signal.aborted) {
			controller.abort(signal.reason);
		} else {
			signal.addEventListener("abort", onAbort, { once: true });
		}
	}

	if (controller.signal.aborted) {
		cleanup();
	} else {
		controller.signal.addEventListener("abort", cleanup, { once: true });
	}

	return controller.signal;
}

/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param ms - The number of milliseconds to delay.
 * @returns A promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

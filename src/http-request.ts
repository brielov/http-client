import {
	failure,
	success,
	type HttpRequestInit,
	type HttpResponse,
} from "./common";
import {
	AbortError,
	BadRequestError,
	ClientError,
	ConnectionError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
	ServerError,
	TimeoutError,
	UnauthorizedError,
} from "./http-error";

/**
 * Default number of retries for the HTTP request.
 */
const DEFAULT_RETRIES = 0;

/**
 * Default delay between retries in milliseconds.
 */
const DEFAULT_RETRY_DELAY = 500;

/**
 * Default timeout for the HTTP request in milliseconds.
 */
const DEFAULT_TIMEOUT = 10_000;

/**
 * Default timeout message.
 */
const TIMEOUT_MESSAGE = "Request timed out";

/**
 * Performs an HTTP request with the specified options and handles retries and timeouts.
 *
 * @param url - The URL to which the request is made.
 * @param init - The request initialization options.
 * @param options - The options for retries, retry delay, and timeout.
 * @param retryCount - The current retry count (used internally for recursive retries).
 * @returns A promise that resolves to an HttpResponse object containing the response or an error.
 */
export async function httpRequest(
	url: URL,
	init: HttpRequestInit,
	retryCount = 0,
): HttpResponse<Response> {
	const {
		retries = DEFAULT_RETRIES,
		retryDelay = DEFAULT_RETRY_DELAY,
		timeout = DEFAULT_TIMEOUT,
		fetch = globalThis.fetch,
		...requestInit
	} = init;

	// Collect signals to manage request abortion
	const signals: AbortSignal[] = [];
	if (requestInit.signal) {
		signals.push(requestInit.signal);
	}
	const controller = new AbortController();
	signals.push(controller.signal);
	requestInit.signal = mergeSignals(signals);

	// Set up a timeout to abort the request if it takes too long
	const timeoutId = setTimeout(
		() => controller.abort(TIMEOUT_MESSAGE),
		timeout,
	);

	try {
		// Perform the HTTP request
		const response = await fetch(url, requestInit);

		// Handle success fetch but unsuccessfull server response
		if (!response.ok) {
			switch (response.status) {
				case 400:
					return failure(new BadRequestError(response));
				case 401:
					return failure(new UnauthorizedError(response));
				case 403:
					return failure(new ForbiddenError(response));
				case 404:
					return failure(new NotFoundError(response));
				case 500:
					return failure(new InternalServerError(response));
				default:
					return failure(new ServerError(response));
			}
		}
		// Return the successful response
		return success(response);
	} catch (err) {
		// Handle different types of errors
		if (typeof err === "string") {
			// Handle abort errors (timeout or manual abort)
			if (err.includes(TIMEOUT_MESSAGE)) {
				// Retry the request if retries are available
				if (retryCount < retries) {
					await delay(retryDelay * 2 ** retryCount);
					return await httpRequest(url, init, retryCount + 1);
				}
				// Return timeout error if no retries are left
				return failure(new TimeoutError(TIMEOUT_MESSAGE));
			}

			// Return generic abort error
			return failure(new AbortError(err));
		}

		if (err instanceof DOMException && err.name === "AbortError") {
			// Return specific abort error for DOMException
			return failure(new AbortError(err.message));
		}

		if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
			// Retry the request if retries are available
			if (retryCount < retries) {
				await delay(retryDelay * 2 ** retryCount);
				return await httpRequest(url, init, retryCount + 1);
			}
			// Return connection error if no retries are left
			return failure(new ConnectionError(err.message, { cause: err }));
		}

		// Return generic client error for unknown errors
		return failure(new ClientError("Unknown error", { cause: err }));
	} finally {
		// Clear the timeout to prevent memory leaks
		clearTimeout(timeoutId);
	}
}

/**
 * Merges multiple AbortSignals into a single AbortSignal.
 *
 * @param signals - An array of AbortSignals to merge.
 * @returns A merged AbortSignal that represents all the input signals.
 */
function mergeSignals(signals: readonly AbortSignal[]): AbortSignal {
	const controller = new AbortController();
	const onAbort = () => controller.abort();

	for (const signal of signals) {
		if (signal.aborted) {
			controller.abort(signal.reason);
		} else {
			signal.addEventListener("abort", onAbort, { once: true });
		}
	}

	const cleanup = () => {
		for (const signal of signals) {
			signal.removeEventListener("abort", onAbort);
		}
	};

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
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

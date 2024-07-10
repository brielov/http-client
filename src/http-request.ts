import { failure, success, type HttpResponse } from "./common";
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

const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY = 500;
const DEFAULT_TIMEOUT = 10_000;
const TIMEOUT_MESSAGE = "Request timed out";

interface Options {
	retries?: number;
	retryDelay?: number;
	timeout?: number;
}

export async function httpRequest(
	url: URL,
	init: RequestInit,
	options: Options,
	retryCount = 0,
): HttpResponse<Response> {
	const {
		retries = DEFAULT_RETRIES,
		retryDelay = DEFAULT_RETRY_DELAY,
		timeout = DEFAULT_TIMEOUT,
	} = options;
	const signals: AbortSignal[] = [];
	if (init.signal) {
		signals.push(init.signal);
	}
	const controller = new AbortController();
	signals.push(controller.signal);
	init.signal = mergeSignals(signals);

	const timeoutId = setTimeout(
		() => controller.abort(TIMEOUT_MESSAGE),
		timeout,
	);

	try {
		const response = await fetch(url, init);

		// Handle success fetch but unsuccessfull server response
		if (!response.ok) {
			switch (response.status) {
				case 400:
					return failure(new BadRequestError("Bad Request", response));
				case 401:
					return failure(new UnauthorizedError("Unauthorized", response));
				case 403:
					return failure(new ForbiddenError("Forbidden", response));
				case 404:
					return failure(new NotFoundError("Not Found", response));
				case 500:
					return failure(
						new InternalServerError("Internal Server Error", response),
					);
				default:
					return failure(
						new ServerError(
							`Server responded with status: ${response.status}`,
							response,
						),
					);
			}
		}
		return success(response);
	} catch (err) {
		if (typeof err === "string") {
			// The only type of error that comes out as `string` is one that comes from
			// an abort controller with a reason, as far as I know.

			if (err.includes(TIMEOUT_MESSAGE)) {
				if (retryCount < retries) {
					await delay(retryDelay * 2 ** retryCount);
					return await httpRequest(url, init, options, retryCount + 1);
				}
				return failure(new TimeoutError(TIMEOUT_MESSAGE));
			}

			return failure(new AbortError(err));
		}

		if (err instanceof DOMException && err.name === "AbortError") {
			return failure(new AbortError(err.message));
		}

		if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
			if (retryCount < retries) {
				await delay(retryDelay * 2 ** retryCount);
				return await httpRequest(url, init, options, retryCount + 1);
			}
			return failure(new ConnectionError(err.message, { cause: err }));
		}

		return failure(new ClientError("Unknown error", { cause: err }));
	} finally {
		clearTimeout(timeoutId);
	}
}

function mergeSignals(signals: readonly AbortSignal[]): AbortSignal {
	const controller = new AbortController();
	for (const signal of signals) {
		signal.onabort = () => controller.abort(signal.reason);
	}
	return controller.signal;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

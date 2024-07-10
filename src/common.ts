import type { HttpError } from "./http-error";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Fetch = typeof fetch;

export type JSONValue =
	| string
	| number
	| boolean
	| { [x: string]: JSONValue }
	| Array<JSONValue>;

export interface HttpOptions {
	baseUrl?: string;
	cache?: RequestCache;
	credentials?: RequestCredentials;
	fetch?: Fetch;
	headers?: HeadersInit | ((headers: Headers) => void);
	integrity?: string;
	keepalive?: boolean;
	mode?: RequestMode;
	priority?: RequestPriority;
	redirect?: RequestRedirect;
	referrerPolicy?: ReferrerPolicy;
	referrer?: string;
	retries?: number;
	retryDelay?: number;
	timeout?: number;
}

export type RequestOptions = Omit<HttpOptions, "baseUrl">;

export type Success<T> = { readonly success: true; readonly data: T };
export type Failure<E> = { readonly success: false; readonly error: E };
export type Result<T, E> = Success<T> | Failure<E>;

export type HttpResponse<T> = Promise<Result<T, HttpError>>;

export function success<T>(data: T): Success<T> {
	return { success: true, data };
}

export function failure<E>(error: E): Failure<E> {
	return { success: false, error };
}

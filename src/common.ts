import type { HttpError } from "./http-error";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Fetch = typeof fetch;

export type JSONValue =
	| string
	| number
	| boolean
	| { [x: string]: JSONValue }
	| Array<JSONValue>;

export interface HttpInit extends Omit<RequestInit, "headers"> {
	baseUrl?: string;
	fetch?: Fetch;
	headers?: HeadersInit | ((headers: Headers) => void);
	retries?: number;
	retryDelay?: number;
	timeout?: number;
}

export interface HttpRequestInit extends Omit<HttpInit, "baseUrl" | "headers"> {
	headers?: HeadersInit;
}

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

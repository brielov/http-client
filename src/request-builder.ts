import type { output, ZodType } from "zod";
import type { HttpInit, HttpMethod, HttpResponse, JSONValue } from "./common";
import { ResponseBuilder } from "./response-builder";

export type RequestBuilderWithoutBody = Omit<RequestBuilder, "body">;

/**
 * The RequestBuilder class provides a fluent API for configuring and executing HTTP requests.
 */
export class RequestBuilder {
	#method: HttpMethod;
	#url: URL;
	#body?: BodyInit;
	#headers: Headers;
	#signal?: AbortSignal;
	#init: HttpInit;
	#setHeaders?: (headers: Headers) => void;

	/**
	 * Creates an instance of RequestBuilder.
	 * @param method The HTTP method for the request (e.g., GET, POST).
	 * @param url The URL for the request.
	 * @param init The request options, including headers, retries, etc.
	 */
	constructor(method: HttpMethod, url: URL, init: HttpInit) {
		const { headers, ...rest } = init;

		this.#method = method;
		this.#init = rest;
		this.#url = url;

		if (typeof headers === "function") {
			this.#headers = new Headers();
			this.#setHeaders = headers;
		} else {
			this.#headers = new Headers(headers);
		}
	}

	/**
	 * Returns the URL of the request.
	 * @returns A new URL object representing the request URL.
	 */
	get url(): URL {
		return new URL(this.#url);
	}

	/**
	 * Sends the request and returns the response body as an ArrayBuffer.
	 * @returns An HttpResponse containing an ArrayBuffer.
	 */
	arrayBuffer(): HttpResponse<ArrayBuffer> {
		return this.build().arrayBuffer();
	}

	/**
	 * Sends the request and returns the response body as a Blob.
	 * @returns An HttpResponse containing a Blob.
	 */
	blob(): HttpResponse<Blob> {
		return this.build().blob();
	}

	/**
	 * Sets the request body.
	 * @param value The body content, which can be of various types (e.g., string, JSON, FormData).
	 * @returns The current instance of RequestBuilder.
	 */
	body(value: BodyInit | JSONValue): this {
		if (value instanceof ArrayBuffer) {
			this.#body = value;
			this.#headers.set("content-length", String(value.byteLength));
		} else if (value instanceof Blob) {
			this.#body = value;
			this.#headers.set("content-length", String(value.size));
			this.#headers.set(
				"content-type",
				value.type || "application/octet-stream",
			);
		} else if (value instanceof ReadableStream) {
			this.#body = value;
			// Content-Length for stream can't be set; it's indeterminate
		} else if (value instanceof FormData) {
			this.#body = value;
			// Content-Length for FormData can't be set; it's managed by the browser
		} else if (value instanceof URLSearchParams) {
			this.#body = value;
			this.#headers.set(
				"content-type",
				"application/x-www-form-urlencoded;charset=UTF-8",
			);
		} else if (typeof value === "string") {
			this.#body = value;
			this.#headers.set("content-length", String(value.length));
			if (!this.#headers.has("content-type")) {
				this.#headers.set("content-type", "text/plain;charset=UTF-8");
			}
		} else {
			const json = JSON.stringify(value);
			this.#body = json;
			this.#headers.set("content-length", String(json.length));
			if (!this.#headers.has("content-type")) {
				this.#headers.set("content-type", "application/json;charset=utf-8");
			}
		}
		return this;
	}

	/**
	 * Builds the request and returns a ResponseBuilder instance.
	 * @returns A ResponseBuilder instance for executing the request.
	 */
	build(): ResponseBuilder {
		return new ResponseBuilder(this, this.#init);
	}

	/**
	 * Sets the request cache mode.
	 * @param value The cache mode (e.g., 'default', 'no-store').
	 * @returns The current instance of RequestBuilder.
	 */
	cache(value: RequestCache): this {
		this.#init.cache = value;
		return this;
	}

	/**
	 * Sets the request credentials mode.
	 * @param value The credentials mode (e.g., 'include', 'same-origin').
	 * @returns The current instance of RequestBuilder.
	 */
	credentials(value: RequestCredentials): this {
		this.#init.credentials = value;
		return this;
	}

	/**
	 * Sends the request and returns the response body as FormData.
	 * @returns An HttpResponse containing FormData.
	 */
	formData(): HttpResponse<FormData> {
		return this.build().formData();
	}

	/**
	 * Sets a header for the request.
	 * @param key The header name.
	 * @param value The header value.
	 * @param append Whether to append the header value (default is false, which sets the value).
	 * @returns The current instance of RequestBuilder.
	 */
	header(key: string, value: string | number, append?: boolean): this {
		const val = String(value);
		if (append) {
			this.#headers.append(key, val);
		} else {
			this.#headers.set(key, val);
		}
		return this;
	}

	/**
	 * Sets the request integrity value.
	 * @param value The integrity string.
	 * @returns The current instance of RequestBuilder.
	 */
	integrity(value: string): this {
		this.#init.integrity = value;
		return this;
	}

	/**
	 * Sends the request and returns the response body as JSON, validated by a schema.
	 * @param schema The Zod schema to validate the JSON response.
	 * @returns An HttpResponse containing the validated JSON data.
	 */
	json<T extends ZodType>(schema: T): HttpResponse<output<T>> {
		return this.build().json(schema);
	}

	/**
	 * Sets whether the request should be keepalive.
	 * @param value Whether to enable keepalive (default is true).
	 * @returns The current instance of RequestBuilder.
	 */
	keepalive(value = true): this {
		this.#init.keepalive = value;
		return this;
	}

	/**
	 * Sets the request mode.
	 * @param value The request mode (e.g., 'cors', 'no-cors').
	 * @returns The current instance of RequestBuilder.
	 */
	mode(value: RequestMode): this {
		this.#init.mode = value;
		return this;
	}

	/**
	 * Adds a query parameter to the request URL.
	 * @param key The parameter name.
	 * @param value The parameter value.
	 * @param append Whether to append the parameter value (default is false, which sets the value).
	 * @returns The current instance of RequestBuilder.
	 */
	param(key: string, value: string | number, append?: boolean): this {
		const val = String(value);
		if (append) {
			this.#url.searchParams.append(key, val);
		} else {
			this.#url.searchParams.set(key, val);
		}
		return this;
	}

	/**
	 * Sets the request priority.
	 * @param value The request priority.
	 * @returns The current instance of RequestBuilder.
	 */
	priority(value: RequestPriority): this {
		this.#init.priority = value;
		return this;
	}

	/**
	 * Sets the request redirect mode.
	 * @param value The redirect mode (default is 'follow').
	 * @returns The current instance of RequestBuilder.
	 */
	redirect(value: RequestRedirect = "follow"): this {
		this.#init.redirect = value;
		return this;
	}

	/**
	 * Sets the request referrer policy.
	 * @param value The referrer policy.
	 * @returns The current instance of RequestBuilder.
	 */
	referrerPolicy(value: ReferrerPolicy): this {
		this.#init.referrerPolicy = value;
		return this;
	}

	/**
	 * Sets the request referrer.
	 * @param value The referrer URL.
	 * @returns The current instance of RequestBuilder.
	 */
	referrer(value: string): this {
		this.#init.referrer = value;
		return this;
	}

	/**
	 * Sends the request and returns the Response object.
	 * @returns An HttpResponse containing the Response object.
	 */
	response(): HttpResponse<Response> {
		return this.build().response();
	}

	/**
	 * Sets the number of retries for the request.
	 * @param value The number of retries.
	 * @returns The current instance of RequestBuilder.
	 */
	retries(value: number): this {
		this.#init.retries = value;
		return this;
	}

	/**
	 * Sets the delay between retries for the request.
	 * @param value The retry delay in milliseconds.
	 * @returns The current instance of RequestBuilder.
	 */
	retryDelay(value: number): this {
		this.#init.retryDelay = value;
		return this;
	}

	/**
	 * Sets the AbortSignal or AbortController for the request.
	 * @param value The AbortSignal or AbortController instance.
	 * @returns The current instance of RequestBuilder.
	 */
	signal(value: AbortController | AbortSignal): this {
		if (value instanceof AbortController) {
			this.#signal = value.signal;
		} else {
			this.#signal = value;
		}
		return this;
	}

	/**
	 * Sends the request and returns the response body as a ReadableStream.
	 * @returns An HttpResponse containing a ReadableStream of Uint8Array.
	 */
	stream(): HttpResponse<ReadableStream<Uint8Array>> {
		return this.build().stream();
	}

	/**
	 * Sends the request and returns the response body as text.
	 * @returns An HttpResponse containing the response text.
	 */
	text(): HttpResponse<string> {
		return this.build().text();
	}

	/**
	 * Sets the timeout for the request.
	 * @param value The timeout duration in milliseconds.
	 * @returns The current instance of RequestBuilder.
	 */
	timeout(value: number): this {
		this.#init.timeout = value;
		return this;
	}

	/**
	 * Converts the RequestBuilder instance to a Request object.
	 * @returns A Request object representing the HTTP request.
	 */
	toRequest(): Request {
		const url = this.#url;
		const init = this.toRequestInit();
		return new Request(url, init);
	}

	/**
	 * Converts the RequestBuilder instance to a RequestInit object.
	 * @returns A RequestInit object representing the HTTP request initialization options.
	 */
	toRequestInit(): RequestInit {
		const body = this.#body;
		const headers = this.#headers;
		const method = this.#method;
		const signal = this.#signal;

		const {
			cache,
			credentials,
			integrity,
			keepalive,
			mode,
			priority,
			redirect,
			referrer,
			referrerPolicy,
		} = this.#init;

		this.#setHeaders?.(headers);

		return {
			body,
			cache,
			credentials,
			headers,
			integrity,
			keepalive,
			method,
			mode,
			priority,
			redirect,
			referrer,
			referrerPolicy,
			signal,
		};
	}

	/**
	 * Sends the request and returns the raw JSON response body without validation.
	 * @returns An HttpResponse containing the JSON response.
	 */
	unsafeJson(): HttpResponse<JSONValue> {
		return this.build().unsafeJson();
	}
}

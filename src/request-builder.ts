import type { output, ZodType } from "zod";
import type {
	HttpMethod,
	HttpResponse,
	JSONValue,
	RequestOptions,
} from "./common";
import { ResponseBuilder } from "./response-builder";

export type RequestBuilderWithoutBody = Omit<RequestBuilder, "body">;

export class RequestBuilder {
	#method: HttpMethod;
	#url: URL;
	#body?: BodyInit;
	#headers: Headers;
	#signal?: AbortSignal;
	#options: RequestOptions;
	#setHeaders?: (headers: Headers) => void;

	constructor(method: HttpMethod, url: URL, options: RequestOptions) {
		const { headers, ...rest } = options;

		this.#method = method;
		this.#options = rest;
		this.#url = url;

		if (typeof headers === "function") {
			this.#headers = new Headers();
			this.#setHeaders = headers;
		} else {
			this.#headers = new Headers(headers);
		}
	}

	get url(): URL {
		return new URL(this.#url);
	}

	arrayBuffer(): HttpResponse<ArrayBuffer> {
		return this.build().arrayBuffer();
	}

	blob(): HttpResponse<Blob> {
		return this.build().blob();
	}

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

	build(): ResponseBuilder {
		return new ResponseBuilder(this, { ...this.#options });
	}

	cache(value: RequestCache): this {
		this.#options.cache = value;
		return this;
	}

	credentials(value: RequestCredentials): this {
		this.#options.credentials = value;
		return this;
	}

	formData(): HttpResponse<FormData> {
		return this.build().formData();
	}

	header(key: string, value: string | number, append?: boolean): this {
		const val = String(value);
		if (append) {
			this.#headers.append(key, val);
		} else {
			this.#headers.set(key, val);
		}
		return this;
	}

	integrity(value: string): this {
		this.#options.integrity = value;
		return this;
	}

	json<T extends ZodType>(schema: T): HttpResponse<output<T>> {
		return this.build().json(schema);
	}

	keepalive(value = true): this {
		this.#options.keepalive = value;
		return this;
	}

	mode(value: RequestMode): this {
		this.#options.mode = value;
		return this;
	}

	param(key: string, value: string | number, append?: boolean): this {
		const val = String(value);
		if (append) {
			this.#url.searchParams.append(key, val);
		} else {
			this.#url.searchParams.set(key, val);
		}
		return this;
	}

	priority(value: RequestPriority): this {
		this.#options.priority = value;
		return this;
	}

	redirect(value: RequestRedirect = "follow"): this {
		this.#options.redirect = value;
		return this;
	}

	referrerPolicy(value: ReferrerPolicy): this {
		this.#options.referrerPolicy = value;
		return this;
	}

	referrer(value: string): this {
		this.#options.referrer = value;
		return this;
	}

	response(): HttpResponse<Response> {
		return this.build().response();
	}

	retries(value: number): this {
		this.#options.retries = value;
		return this;
	}

	retryDelay(value: number): this {
		this.#options.retryDelay = value;
		return this;
	}

	signal(value: AbortController | AbortSignal): this {
		if (value instanceof AbortController) {
			this.#signal = value.signal;
		} else {
			this.#signal = value;
		}
		return this;
	}

	stream(): HttpResponse<ReadableStream<Uint8Array>> {
		return this.build().stream();
	}

	text(): HttpResponse<string> {
		return this.build().text();
	}

	timeout(value: number): this {
		this.#options.timeout = value;
		return this;
	}

	toRequest(): Request {
		const url = this.#url;
		const init = this.toRequestInit();
		return new Request(url, init);
	}

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
		} = this.#options;

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

	unsafeJson(): HttpResponse<JSONValue> {
		return this.build().unsafeJson();
	}
}

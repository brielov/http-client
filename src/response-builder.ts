import type { output, ZodType } from "zod";
import {
	failure,
	success,
	type HttpInit,
	type HttpResponse,
	type JSONValue,
} from "./common";
import { type HttpError, ParseBodyError, ValidationError } from "./http-error";
import { httpRequest } from "./http-request";
import type { RequestBuilder } from "./request-builder";

/**
 * The ResponseBuilder class handles the execution of HTTP requests and processes the responses.
 */
export class ResponseBuilder {
	#builder: RequestBuilder;
	#init: HttpInit;

	/**
	 * Creates an instance of ResponseBuilder.
	 * @param builder The RequestBuilder instance used to create the request.
	 * @param init The request options, including retries, retry delay, and timeout.
	 */
	constructor(builder: RequestBuilder, init: HttpInit) {
		this.#builder = builder;
		this.#init = init;
	}

	/**
	 * Handles the response from an HTTP request.
	 * @param parseResponse A function to parse the response.
	 * @param parseError A function to parse errors.
	 * @returns An HttpResponse containing the parsed response or an error.
	 */
	async #handleResponse<T>(
		parseResponse: (response: Response) => Promise<T>,
		parseError: (err: unknown) => HttpError,
	): HttpResponse<T> {
		const result = await this.response();
		if (!result.success) return result;
		try {
			const data = await parseResponse(result.data);
			return success(data);
		} catch (err) {
			return failure(parseError(err));
		}
	}

	/**
	 * Executes the HTTP request and returns the Response object.
	 * @returns An HttpResponse containing the Response object.
	 */
	async response(): HttpResponse<Response> {
		const url = this.#builder.url;
		const init = this.#builder.toRequestInit();
		return httpRequest(url, {
			...init,
			retries: this.#init.retries,
			retryDelay: this.#init.retryDelay,
			timeout: this.#init.timeout,
		});
	}

	/**
	 * Executes the HTTP request and returns the response body as an ArrayBuffer.
	 * @returns An HttpResponse containing an ArrayBuffer.
	 */
	async arrayBuffer(): HttpResponse<ArrayBuffer> {
		return this.#handleResponse(
			(response) => response.arrayBuffer(),
			(err) =>
				new ParseBodyError("Failed to parse body as array buffer", {
					cause: err,
				}),
		);
	}

	/**
	 * Executes the HTTP request and returns the response body as a Blob.
	 * @returns An HttpResponse containing a Blob.
	 */
	async blob(): HttpResponse<Blob> {
		return this.#handleResponse(
			(response) => response.blob(),
			(err) =>
				new ParseBodyError("Failed to parse body as blob", { cause: err }),
		);
	}

	/**
	 * Executes the HTTP request and returns the response body as FormData.
	 * @returns An HttpResponse containing FormData.
	 */
	async formData(): HttpResponse<FormData> {
		return this.#handleResponse(
			(response) => response.formData(),
			(err) =>
				new ParseBodyError("Failed to parse body as form data", { cause: err }),
		);
	}

	/**
	 * Executes the HTTP request, parses the response body as JSON, and validates it using the provided schema.
	 * @param schema The Zod schema to validate the JSON response.
	 * @returns An HttpResponse containing the validated JSON data.
	 */
	async json<T extends ZodType>(schema: T): HttpResponse<output<T>> {
		const result = await this.unsafeJson();
		if (!result.success) return result;
		const parseResult = await schema.safeParseAsync(result.data);
		if (!parseResult.success) {
			return failure(new ValidationError(parseResult.error));
		}
		return success(parseResult.data);
	}

	/**
	 * Executes the HTTP request and returns the response body as a ReadableStream.
	 * @returns An HttpResponse containing a ReadableStream of Uint8Array.
	 */
	async stream(): HttpResponse<ReadableStream<Uint8Array>> {
		const result = await this.response();
		if (!result.success) return result;
		const response = result.data;
		const body =
			response.body ??
			new ReadableStream({
				start(controller) {
					controller.close();
				},
			});
		return success(body);
	}

	/**
	 * Executes the HTTP request and returns the response body as text.
	 * @returns An HttpResponse containing the response text.
	 */
	async text(): HttpResponse<string> {
		return this.#handleResponse(
			(response) => response.text(),
			(err) =>
				new ParseBodyError("Failed to parse body as text", { cause: err }),
		);
	}

	/**
	 * Executes the HTTP request and returns the raw JSON response body without validation.
	 * @returns An HttpResponse containing the JSON response.
	 */
	async unsafeJson(): HttpResponse<JSONValue> {
		return this.#handleResponse(
			(response) => response.json(),
			(err) =>
				new ParseBodyError("Failed to parse body as json", { cause: err }),
		);
	}
}

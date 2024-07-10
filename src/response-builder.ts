import type { output, ZodType } from "zod";
import {
	failure,
	success,
	type HttpResponse,
	type JSONValue,
	type RequestOptions,
} from "./common";
import { HttpError, ParseBodyError, ValidationError } from "./http-error";
import { httpRequest } from "./http-request";
import type { RequestBuilder } from "./request-builder";

export class ResponseBuilder {
	#builder: RequestBuilder;
	#options: RequestOptions;

	constructor(builder: RequestBuilder, options: RequestOptions) {
		this.#builder = builder;
		this.#options = options;
	}

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

	async response(): HttpResponse<Response> {
		const url = this.#builder.url;
		const init = this.#builder.toRequestInit();
		return httpRequest(url, init, {
			retries: this.#options.retries,
			retryDelay: this.#options.retryDelay,
			timeout: this.#options.timeout,
		});
	}

	async arrayBuffer(): HttpResponse<ArrayBuffer> {
		return this.#handleResponse(
			(response) => response.arrayBuffer(),
			(err) =>
				new ParseBodyError("Failed to parse body as array buffer", {
					cause: err,
				}),
		);
	}

	async blob(): HttpResponse<Blob> {
		return this.#handleResponse(
			(response) => response.blob(),
			(err) =>
				new ParseBodyError("Failed to parse body as blob", { cause: err }),
		);
	}

	async formData(): HttpResponse<FormData> {
		return this.#handleResponse(
			(response) => response.formData(),
			(err) =>
				new ParseBodyError("Failed to parse body as form data", { cause: err }),
		);
	}

	async json<T extends ZodType>(schema: T): HttpResponse<output<T>> {
		const result = await this.unsafeJson();
		if (!result.success) return result;
		const parseResult = await schema.safeParseAsync(result.data);
		if (!parseResult.success) {
			return failure(new ValidationError(parseResult.error));
		}
		return success(parseResult.data);
	}

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

	async text(): HttpResponse<string> {
		return this.#handleResponse(
			(response) => response.text(),
			(err) =>
				new ParseBodyError("Failed to parse body as text", { cause: err }),
		);
	}

	async unsafeJson(): HttpResponse<JSONValue> {
		return this.#handleResponse(
			(response) => response.json(),
			(err) =>
				new ParseBodyError("Failed to parse body as json", { cause: err }),
		);
	}
}

import type { output, ZodType } from "zod";
import {
	failure,
	success,
	type HttpResponse,
	type RequestOptions,
} from "./common";
import { ParseBodyError, ValidationError } from "./http-error";
import { httpRequest } from "./http-request";
import type { RequestBuilder } from "./request-builder";

export class ResponseBuilder {
	#builder: RequestBuilder;
	#options: RequestOptions;

	constructor(builder: RequestBuilder, options: RequestOptions) {
		this.#builder = builder;
		this.#options = options;
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
		const result = await this.response();
		if (!result.success) return result;
		try {
			const arrayBuffer = await result.data.arrayBuffer();
			return success(arrayBuffer);
		} catch (err) {
			return failure(
				new ParseBodyError("Failed to parse body as array buffer", {
					cause: err,
				}),
			);
		}
	}

	async blob(): HttpResponse<Blob> {
		const result = await this.response();
		if (!result.success) return result;
		try {
			const blob = await result.data.blob();
			return success(blob);
		} catch (err) {
			return failure(
				new ParseBodyError("Failed to parse body as blob", { cause: err }),
			);
		}
	}

	async formData(): HttpResponse<FormData> {
		const result = await this.response();
		if (!result.success) return result;
		try {
			const formData = await result.data.formData();
			return success(formData);
		} catch (err) {
			return failure(
				new ParseBodyError("Failed to parse body as form data", { cause: err }),
			);
		}
	}

	async json<T extends ZodType>(schema: T): HttpResponse<output<T>> {
		const result = await this.response();
		if (!result.success) return result;
		try {
			const json = await result.data.json();
			const parseResult = await schema.safeParseAsync(json);
			if (!parseResult.success) {
				return failure(new ValidationError(parseResult.error));
			}
			return success(parseResult.data);
		} catch (err) {
			return failure(
				new ParseBodyError("Failed to parse body as json", { cause: err }),
			);
		}
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
		const result = await this.response();
		if (!result.success) return result;
		try {
			const text = await result.data.text();
			return success(text);
		} catch (err) {
			return failure(
				new ParseBodyError("Failed to parse body as text", { cause: err }),
			);
		}
	}
}

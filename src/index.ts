import type { HttpInit, HttpMethod } from "./common";
import {
	RequestBuilder,
	type RequestBuilderWithoutBody,
} from "./request-builder";
import { buildPath } from "./util";

export * from "./http-error";

export type { HttpInit, HttpResponse } from "./common";

/**
 * The Http class provides a convenient interface for making HTTP requests.
 * You can use this class to configure default options and create request builders for various HTTP methods.
 */
export class Http {
	#options: HttpInit;

	/**
	 * A shared instance of the Http class with default options.
	 * This can be used for making requests without creating a new instance.
	 */
	static shared: Http = new Http();

	/**
	 * Creates a new Http instance with optional default options.
	 * @param {HttpOptions} [options] - Optional default options for all requests made using this instance.
	 */
	constructor(options?: HttpInit) {
		this.#options = options ?? {};
	}

	#build(
		method: HttpMethod,
		pathnames: readonly (string | number)[],
	): RequestBuilder {
		const { baseUrl, ...options } = this.#options;
		const pathname = buildPath(pathnames);
		const url = new URL(pathname, baseUrl);
		return new RequestBuilder(method, url, options);
	}

	/**
	 * Creates a request builder for a GET request.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilderWithoutBody} A request builder for configuring and executing the GET request.
	 */
	get(...pathnames: readonly (string | number)[]): RequestBuilderWithoutBody {
		return this.#build("GET", pathnames);
	}

	/**
	 * Creates a request builder for a POST request.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilder} A request builder for configuring and executing the POST request.
	 */
	post(...pathnames: readonly (string | number)[]): RequestBuilder {
		return this.#build("POST", pathnames);
	}

	/**
	 * Creates a request builder for a PUT request.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilder} A request builder for configuring and executing the PUT request.
	 */
	put(...pathnames: readonly (string | number)[]): RequestBuilder {
		return this.#build("PUT", pathnames);
	}

	/**
	 * Creates a request builder for a PATCH request.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilder} A request builder for configuring and executing the PATCH request.
	 */
	patch(...pathnames: readonly (string | number)[]): RequestBuilder {
		return this.#build("PATCH", pathnames);
	}

	/**
	 * Creates a request builder for a DELETE request.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilderWithoutBody} A request builder for configuring and executing the DELETE request.
	 */
	delete(
		...pathnames: readonly (string | number)[]
	): RequestBuilderWithoutBody {
		return this.#build("DELETE", pathnames);
	}

	/**
	 * A static method to create a GET request using the shared instance.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilderWithoutBody} A request builder for configuring and executing the GET request.
	 */
	static get(
		...pathnames: readonly (string | number)[]
	): RequestBuilderWithoutBody {
		return Http.shared.get(...pathnames);
	}

	/**
	 * A static method to create a POST request using the shared instance.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilder} A request builder for configuring and executing the POST request.
	 */
	static post(...pathnames: readonly (string | number)[]): RequestBuilder {
		return Http.shared.post(...pathnames);
	}

	/**
	 * A static method to create a PUT request using the shared instance.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilder} A request builder for configuring and executing the PUT request.
	 */
	static put(...pathnames: readonly (string | number)[]): RequestBuilder {
		return Http.shared.put(...pathnames);
	}

	/**
	 * A static method to create a PATCH request using the shared instance.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilder} A request builder for configuring and executing the PATCH request.
	 */
	static patch(...pathnames: readonly (string | number)[]): RequestBuilder {
		return Http.shared.patch(...pathnames);
	}

	/**
	 * A static method to create a DELETE request using the shared instance.
	 * @param {...(string | number)} pathnames - Path segments to build the URL.
	 * @returns {RequestBuilderWithoutBody} A request builder for configuring and executing the DELETE request.
	 */
	static delete(
		...pathnames: readonly (string | number)[]
	): RequestBuilderWithoutBody {
		return Http.shared.delete(...pathnames);
	}
}

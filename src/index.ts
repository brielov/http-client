import type { HttpMethod, HttpOptions } from "./common";
import {
	RequestBuilder,
	type RequestBuilderWithoutBody,
} from "./request-builder";

export class Http {
	#options: HttpOptions;

	constructor(options?: HttpOptions) {
		this.#options = options ?? {};
	}

	#build(
		method: HttpMethod,
		pathnames: readonly (string | number)[],
	): RequestBuilder {
		const pathname = buildPath(pathnames);
		const { baseUrl, ...options } = this.#options;
		const url = new URL(pathname, baseUrl);
		return new RequestBuilder(method, url, options);
	}

	get(...pathnames: readonly (string | number)[]): RequestBuilderWithoutBody {
		return this.#build("GET", pathnames);
	}

	post(...pathnames: readonly (string | number)[]): RequestBuilder {
		return this.#build("POST", pathnames);
	}

	put(...pathnames: readonly (string | number)[]): RequestBuilder {
		return this.#build("PUT", pathnames);
	}

	patch(...pathnames: readonly (string | number)[]): RequestBuilder {
		return this.#build("PATCH", pathnames);
	}

	delete(
		...pathnames: readonly (string | number)[]
	): RequestBuilderWithoutBody {
		return this.#build("DELETE", pathnames);
	}

	static get(
		...pathnames: readonly (string | number)[]
	): RequestBuilderWithoutBody {
		return new Http().get(...pathnames);
	}

	static post(...pathnames: readonly (string | number)[]): RequestBuilder {
		return new Http().post(...pathnames);
	}

	static put(...pathnames: readonly (string | number)[]): RequestBuilder {
		return new Http().put(...pathnames);
	}

	static patch(...pathnames: readonly (string | number)[]): RequestBuilder {
		return new Http().patch(...pathnames);
	}

	static delete(
		...pathnames: readonly (string | number)[]
	): RequestBuilderWithoutBody {
		return new Http().delete(...pathnames);
	}
}

function buildPath(segments: readonly (string | number)[]): string {
	const pathname: string[] = [];
	for (let seg of segments) {
		if (typeof seg === "number") {
			pathname.push(String(seg));
			continue;
		}
		seg = seg.trim();
		if (seg === "") continue;
		if (seg.startsWith("/")) {
			seg = seg.slice(1);
		}
		if (seg.endsWith("/")) {
			seg = seg.slice(0, -1);
		}
		pathname.push(seg);
	}
	return pathname.join("/");
}

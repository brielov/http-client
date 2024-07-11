import { describe, test, expect } from "bun:test";
import { RequestBuilder } from "../src/request-builder";
import { ResponseBuilder } from "../src/response-builder";

const url = new URL("https://example.com");

describe("RequestBuilder", () => {
	describe("body()", () => {
		test("of arrayBuffer should set correct headers", () => {
			const init = new RequestBuilder("GET", url, {})
				.body(new ArrayBuffer(10))
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(init.body).toBeInstanceOf(ArrayBuffer);
			expect(headers.get("content-length")).toEqual("10");
		});

		test("of blob with content-type should set correct headers", () => {
			const blob = new Blob(["foo bar"], { type: "text/markdown" });
			const init = new RequestBuilder("GET", url, {})
				.body(blob)
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(headers.get("content-length")).toEqual(String(blob.size));
			expect(headers.get("content-type"), "text/markdown");
		});

		test("of blob without content-type should set correct headers", () => {
			const blob = new Blob(["foo bar"]);
			const init = new RequestBuilder("GET", url, {})
				.body(blob)
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(init.body).toBeInstanceOf(Blob);
			expect(headers.get("content-length")).toEqual(String(blob.size));
			expect(headers.get("content-type"), "application/octet-stream");
		});

		test("of URLSearchParams should set correct headers", () => {
			const params = new URLSearchParams([
				["foo", "bar"],
				["baz", "qux"],
			]);
			const init = new RequestBuilder("GET", url, {})
				.body(params)
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(init.body).toBeInstanceOf(URLSearchParams);
			expect(headers.get("content-type")).toInclude(
				"application/x-www-form-urlencoded",
			);
		});

		test("of string should set correct headers", () => {
			const init = new RequestBuilder("GET", url, {})
				.body("foo bar")
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(init.body).toBeTypeOf("string");
			expect(headers.get("content-type")).toInclude("text/plain");
			expect(headers.get("content-length"), String("foo bar".length));
		});

		test("of json should stringify and set correct headers", () => {
			const json = { foo: "bar", baz: "qux" };
			const init = new RequestBuilder("GET", url, {})
				.body(json)
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(init.body).toBeTypeOf("string");
			expect(headers.get("content-type")).toInclude("application/json");
			expect(headers.get("content-length")).toEqual(
				String(JSON.stringify(json).length),
			);
		});
	});

	describe("build()", () => {
		test("creates a new ResponseBuilder", () => {
			const actual = new RequestBuilder("GET", url, {}).build();
			expect(actual).toBeInstanceOf(ResponseBuilder);
		});
	});

	describe("cache()", () => {
		test("sets the correct cache value", () => {
			const values: RequestCache[] = [
				"default",
				"force-cache",
				"no-cache",
				"no-store",
				"only-if-cached",
				"reload",
			];
			for (const val of values) {
				const actual = new RequestBuilder("GET", url, {})
					.cache(val)
					.toRequestInit();
				expect(actual.cache).toEqual(val);
			}
		});
	});

	describe("credentials()", () => {
		test("sets the correct credentials value", () => {
			const values: RequestCredentials[] = ["include", "omit", "same-origin"];
			for (const val of values) {
				const actual = new RequestBuilder("GET", url, {})
					.credentials(val)
					.toRequestInit();
				expect(actual.credentials).toEqual(val);
			}
		});
	});

	describe("header()", () => {
		test("sets headers", () => {
			const init = new RequestBuilder("GET", url, {})
				.header("foo", "foo")
				.header("bar", "bar")
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(headers.get("foo")).toEqual("foo");
			expect(headers.get("bar")).toEqual("bar");
		});

		test("handles append mode", () => {
			const init = new RequestBuilder("GET", url, {})
				.header("Set-Cookie", "foo")
				.header("Set-Cookie", "bar", true)
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(headers.getAll("Set-Cookie")).toEqual(["foo", "bar"]);
		});

		test("handles numeric values", () => {
			const init = new RequestBuilder("GET", url, {})
				.header("x-test", 1)
				.toRequestInit();
			const headers = new Headers(init.headers);
			expect(headers.get("x-test")).toEqual("1");
		});
	});

	describe("integrity()", () => {
		test("sets the correct integrity values", () => {
			const init = new RequestBuilder("GET", url, {})
				.integrity("test")
				.toRequestInit();
			expect(init.integrity).toEqual("test");
		});
	});

	describe("keepalive()", () => {
		test("sets the correct keepalive value", () => {
			const values = [true, false];
			for (const val of values) {
				const init = new RequestBuilder("GET", url, {})
					.keepalive(val)
					.toRequestInit();
				expect(init.keepalive).toEqual(val);
			}
		});
	});

	describe("mode()", () => {
		test("sets the correct mode value", () => {
			const values: RequestMode[] = [
				"cors",
				"navigate",
				"no-cors",
				"same-origin",
			];
			for (const val of values) {
				const init = new RequestBuilder("GET", url, {})
					.mode(val)
					.toRequestInit();
				expect(init.mode).toEqual(val);
			}
		});
	});
});

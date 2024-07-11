import { test, expect } from "bun:test";
import { buildPath, delay, mergeSignals } from "../src/util";

test("buildPath handles full urls", () => {
	const actual = buildPath(["https://api.example.com"]);
	expect(actual).toEqual("https://api.example.com");
});

test("buildPath handles multiple segments", () => {
	const actual = buildPath(["foo", "bar", "baz"]);
	expect(actual).toEqual("foo/bar/baz");
});

test("buildPath handles numbers", () => {
	const actual = buildPath(["foo", 1, "bar", 2]);
	expect(actual).toEqual("foo/1/bar/2");
});

test("buildPath handles leading slash", () => {
	const actual = buildPath(["/foo", "bar", "/baz"]);
	expect(actual).toEqual("foo/bar/baz");
});

test("buildPath handles trailing slash", () => {
	const actual = buildPath(["foo/", "bar", "baz/"]);
	expect(actual).toEqual("foo/bar/baz");
});

test("buildPath handles extra spaces", () => {
	const actual = buildPath([" foo", "bar ", "baz "]);
	expect(actual).toEqual("foo/bar/baz");
});

test("buildPath handles empty segments", () => {
	const actual = buildPath([" foo", "", "bar ", "", "baz "]);
	expect(actual).toEqual("foo/bar/baz");
});

test("mergeSignals handles signal a", async () => {
	const a = new AbortController();
	const b = new AbortController();
	const c = mergeSignals([a.signal, b.signal]);
	a.abort();
	await delay(1);
	expect(c.aborted).toBe(true);
});

test("mergeSignals handles signal b", async () => {
	const a = new AbortController();
	const b = new AbortController();
	const c = mergeSignals([a.signal, b.signal]);
	b.abort();
	await delay(1);
	expect(c.aborted).toBe(true);
});

test("mergeSignals propagates reason", async () => {
	const a = new AbortController();
	const b = new AbortController();
	const c = mergeSignals([a.signal, b.signal]);
	b.abort("foo bar");
	a.abort("bar baz");
	await delay(1);
	expect(c.reason).toEqual("foo bar");
});

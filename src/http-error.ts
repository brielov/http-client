import type { ZodError, ZodIssue } from "zod";

export class HttpError extends Error {
	name = "HttpError";
}

export class ServerError extends HttpError {
	name = "ServerError";

	constructor(readonly response: Response) {
		super(
			`Server responded with status ${response.status} ${response.statusText}`,
		);
	}
}

export class ClientError extends HttpError {
	name = "ClientError";
}

export class BadRequestError extends ServerError {
	name = "BadRequestError";
}

export class ForbiddenError extends ServerError {
	name = "ForbiddenError";
}

export class InternalServerError extends ServerError {
	name = "InternalServerError";
}

export class NotFoundError extends ServerError {
	name = "NotFoundError";
}

export class UnauthorizedError extends ServerError {
	name = "UnauthorizedError";
}

export class NetworkError extends ClientError {
	name = "NetworkError";
}

export class AbortError extends NetworkError {
	name = "AbortError";
}

export class ConnectionError extends NetworkError {
	name = "ConnectionError";
}

export class RetryError extends NetworkError {
	name = "RetryError";
}

export class TimeoutError extends NetworkError {
	name = "TimeoutError";
}

export class ParseBodyError extends ClientError {
	name = "ParseBodyError";
}

export class ValidationError extends ClientError {
	name = "ValidationError";

	readonly issues: readonly ZodIssue[];

	constructor(zodError: ZodError) {
		super(zodError.message, { cause: zodError });
		this.issues = zodError.issues;
	}
}

# HTTP Client Library

A powerful, flexible, and fluent HTTP client library for making HTTP requests in TypeScript.

## Features

- Simple, intuitive API
- Supports GET, POST, PUT, PATCH, DELETE methods
- Fluent API for building requests
- Customizable request options (headers, retries, timeouts, etc.)
- Supports response types: JSON, text, ArrayBuffer, Blob, FormData, ReadableStream
- Integrated with Zod for JSON schema validation

## Installation

```bash
npm install coming-soon
```

## Basic Usage

### Singleton Instance

The simplest way to use the library is via the singleton `Http` instance:

```ts
import { Http } from 'coming-soon';

const response = await Http.get('https://api.example.com/data').response();

if (response.success) {
    const data = await response.data.json();
    console.log(data);
} else {
    console.error('Request failed', response.error);
}
```

### Custom Instance

You can create a custom instance of the `Http` class with specific options:

```ts
import { Http } from 'coming-soon';

const customHttp = new Http({
    baseUrl: 'https://api.example.com',
    headers: {
        'Authorization': 'Bearer your-token',
    },
    retries: 3,
    timeout: 5000,
});

const response = await customHttp.get('data').response();

if (response.success) {
    const data = await response.data.json();
    console.log(data);
} else {
    console.error('Request failed', response.error);
}
```

## Fluent API

The library provides a fluent API for building requests:

```ts
import { Http } from 'coming-soon';

const response = await Http.post('https://api.example.com/data')
    .header('Authorization', 'Bearer your-token')
    .header('Content-Type', 'application/json')
    .body({ key: 'value' })
    .timeout(3000)
    .retries(2)
    .response();

if (response.success) {
    const data = await response.data.json();
    console.log(data);
} else {
    console.error('Request failed', response.error);
}
```

### Setting Headers

Headers can be set dynamically or statically:

```ts
import { Http } from 'coming-soon';

// Static headers
const response = await Http.get('https://api.example.com/data')
    .header('Authorization', 'Bearer your-token')
    .header('Accept', 'application/json')
    .response();

// Dynamic headers
const customHttp = new Http({
    headers: (headers) => {
        headers.set('Authorization', 'Bearer your-token');
        headers.set('Accept', 'application/json');
    },
});

const dynamicResponse = await customHttp.get('data').response();
```

### Parsing Response

The library supports various response types:

```ts
import { Http } from 'coming-soon';
import { z } from 'zod';

const response = await Http.get('https://api.example.com/data').json(z.object({
    key: z.string(),
}));

if (response.success) {
    console.log(response.data);
} else {
    console.error('Validation failed', response.error);
}

const textResponse = await Http.get('https://api.example.com/text').text();

if (textResponse.success) {
    console.log(textResponse.data);
} else {
    console.error('Request failed', textResponse.error);
}

const arrayBufferResponse = await Http.get('https://api.example.com/buffer').arrayBuffer();

if (arrayBufferResponse.success) {
    console.log(arrayBufferResponse.data);
} else {
    console.error('Request failed', arrayBufferResponse.error);
}
```

## Error Handling

The library includes detailed error handling for various scenarios:
This library provides a comprehensive error handling system, ensuring that you can manage various types of errors gracefully. All possible errors inherit from the base `HttpError` class, making it easy to catch and handle errors consistently.

### Error Hierarchy

The error hierarchy is structured as follows:

HttpError
├── ServerError
│ ├── InternalServerError
│ ├── NotFoundError
│ ├── BadRequestError
│ ├── UnauthorizedError
│ └── ForbiddenError
├── ClientError
│ ├── ParseBodyError
│ ├── ValidationError (ZodError)
│ └── NetworkError
│ ├── TimeoutError
│ ├── AbortError
│ ├── RetryError
│ └── ConnectionError


### Handling Different Types of Errors

When making HTTP requests, you might encounter various types of errors. Here's how you can handle them:

#### Server Errors

Server errors occur when the server fails to process the request correctly. These include `InternalServerError`, `NotFoundError`, `BadRequestError`, `UnauthorizedError`, and `ForbiddenError`.

```ts
import { Http, InternalServerError, NotFoundError, BadRequestError  } from 'coming-soon';

const response = await Http.get('https://api.example.com/data').response();

if (!response.success) {
    if (response.error instanceof InternalServerError) {
        console.error('Internal server error:', response.error);
    } else if (response.error instanceof NotFoundError) {
        console.error('Resource not found:', response.error);
    } else if (response.error instanceof BadRequestError) {
        console.error('Bad request:', response.error);
    } else {
        console.error('Other server error:', response.error);
    }
}
```

#### Client Errors

Client errors occur when there is an issue with the client's request. This includes `ParseBodyError` and `ValidationError`.

```ts
import { Http, ParseBodyError, ValidationError  } from 'coming-soon';

const response = await Http.get('https://api.example.com/data').json(someSchema);

if (!response.success) {
    if (response.error instanceof ParseBodyError) {
        console.error('Failed to parse response body:', response.error);
    } else if (response.error instanceof ValidationError) {
        console.error('Validation error:', response.error);
    } else {
        console.error('Other client error:', response.error);
    }
}
```

#### Network Errors

Network errors occur when there are issues with the network request itself, such as timeouts, aborted requests, or connection issues. This includes `TimeoutError`, `AbortError`, `RetryError`, and `ConnectionError`.

```ts
import { Http, TimeoutError, AbortError, RetryError, ConnectionError  } from 'coming-soon';

const response = await Http.get('https://api.example.com/data').response();

if (!response.success) {
    if (response.error instanceof TimeoutError) {
        console.error('Request timed out:', response.error);
    } else if (response.error instanceof AbortError) {
        console.error('Request aborted:', response.error);
    } else if (response.error instanceof RetryError) {
        console.error('Retry limit reached:', response.error);
    } else if (response.error instanceof ConnectionError) {
        console.error('Connection error:', response.error);
    } else {
        console.error('Other network error:', response.error);
    }
}
```

By structuring errors this way, you can handle specific error scenarios more effectively, providing a better user experience and more robust error management in your application.

## Conclusion

This HTTP client library provides a simple and flexible way to make HTTP requests in TypeScript, with support for custom options, fluent API, and detailed error handling. Whether you need a quick, one-off request or a complex, configurable HTTP client, this library has you covered.

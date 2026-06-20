/** A minimal HTTP client interface used by providers. */
export interface HttpClient {
  request<T>(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<HttpResponse<T>>;
}

export interface HttpResponse<T> {
  status: number;
  headers: Record<string, string>;
  body: T;
}

export class FetchHttpClient implements HttpClient {
  async request<T>(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<HttpResponse<T>> {
    const init: RequestInit = {
      method: options.method,
      headers: options.headers,
    };
    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }
    if (options.signal) {
      init.signal = options.signal;
    }
    const res = await fetch(options.url, init);
    const text = await res.text();
    let body: T;
    try {
      body = text ? (JSON.parse(text) as T) : (undefined as T);
    } catch {
      body = text as unknown as T;
    }
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return { status: res.status, headers, body };
  }
}

export class InMemoryHttpClient implements HttpClient {
  public readonly calls: Array<{
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
  }> = [];
  private readonly responses: HttpResponse<unknown>[];
  private cursor = 0;

  constructor(responses: HttpResponse<unknown>[] = []) {
    this.responses = responses;
  }

  async request<T>(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<HttpResponse<T>> {
    this.calls.push({
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: options.body,
    });
    const r = this.responses[this.cursor++] ?? { status: 200, headers: {}, body: null };
    return r as HttpResponse<T>;
  }
}

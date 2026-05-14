// http.ts — HTTP REST API client for the kAIs platform.

import {
  CellsClient,
  FormationsClient,
  RulesClient,
  FilesClient,
  CompletionsClient,
  KaisAPIError,
} from "./resources";

export interface KaisHTTPOptions {
  /** Base URL of the kAIs API server. Defaults to KAIS_API_URL env or http://localhost:8080. */
  baseUrl?: string;
  /** API key / session token for authentication. Defaults to KAIS_API_KEY env. */
  apiKey?: string;
  /** Kubernetes namespace to operate in. Defaults to KAIS_NAMESPACE env or "default". */
  namespace?: string;
  /** Request timeout in milliseconds. Defaults to 30000 (30s). Set to 0 to disable. */
  timeoutMs?: number;
}

/**
 * KaisHTTP is the HTTP REST API client for the kAIs platform.
 *
 * Uses native `fetch` (Node 18+ / browser) with no external HTTP dependencies.
 *
 * @example
 * ```ts
 * const kais = new KaisHTTP({ baseUrl: "https://api.kais.example.com", apiKey: "..." });
 * const cells = await kais.cells.list();
 * const cell = await kais.cells.get("planner-0");
 * ```
 */
export class KaisHTTP {
  readonly cells: CellsClient;
  readonly formations: FormationsClient;
  readonly rules: RulesClient;
  readonly files: FilesClient;
  readonly completions: CompletionsClient;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly namespace: string;
  private readonly timeoutMs: number;

  constructor(opts?: KaisHTTPOptions) {
    this.baseUrl = (
      opts?.baseUrl ?? env("KAIS_API_URL") ?? "http://localhost:8080"
    ).replace(/\/+$/, "");
    this.apiKey = opts?.apiKey ?? env("KAIS_API_KEY") ?? "";
    this.namespace = opts?.namespace ?? env("KAIS_NAMESPACE") ?? "default";
    this.timeoutMs = opts?.timeoutMs ?? 30_000;

    const requestFn = this.request.bind(this);
    const rawRequestFn = this.rawRequest.bind(this);

    this.cells = new CellsClient(requestFn, rawRequestFn);
    this.formations = new FormationsClient(requestFn);
    this.rules = new RulesClient(requestFn);
    this.files = new FilesClient(requestFn, rawRequestFn);
    this.completions = new CompletionsClient(requestFn, rawRequestFn);
  }

  /** The base path for namespaced API resources. */
  private get basePath(): string {
    return `${this.baseUrl}/api/v1/namespaces/${encodeURIComponent(this.namespace)}`;
  }

  /**
   * Perform an HTTP request and parse the JSON response.
   * Throws `KaisAPIError` on non-2xx status codes.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const resp = await this.rawRequest(method, path, body, signal);

    // 204 No Content — return undefined as T (for delete operations).
    if (resp.status === 204) {
      return undefined as T;
    }

    const text = await resp.text();

    if (!resp.ok) {
      let message: string;
      try {
        const parsed = JSON.parse(text);
        message = parsed.error || text;
      } catch {
        message = text;
      }
      throw new KaisAPIError(resp.status, message, method, path);
    }

    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * Perform a raw HTTP request and return the Response object.
   * Used internally for streaming and file operations.
   *
   * @param signal Optional AbortSignal for caller-driven cancellation.
   *   Combined with the configured timeout via AbortSignal.any().
   */
  private async rawRequest(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<Response> {
    const url = `${this.basePath}${path}`;

    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    let fetchBody: BodyInit | undefined;

    if (body instanceof FormData) {
      fetchBody = body;
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }

    const signals: AbortSignal[] = [];
    if (this.timeoutMs > 0) {
      signals.push(AbortSignal.timeout(this.timeoutMs));
    }
    if (signal) {
      signals.push(signal);
    }

    const combinedSignal =
      signals.length > 0 ? AbortSignal.any(signals) : undefined;

    return fetch(url, {
      method,
      headers,
      body: fetchBody,
      signal: combinedSignal,
    });
  }
}

/**
 * Read an environment variable safely.
 * Returns undefined if not available (e.g., in browser environments).
 */
function env(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}

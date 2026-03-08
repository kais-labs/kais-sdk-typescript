// resources.ts — Resource-specific API clients for the kAIs HTTP API.

import type {
  Cell,
  CreateCellRequest,
  UpdateCellRequest,
  ChatMessage,
  Formation,
  CreateFormationRequest,
  UpdateFormationRequest,
  Rule,
  CreateRuleRequest,
  UpdateRuleRequest,
  FileInfo,
  CompletionResponse,
  CompletionChunk,
} from "./api-types";

/** Type for the internal request method provided by KaisHTTP. */
export type RequestFn = <T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
) => Promise<T>;

/** Type for building raw fetch requests (for streaming). */
export type RawRequestFn = (
  method: string,
  path: string,
  body?: unknown
) => Promise<Response>;

// ---------------------------------------------------------------------------
// CellsClient
// ---------------------------------------------------------------------------

export class CellsClient {
  constructor(
    private readonly request: RequestFn,
    private readonly rawRequest: RawRequestFn
  ) {}

  /** List all cells in the namespace. */
  async list(): Promise<Cell[]> {
    return this.request<Cell[]>("GET", "/cells");
  }

  /** Get a cell by name. */
  async get(name: string): Promise<Cell> {
    return this.request<Cell>("GET", `/cells/${encodeURIComponent(name)}`);
  }

  /** Create a new cell. */
  async create(cell: CreateCellRequest): Promise<Cell> {
    return this.request<Cell>("POST", "/cells", cell);
  }

  /** Update an existing cell. */
  async update(name: string, cell: UpdateCellRequest): Promise<Cell> {
    return this.request<Cell>(
      "PUT",
      `/cells/${encodeURIComponent(name)}`,
      cell
    );
  }

  /** Delete a cell by name. */
  async delete(name: string): Promise<void> {
    await this.request<void>("DELETE", `/cells/${encodeURIComponent(name)}`);
  }

  /** Send a chat message to a cell and get the response. */
  async chat(name: string, message: string): Promise<ChatMessage> {
    return this.request<ChatMessage>(
      "POST",
      `/cells/${encodeURIComponent(name)}/messages`,
      { content: message }
    );
  }

  /** Get chat history for a cell. */
  async history(name: string, limit?: number): Promise<ChatMessage[]> {
    const params = limit ? `?limit=${limit}` : "";
    return this.request<ChatMessage[]>(
      "GET",
      `/cells/${encodeURIComponent(name)}/history${params}`
    );
  }
}

// ---------------------------------------------------------------------------
// FormationsClient
// ---------------------------------------------------------------------------

export class FormationsClient {
  constructor(private readonly request: RequestFn) {}

  /** List all formations in the namespace. */
  async list(): Promise<Formation[]> {
    return this.request<Formation[]>("GET", "/formations");
  }

  /** Get a formation by name. */
  async get(name: string): Promise<Formation> {
    return this.request<Formation>(
      "GET",
      `/formations/${encodeURIComponent(name)}`
    );
  }

  /** Create a new formation. */
  async create(formation: CreateFormationRequest): Promise<Formation> {
    return this.request<Formation>("POST", "/formations", formation);
  }

  /** Update an existing formation. */
  async update(
    name: string,
    formation: UpdateFormationRequest
  ): Promise<Formation> {
    return this.request<Formation>(
      "PUT",
      `/formations/${encodeURIComponent(name)}`,
      formation
    );
  }

  /** Delete a formation by name. */
  async delete(name: string): Promise<void> {
    await this.request<void>(
      "DELETE",
      `/formations/${encodeURIComponent(name)}`
    );
  }
}

// ---------------------------------------------------------------------------
// RulesClient
// ---------------------------------------------------------------------------

export class RulesClient {
  constructor(private readonly request: RequestFn) {}

  /** List all rules in the namespace. Returns the `rules` array from the response. */
  async list(): Promise<Rule[]> {
    const resp = await this.request<{ rules: Rule[]; total: number }>(
      "GET",
      "/rules"
    );
    return resp.rules;
  }

  /** Get a rule by id (name). */
  async get(id: string): Promise<Rule> {
    return this.request<Rule>("GET", `/rules/${encodeURIComponent(id)}`);
  }

  /** Create a new rule. */
  async create(rule: CreateRuleRequest): Promise<Rule> {
    return this.request<Rule>("POST", "/rules", rule);
  }

  /** Update an existing rule. */
  async update(id: string, rule: UpdateRuleRequest): Promise<Rule> {
    return this.request<Rule>(
      "PUT",
      `/rules/${encodeURIComponent(id)}`,
      rule
    );
  }

  /** Delete a rule by id (name). */
  async delete(id: string): Promise<void> {
    await this.request<void>("DELETE", `/rules/${encodeURIComponent(id)}`);
  }
}

// ---------------------------------------------------------------------------
// FilesClient
// ---------------------------------------------------------------------------

export class FilesClient {
  constructor(
    private readonly request: RequestFn,
    private readonly rawRequest: RawRequestFn
  ) {}

  /** List all files in the namespace. */
  async list(): Promise<FileInfo[]> {
    return this.request<FileInfo[]>("GET", "/files");
  }

  /** Upload a file. Accepts Buffer (Node) or Blob (browser). */
  async upload(
    file: Buffer | Blob,
    filename: string
  ): Promise<FileInfo> {
    // Build multipart form data.
    // FormData is available in Node 18+ and all modern browsers.
    const form = new FormData();

    if (typeof Blob !== "undefined" && file instanceof Blob) {
      form.append("file", file, filename);
    } else {
      // Node.js Buffer — copy to a plain ArrayBuffer to avoid SharedArrayBuffer type issues
      const buf = file as Buffer;
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      const blob = new Blob([ab]);
      form.append("file", blob, filename);
    }

    const resp = await this.rawRequest("POST", "/files", form);
    if (!resp.ok) {
      const body = await resp.text();
      let message: string;
      try {
        const parsed = JSON.parse(body);
        message = parsed.error || body;
      } catch {
        message = body;
      }
      throw new KaisAPIError(resp.status, message, "POST", "/files");
    }
    return resp.json() as Promise<FileInfo>;
  }

  /** Download a file by path. Returns the raw response body as a Buffer (Node) or ArrayBuffer (browser). */
  async download(path: string): Promise<Buffer> {
    const resp = await this.rawRequest(
      "GET",
      `/files/${encodeURIComponent(path)}`
    );
    if (!resp.ok) {
      const body = await resp.text();
      let message: string;
      try {
        const parsed = JSON.parse(body);
        message = parsed.error || body;
      } catch {
        message = body;
      }
      throw new KaisAPIError(resp.status, message, "GET", `/files/${path}`);
    }
    const arrayBuffer = await resp.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /** Delete a file by path. */
  async delete(path: string): Promise<void> {
    await this.request<void>(
      "DELETE",
      `/files/${encodeURIComponent(path)}`
    );
  }
}

// ---------------------------------------------------------------------------
// CompletionsClient
// ---------------------------------------------------------------------------

export class CompletionsClient {
  constructor(
    private readonly request: RequestFn,
    private readonly rawRequest: RawRequestFn
  ) {}

  /**
   * Send a message to a cell and get a completion.
   * When `opts.stream` is true, the response is still collected into a single
   * CompletionResponse. For true streaming, use `createStream()`.
   */
  async create(
    cellName: string,
    message: string,
    opts?: { stream?: boolean }
  ): Promise<CompletionResponse> {
    return this.request<CompletionResponse>(
      "POST",
      `/cells/${encodeURIComponent(cellName)}/completions`,
      { message, stream: opts?.stream ?? false }
    );
  }

  /**
   * Stream a completion response from a cell via SSE.
   * Yields `CompletionChunk` objects until the stream ends.
   */
  async *createStream(
    cellName: string,
    message: string
  ): AsyncGenerator<CompletionChunk, void, undefined> {
    const resp = await this.rawRequest(
      "POST",
      `/cells/${encodeURIComponent(cellName)}/completions`,
      { message, stream: true }
    );

    if (!resp.ok) {
      const body = await resp.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(body);
        errorMessage = parsed.error || body;
      } catch {
        errorMessage = body;
      }
      throw new KaisAPIError(
        resp.status,
        errorMessage,
        "POST",
        `/cells/${cellName}/completions`
      );
    }

    if (!resp.body) {
      throw new KaisAPIError(
        0,
        "Response body is null — streaming not supported in this environment",
        "POST",
        `/cells/${cellName}/completions`
      );
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from the buffer.
        // Format: "event: <type>\ndata: <json>\n\n"
        const parts = buffer.split("\n\n");
        // Keep the last incomplete part in the buffer.
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;

          const lines = part.split("\n");
          let eventType = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              data = line.slice(6);
            }
          }

          if (eventType === "done") {
            return;
          }

          if (eventType === "error") {
            let errorMessage = data;
            try {
              const parsed = JSON.parse(data);
              errorMessage = parsed.error || data;
            } catch {
              // use raw data
            }
            throw new KaisAPIError(
              0,
              errorMessage,
              "POST",
              `/cells/${cellName}/completions`
            );
          }

          if (data) {
            try {
              const chunk = JSON.parse(data) as CompletionChunk;
              yield chunk;
            } catch {
              // Skip malformed chunks.
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// ---------------------------------------------------------------------------
// KaisAPIError
// ---------------------------------------------------------------------------

/**
 * Custom error class for kAIs API errors.
 */
export class KaisAPIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly method: string,
    public readonly path: string
  ) {
    super(`kAIs API error ${status} ${method} ${path}: ${message}`);
    this.name = "KaisAPIError";
  }
}

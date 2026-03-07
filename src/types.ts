import { randomUUID } from "crypto";

export interface CellInfo {
  name: string;
  namespace: string;
  formation: string;
  template: string;
  replica: number;
  status: string;
}

export interface MessageFields {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class Message {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly content: string;
  readonly timestamp: number;
  readonly metadata: Record<string, unknown>;

  constructor(fields: MessageFields) {
    this.id = fields.id;
    this.from = fields.from;
    this.to = fields.to;
    this.content = fields.content;
    this.timestamp = fields.timestamp;
    this.metadata = fields.metadata ?? {};
  }

  static create(
    from: string,
    to: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Message {
    return new Message({
      id: randomUUID(),
      from,
      to,
      content,
      timestamp: Date.now(),
      metadata,
    });
  }

  toJSON(): MessageFields {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      content: this.content,
      timestamp: this.timestamp,
      metadata: this.metadata,
    };
  }

  static fromJSON(data: unknown): Message {
    if (typeof data !== "object" || data === null) {
      throw new Error("Message.fromJSON: expected an object");
    }
    const obj = data as Record<string, unknown>;

    if (typeof obj.content !== "string") {
      throw new Error("Message.fromJSON: missing or invalid 'content' field");
    }

    return new Message({
      id: typeof obj.id === "string" ? obj.id : randomUUID(),
      from: typeof obj.from === "string" ? obj.from : "unknown",
      to: typeof obj.to === "string" ? obj.to : "unknown",
      content: obj.content,
      timestamp:
        typeof obj.timestamp === "number" ? obj.timestamp : Date.now(),
      metadata:
        typeof obj.metadata === "object" && obj.metadata !== null
          ? (obj.metadata as Record<string, unknown>)
          : {},
    });
  }
}

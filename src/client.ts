import {
  connect,
  NatsConnection,
  Subscription,
  StringCodec,
  JSONCodec,
} from "nats";
import { Message, CellInfo } from "./types";

export interface KaisClientOptions {
  natsUrl?: string;
  namespace?: string;
  appName?: string;
}

export class KaisClient {
  private nc: NatsConnection | null = null;
  private readonly natsUrl: string;
  private readonly namespace: string;
  private readonly appName: string;
  private readonly sc = StringCodec();
  private readonly jc = JSONCodec();
  private subscriptions: Subscription[] = [];

  constructor(opts: KaisClientOptions = {}) {
    this.natsUrl = opts.natsUrl ?? process.env.KAIS_NATS_URL ?? "localhost:4222";
    this.namespace = opts.namespace ?? process.env.KAIS_NAMESPACE ?? "default";
    this.appName = opts.appName ?? process.env.KAIS_APP_NAME ?? "sdk-client";
  }

  async connect(): Promise<void> {
    this.nc = await connect({ servers: this.natsUrl });
  }

  async close(): Promise<void> {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
    if (this.nc) {
      await this.nc.drain();
      this.nc = null;
    }
  }

  private ensureConnected(): NatsConnection {
    if (!this.nc) {
      throw new Error("KaisClient is not connected. Call connect() first.");
    }
    return this.nc;
  }

  private inboxSubject(cellName: string): string {
    return `cell.${this.namespace}.${cellName}.inbox`;
  }

  private outboxSubject(cellName: string): string {
    return `cell.${this.namespace}.${cellName}.outbox`;
  }

  /**
   * Send a message to a cell's inbox (fire-and-forget).
   */
  async send(cellName: string, content: string): Promise<Message> {
    const nc = this.ensureConnected();
    const msg = Message.create(this.appName, cellName, content);
    nc.publish(this.inboxSubject(cellName), this.jc.encode(msg.toJSON()));
    return msg;
  }

  /**
   * Send a message and wait for a reply on the cell's outbox.
   */
  async ask(
    cellName: string,
    content: string,
    timeout: number = 30000
  ): Promise<Message> {
    const nc = this.ensureConnected();
    const msg = Message.create(this.appName, cellName, content);

    return new Promise<Message>((resolve, reject) => {
      const timer = setTimeout(() => {
        sub.unsubscribe();
        reject(new Error(`ask() timed out after ${timeout}ms waiting for reply from ${cellName}`));
      }, timeout);

      const sub = nc.subscribe(this.outboxSubject(cellName), {
        callback: (_err, natsMsg) => {
          try {
            const data = this.jc.decode(natsMsg.data);
            const reply = Message.fromJSON(data);
            // Match reply to our message by checking the 'to' field targets us
            if (
              reply.to === this.appName ||
              reply.to.startsWith("user")
            ) {
              clearTimeout(timer);
              sub.unsubscribe();
              resolve(reply);
            }
          } catch {
            // Ignore malformed messages, keep waiting
          }
        },
      });

      // Now send the message
      nc.publish(this.inboxSubject(cellName), this.jc.encode(msg.toJSON()));
    });
  }

  /**
   * Subscribe to messages from a cell's outbox.
   */
  subscribe(
    cellName: string,
    callback: (msg: Message) => void
  ): Subscription {
    const nc = this.ensureConnected();
    const sub = nc.subscribe(this.outboxSubject(cellName), {
      callback: (_err, natsMsg) => {
        try {
          const data = this.jc.decode(natsMsg.data);
          const msg = Message.fromJSON(data);
          callback(msg);
        } catch {
          // Skip malformed messages
        }
      },
    });
    this.subscriptions.push(sub);
    return sub;
  }

  /**
   * Broadcast a message to all cells in the namespace via wildcard publish.
   */
  async broadcast(content: string): Promise<Message> {
    const nc = this.ensureConnected();
    const msg = Message.create(this.appName, "*", content);
    nc.publish(
      `cell.${this.namespace}.*.inbox`,
      this.jc.encode(msg.toJSON())
    );
    return msg;
  }

  /**
   * Discover cells by sending a request to the kais discovery subject.
   */
  async discoverCells(timeout: number = 5000): Promise<CellInfo[]> {
    const nc = this.ensureConnected();
    const subject = `kais.${this.namespace}.discover`;
    try {
      const reply = await nc.request(subject, this.sc.encode(""), {
        timeout,
      });
      const data = this.jc.decode(reply.data) as CellInfo[];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Check connectivity to NATS.
   */
  health(): { connected: boolean; natsUrl: string; namespace: string } {
    return {
      connected: this.nc !== null && !this.nc.isClosed(),
      natsUrl: this.natsUrl,
      namespace: this.namespace,
    };
  }
}

import { describe, it, expect } from "vitest";
import { Message } from "../src/types";
import { KaisClient } from "../src/client";

describe("Message", () => {
  it("creates a message with auto-generated id and timestamp", () => {
    const msg = Message.create("app", "cell-0", "hello");
    expect(msg.id).toBeDefined();
    expect(msg.id.length).toBeGreaterThan(0);
    expect(msg.from).toBe("app");
    expect(msg.to).toBe("cell-0");
    expect(msg.content).toBe("hello");
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(msg.metadata).toEqual({});
  });

  it("creates a message with metadata", () => {
    const msg = Message.create("app", "cell-0", "hello", {
      priority: "high",
      count: 42,
    });
    expect(msg.metadata).toEqual({ priority: "high", count: 42 });
  });

  it("performs JSON roundtrip", () => {
    const original = Message.create("sender", "receiver", "test content", {
      key: "value",
    });
    const json = original.toJSON();
    const restored = Message.fromJSON(json);

    expect(restored.id).toBe(original.id);
    expect(restored.from).toBe(original.from);
    expect(restored.to).toBe(original.to);
    expect(restored.content).toBe(original.content);
    expect(restored.timestamp).toBe(original.timestamp);
    expect(restored.metadata).toEqual(original.metadata);
  });

  it("roundtrips through JSON.stringify/parse", () => {
    const original = Message.create("a", "b", "data");
    const serialized = JSON.stringify(original.toJSON());
    const parsed = JSON.parse(serialized);
    const restored = Message.fromJSON(parsed);

    expect(restored.id).toBe(original.id);
    expect(restored.content).toBe(original.content);
  });

  it("fromJSON fills defaults for missing optional fields", () => {
    const msg = Message.fromJSON({ content: "minimal" });

    expect(msg.content).toBe("minimal");
    expect(msg.from).toBe("unknown");
    expect(msg.to).toBe("unknown");
    expect(msg.id).toBeDefined();
    expect(msg.id.length).toBeGreaterThan(0);
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(msg.metadata).toEqual({});
  });

  it("fromJSON throws on missing content", () => {
    expect(() => Message.fromJSON({ from: "a", to: "b" })).toThrow(
      "missing or invalid 'content'"
    );
  });

  it("fromJSON throws on non-object input", () => {
    expect(() => Message.fromJSON("string")).toThrow("expected an object");
    expect(() => Message.fromJSON(null)).toThrow("expected an object");
    expect(() => Message.fromJSON(42)).toThrow("expected an object");
  });
});

describe("KaisClient", () => {
  it("uses default options from constructor", () => {
    const client = new KaisClient();
    const h = client.health();
    expect(h.connected).toBe(false);
    expect(h.natsUrl).toBe("localhost:4222");
    expect(h.namespace).toBe("default");
  });

  it("uses provided options", () => {
    const client = new KaisClient({
      natsUrl: "nats://custom:4222",
      namespace: "prod",
      appName: "my-app",
    });
    const h = client.health();
    expect(h.connected).toBe(false);
    expect(h.natsUrl).toBe("nats://custom:4222");
    expect(h.namespace).toBe("prod");
  });

  it("throws when sending without connecting", () => {
    const client = new KaisClient();
    expect(() => (client as any).ensureConnected()).toThrow(
      "not connected"
    );
  });
});

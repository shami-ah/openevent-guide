// @vitest-environment node
import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { clientAddress, corsOrigin, createRateLimiter, isLoopbackHost, resolveServerConfig } from "./security.js";

/** Generated per run: no token value is ever written into the repo. */
const TOKEN = randomUUID();

describe("resolveServerConfig: no API token", () => {
  it("starts in local development: loopback, no proxy, not production", () => {
    const config = resolveServerConfig({});
    expect(config.host).toBe("127.0.0.1");
    expect(config.local).toBe(true);
    expect(config.apiToken).toBe("");
  });

  it("refuses to start when bound beyond loopback", () => {
    expect(() => resolveServerConfig({ GUIDE_HOST: "0.0.0.0" })).toThrow(/GUIDE_API_TOKEN/);
  });

  it("refuses to start in production, even on loopback", () => {
    expect(() => resolveServerConfig({ NODE_ENV: "production" })).toThrow(/GUIDE_API_TOKEN/);
  });

  it("refuses to start behind a proxy, even on loopback", () => {
    // A same-host reverse proxy makes a loopback server public.
    expect(() => resolveServerConfig({ GUIDE_TRUST_PROXY: "1" })).toThrow(/GUIDE_API_TOKEN/);
  });
});

describe("resolveServerConfig: with an API token", () => {
  it("starts on a public interface", () => {
    const config = resolveServerConfig({ GUIDE_HOST: "0.0.0.0", GUIDE_API_TOKEN: TOKEN, NODE_ENV: "production" });
    expect(config.local).toBe(false);
    expect(config.host).toBe("0.0.0.0");
  });

  it("rejects a proxy hop count that is not a whole number", () => {
    expect(() => resolveServerConfig({ GUIDE_API_TOKEN: TOKEN, GUIDE_TRUST_PROXY: "true" })).toThrow(/GUIDE_TRUST_PROXY/);
  });
});

describe("isLoopbackHost", () => {
  it("recognises loopback forms", () => {
    for (const h of ["localhost", "127.0.0.1", "127.1.2.3", "::1", "[::1]"]) expect(isLoopbackHost(h), h).toBe(true);
  });

  it("rejects everything else", () => {
    for (const h of ["0.0.0.0", "::", "10.0.0.5", "guide.example.com"]) expect(isLoopbackHost(h), h).toBe(false);
  });
});

describe("corsOrigin", () => {
  it("reflects any origin only in local development", () => {
    expect(corsOrigin({ allowedOrigins: [], local: true })("http://localhost:5173")).toBe("http://localhost:5173");
  });

  it("denies every cross-origin caller when not local and no allowlist is set", () => {
    expect(corsOrigin({ allowedOrigins: [], local: false })("https://evil-example.com")).toBeNull();
  });

  it("honours an allowlist", () => {
    const decide = corsOrigin({ allowedOrigins: ["https://app.test.openevent.io"], local: false });
    expect(decide("https://app.test.openevent.io")).toBe("https://app.test.openevent.io");
    expect(decide("https://evil-example.com")).toBeNull();
  });
});

describe("clientAddress", () => {
  it("ignores X-Forwarded-For when no proxy is trusted", () => {
    expect(clientAddress("198.51.100.7", "1.2.3.4", 0)).toBe("198.51.100.7");
  });

  it("takes the entry the trusted proxy appended, not the ones the client wrote", () => {
    // Client forged "1.2.3.4"; the one proxy in front appended the real address.
    expect(clientAddress("10.0.0.2", "1.2.3.4, 203.0.113.9", 1)).toBe("203.0.113.9");
  });

  it("walks back one entry per trusted hop", () => {
    // client -> app nginx -> guide nginx -> node
    expect(clientAddress("127.0.0.1", "1.2.3.4, 203.0.113.9, 192.0.2.10", 2)).toBe("203.0.113.9");
  });

  it("falls back to the peer when the header is missing", () => {
    expect(clientAddress("10.0.0.2", undefined, 2)).toBe("10.0.0.2");
  });
});

describe("createRateLimiter", () => {
  it("limits per key and resets after the window", () => {
    let t = 0;
    const limiter = createRateLimiter(2, 1000, () => t);
    expect(limiter.hit("a")).toBe(false);
    expect(limiter.hit("a")).toBe(false);
    expect(limiter.hit("a")).toBe(true);
    expect(limiter.hit("b")).toBe(false);
    t = 1001;
    expect(limiter.hit("a")).toBe(false);
  });
});

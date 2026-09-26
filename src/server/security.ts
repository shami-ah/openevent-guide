/**
 * Startup security policy for the guide server.
 *
 * The server used to fail open in three ways at once: no GUIDE_API_TOKEN meant
 * every /api/* route was unauthenticated, an empty GUIDE_ALLOWED_ORIGINS meant
 * CORS echoed back whatever origin asked, and the rate limit was keyed on a
 * session id the caller picks. On a public host that let any web page spend
 * the OpenAI key from a visitor's browser. Both were confirmed live on
 * 2026-09-27.
 *
 * The rule now: open defaults are allowed only in local development, meaning
 * bound to loopback, not NODE_ENV=production and not behind a proxy. Anything
 * else must be configured explicitly or the server refuses to start.
 */

export interface ServerConfig {
  /** Interface to bind. Defaults to loopback so an unconfigured server is not public. */
  host: string;
  /** Shared secret for /api/*. Empty only in local development. */
  apiToken: string;
  /** CORS allowlist. Empty means allow any origin locally and deny all otherwise. */
  allowedOrigins: string[];
  /** Number of reverse proxies in front of this server whose X-Forwarded-For is trusted. */
  trustProxyHops: number;
  /** True when the open development defaults apply. */
  local: boolean;
}

export function isLoopbackHost(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h);
}

export function resolveServerConfig(env: Record<string, string | undefined>): ServerConfig {
  const host = env.GUIDE_HOST?.trim() || "127.0.0.1";
  const apiToken = env.GUIDE_API_TOKEN ?? "";
  const allowedOrigins = (env.GUIDE_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const rawHops = env.GUIDE_TRUST_PROXY?.trim() || "0";
  if (!/^\d+$/.test(rawHops)) {
    throw new Error(
      `GUIDE_TRUST_PROXY must be a whole number of proxy hops (got "${rawHops}"). Use 0 when nothing sits in front of this server.`,
    );
  }
  const trustProxyHops = Number(rawHops);

  // A proxy in front means the server is reachable from outside even when it
  // binds loopback, so it does not count as local.
  const local = isLoopbackHost(host) && env.NODE_ENV !== "production" && trustProxyHops === 0;

  if (!apiToken && !local) {
    const why = !isLoopbackHost(host)
      ? `it binds ${host}, which is not loopback`
      : env.NODE_ENV === "production"
        ? "NODE_ENV is production"
        : "GUIDE_TRUST_PROXY says it sits behind a proxy";
    throw new Error(
      `GUIDE_API_TOKEN is not set, and this server is not local (${why}). ` +
        "Without it anyone who finds the URL can spend the OpenAI key. Set GUIDE_API_TOKEN, " +
        "or for local development bind GUIDE_HOST=127.0.0.1 with no proxy and NODE_ENV unset.",
    );
  }

  return { host, apiToken, allowedOrigins, trustProxyHops, local };
}

/**
 * The CORS origin decision. An empty allowlist reflects any origin only in
 * local development; everywhere else it denies every cross-origin caller. That
 * is safe for the shipping design, where the app proxies /guide/ same-origin
 * and so never needs CORS at all, and for the extension, whose service worker
 * fetches with host permissions and is not subject to CORS.
 */
export function corsOrigin(config: Pick<ServerConfig, "allowedOrigins" | "local">) {
  return (origin: string): string | null => {
    if (config.allowedOrigins.length === 0) return config.local ? origin || "*" : null;
    return config.allowedOrigins.includes(origin) ? origin : null;
  };
}

/**
 * The address a request is rate limited on. The caller cannot choose it: with
 * no trusted proxy it is the TCP peer, and X-Forwarded-For is ignored entirely.
 * With N trusted proxies it is the entry N hops back from the peer, the same
 * model as Express's `trust proxy`. Entries further left were written by the
 * client and are never read.
 */
export function clientAddress(peer: string | undefined, forwardedFor: string | undefined, trustProxyHops: number): string {
  const chain = [peer || "unknown"];
  if (trustProxyHops > 0 && forwardedFor) {
    const hops = forwardedFor.split(",").map((a) => a.trim()).filter(Boolean).reverse();
    chain.push(...hops);
  }
  return chain[Math.min(trustProxyHops, chain.length - 1)];
}

export interface RateLimiter {
  /** Records a request for `key`; true when it is over the limit. */
  hit(key: string): boolean;
  /** Drops expired buckets. */
  sweep(): void;
}

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key) {
      const t = now();
      const bucket = buckets.get(key);
      if (!bucket || t > bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: t + windowMs });
        return false;
      }
      bucket.count += 1;
      return bucket.count > limit;
    },
    sweep() {
      const t = now();
      for (const [key, bucket] of buckets) {
        if (t > bucket.resetAt) buckets.delete(key);
      }
    },
  };
}

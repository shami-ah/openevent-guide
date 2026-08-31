import { describe, expect, it } from "vitest";
import { APP_ROUTES, isKnownRoute, isSafePath, pathMatches, SIDEBAR_ROUTES } from "./appRoutes.js";

describe("route manifest", () => {
  it("lists no duplicates", () => {
    expect(new Set(APP_ROUTES).size).toBe(APP_ROUTES.length);
  });

  it("only contains absolute paths", () => {
    for (const route of APP_ROUTES) expect(route.startsWith("/")).toBe(true);
  });

  it("keeps every sidebar route inside the known routes", () => {
    for (const route of SIDEBAR_ROUTES) {
      expect(isKnownRoute(route), `${route} is a sidebar route but not a known route`).toBe(true);
    }
  });
});

describe("isSafePath", () => {
  it("accepts app paths", () => {
    expect(isSafePath("/settings/payments")).toBe(true);
  });

  it("rejects anything that could leave the origin or break out of a selector", () => {
    for (const bad of ["//evil.example.com", "https://evil.example.com", '/x"]', "/x'", "/x<script>", "javascript:alert(1)"]) {
      expect(isSafePath(bad), `${bad} should be rejected`).toBe(false);
    }
  });
});

describe("pathMatches", () => {
  it("matches exactly", () => {
    expect(pathMatches("/ticketing", "/ticketing")).toBe(true);
  });

  it("treats an on-arrival redirect as arrived", () => {
    // /membership redirects to /membership/dashboard; navigating again would
    // bounce the user a second time.
    expect(pathMatches("/membership/dashboard", "/membership")).toBe(true);
  });

  it("does not match a different route with the same prefix", () => {
    expect(pathMatches("/settings/payments", "/settings/pay")).toBe(false);
    expect(pathMatches("/reports", "/report")).toBe(false);
  });
});

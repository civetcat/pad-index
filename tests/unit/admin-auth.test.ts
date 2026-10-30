import { describe, expect, it } from "vitest";
import { adminAuthorized } from "@/lib/admin/auth";

describe("admin auth", () => {
  it("rejects requests when the server secret is missing", () => {
    delete process.env.ADMIN_SECRET;
    const request = new Request("http://localhost/api/admin/check", {
      headers: { Authorization: "Bearer secret" },
    });
    expect(adminAuthorized(request)).toBe(false);
  });

  it("does not accept the secret from a public header name mismatch", () => {
    process.env.ADMIN_SECRET = "server-only";
    const request = new Request("http://localhost/api/admin/check", {
      headers: { "x-admin-secret": "server-only" },
    });
    expect(adminAuthorized(request)).toBe(false);
    delete process.env.ADMIN_SECRET;
  });
});

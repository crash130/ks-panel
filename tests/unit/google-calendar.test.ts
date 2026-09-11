import { describe, expect, it } from "vitest";
import { isGoogleConfigured } from "../../src/lib/google-calendar";

describe("Google Calendar configuration", () => {
  it("does not report configured when credentials are missing", () => {
    const prevId = process.env.GOOGLE_CLIENT_ID;
    const prevSecret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleConfigured()).toBe(false);
    process.env.GOOGLE_CLIENT_ID = prevId;
    process.env.GOOGLE_CLIENT_SECRET = prevSecret;
  });
});

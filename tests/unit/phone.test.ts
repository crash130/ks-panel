import { describe, expect, it } from "vitest";
import { isValidPlPhone, normalizePlMsisdn, toE164 } from "../../src/lib/phone";

describe("phone PL", () => {
  it("normalizes 9-digit mobile to 48…", () => {
    expect(normalizePlMsisdn("505 825 047")).toBe("48505825047");
    expect(normalizePlMsisdn("505825047")).toBe("48505825047");
    expect(toE164("505825047")).toBe("+48505825047");
    expect(isValidPlPhone("505825047")).toBe(true);
  });

  it("keeps country code", () => {
    expect(normalizePlMsisdn("+48 505 825 047")).toBe("48505825047");
    expect(normalizePlMsisdn("0048505825047")).toBe("48505825047");
  });

  it("rejects junk", () => {
    expect(normalizePlMsisdn("123")).toBeNull();
    expect(isValidPlPhone("")).toBe(false);
  });
});

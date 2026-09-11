import { describe, expect, it } from "vitest";
import { assertSmsBodySafe, buildIntakeSms, equipmentShort } from "../../src/lib/sms/template";
import { BRAND } from "../../src/lib/brand";

describe("intake SMS template", () => {
  const base = {
    code: "KS-2612",
    deviceType: "Laptop",
    deviceBrand: "Dell",
    deviceModel: "XPS 13",
    promisedPickupAt: new Date("2026-09-14T16:00:00"),
    statusUrl: "http://127.0.0.1:3000/status/abc123tokennotanid",
  };

  it("includes shop, equipment, code, pickup, phone and status link", () => {
    const body = buildIntakeSms(base);
    expect(body).toContain("KS/");
    expect(body).toContain(BRAND.domain);
    expect(body).toContain("Laptop Dell XPS 13");
    expect(body).toContain("KS-2612");
    expect(body).toContain("14.09");
    expect(body).toContain("505 825 047");
    expect(body).toContain("/status/abc123tokennotanid");
  });

  it("never contains PIN, password, job id, or secret markers", () => {
    const body = buildIntakeSms(base);
    expect(body.toLowerCase()).not.toMatch(/\bpin\b/);
    expect(body.toLowerCase()).not.toContain("hasło");
    expect(body.toLowerCase()).not.toContain("password");
    expect(body).not.toContain("cuid");
    expect(() => assertSmsBodySafe(body, ["secret-pin-9999", "device-password"])).not.toThrow();
  });

  it("blocks a body that accidentally includes the device PIN", () => {
    expect(() => assertSmsBodySafe("Kod KS-1 PIN: 1234", ["1234"])).toThrow(/PIN/);
  });

  it("omits pickup when unset", () => {
    const body = buildIntakeSms({ ...base, promisedPickupAt: null, statusUrl: null });
    expect(body).not.toContain("Odbiór");
    expect(body).not.toContain("Status:");
  });

  it("shortens long equipment names", () => {
    const short = equipmentShort({
      deviceType: "Laptop",
      deviceBrand: "BardzoDługaMarkaTechnicznaXYZ",
      deviceModel: "Model z wyjątkowo długą nazwą handlową 2026",
    });
    expect(short.length).toBeLessThanOrEqual(42);
  });
});

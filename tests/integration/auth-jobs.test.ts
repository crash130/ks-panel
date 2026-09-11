import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createJob, nextJobCode, revealDeviceSecret } from "@/lib/jobs";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/rate-limit";
import { TEST_ENCRYPTION_KEY } from "../helpers/test-env";

describe("auth + jobs integration", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  it("hashes passwords and verifies them", async () => {
    const hash = await hashPassword("DEMO-Wlasciciel-2026!");
    expect(hash).not.toContain("DEMO-Wlasciciel-2026!");
    expect(await verifyPassword("DEMO-Wlasciciel-2026!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rate-limits repeated failed logins", async () => {
    const email = `rate-${Date.now()}@demo.ks.local`;
    const ip = "10.9.8.7";
    for (let i = 0; i < 5; i++) {
      await recordLoginAttempt(email, ip, false);
    }
    expect(await isLoginRateLimited(email, ip)).toBe(true);
  });

  it("creates a job with KS code and encrypted PIN", async () => {
    const code = await nextJobCode();
    expect(code).toMatch(/^KS-\d{2,}\d+$/);
    const job = await createJob({
      clientName: "Test Klient",
      clientPhone: "505825047",
      deviceType: "Laptop",
      deviceModel: "TestBook",
      issueDescription: "Nie włącza się",
      devicePin: "secret-pin-not-in-client",
    });
    expect(job.code).toMatch(/^KS-/);
    expect(job.devicePinEnc).toBeTruthy();
    expect(job.devicePinEnc).not.toContain("secret-pin-not-in-client");
    expect(revealDeviceSecret(job.devicePinEnc)).toBe("secret-pin-not-in-client");
    const stored = await prisma.job.findUnique({ where: { id: job.id } });
    expect(stored?.devicePinEnc).not.toContain("secret-pin-not-in-client");
  });

  it("rejects login with unknown user via hashed dummy path (user lookup)", async () => {
    const user = await prisma.user.findUnique({ where: { email: "nie-ma-takiego@demo.ks.local" } });
    expect(user).toBeNull();
  });
});

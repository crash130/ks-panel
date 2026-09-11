import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createJob } from "@/lib/jobs";
import { sendIntakeConfirmation } from "@/lib/sms/send";
import { TEST_ENCRYPTION_KEY } from "../helpers/test-env";

const PIN = "secret-pin-not-in-sms";
const PASSWORD = "device-password-xyz";

describe("intake SMS send (mock provider)", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    process.env.SMS_PROVIDER = "mock";
    delete process.env.SMS_MOCK_FAIL;
    process.env.APP_URL = "http://127.0.0.1:3100";
  });

  afterEach(() => {
    delete process.env.SMS_MOCK_FAIL;
    process.env.SMS_PROVIDER = "mock";
  });

  it("sends via mock, stores audit log, never puts PIN in the SMS body", async () => {
    const job = await createJob({
      clientName: "SMS Klient",
      clientPhone: "505825047",
      deviceType: "Laptop",
      deviceBrand: "Dell",
      deviceModel: "XPS 13",
      issueDescription: "Nie włącza się",
      devicePin: PIN,
      devicePassword: PASSWORD,
      promisedPickupAt: new Date("2026-09-20T16:00:00"),
      smsConsentAt: new Date(),
    });
    expect(job.publicStatusToken).toBeTruthy();
    expect(job.publicStatusToken).not.toBe(job.id);

    const result = await sendIntakeConfirmation(job.id);
    expect(result.status).toBe("sent");
    expect(result.attempted).toBe(true);
    expect(result.to).toBe("48505825047");

    const logs = await prisma.smsMessage.findMany({ where: { jobId: job.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe("SENT");
    expect(logs[0].provider).toBe("mock");
    expect(logs[0].providerId).toMatch(/^mock-/);
    expect(logs[0].body).toContain(job.code);
    expect(logs[0].body).toContain("Laptop Dell XPS 13");
    expect(logs[0].body).toContain(`/status/${job.publicStatusToken}`);
    expect(logs[0].body).not.toContain(PIN);
    expect(logs[0].body).not.toContain(PASSWORD);
    expect(logs[0].body).not.toContain(job.id);
    expect(logs[0].body.toLowerCase()).not.toContain("hasło");
  });

  it("keeps the job when the provider fails and logs FAILED", async () => {
    process.env.SMS_MOCK_FAIL = "true";
    const job = await createJob({
      clientName: "Fail Klient",
      clientPhone: "500100200",
      deviceType: "PC",
      deviceModel: "TestBox",
      issueDescription: "Brak obrazu",
      smsConsentAt: new Date(),
    });
    const result = await sendIntakeConfirmation(job.id);
    expect(result.status).toBe("failed");
    expect(result.attempted).toBe(true);
    expect(result.error).toMatch(/SMS_MOCK_FAIL/);

    const stored = await prisma.job.findUnique({ where: { id: job.id } });
    expect(stored).toBeTruthy();
    expect(stored?.code).toMatch(/^KS-/);

    const logs = await prisma.smsMessage.findMany({ where: { jobId: job.id } });
    expect(logs[0].status).toBe("FAILED");
    expect(logs[0].error).toMatch(/SMS_MOCK_FAIL/);
  });

  it("skips send without GDPR consent and does not call success", async () => {
    const job = await createJob({
      clientName: "Bez zgody",
      clientPhone: "500100201",
      deviceType: "Laptop",
      deviceModel: "Air",
      issueDescription: "Klawiatura",
    });
    const result = await sendIntakeConfirmation(job.id);
    expect(result.status).toBe("skipped");
    expect(result.attempted).toBe(false);
    const logs = await prisma.smsMessage.findMany({ where: { jobId: job.id } });
    expect(logs[0].status).toBe("SKIPPED");
  });

  it("does not fake success when SMS_PROVIDER=none", async () => {
    process.env.SMS_PROVIDER = "none";
    const job = await createJob({
      clientName: "None Provider",
      clientPhone: "500100202",
      deviceType: "Laptop",
      deviceModel: "IdeaPad",
      issueDescription: "Wentylator",
      smsConsentAt: new Date(),
    });
    const result = await sendIntakeConfirmation(job.id);
    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/SMS_PROVIDER=none|nie skonfigurowane/i);
    const stored = await prisma.job.findUnique({ where: { id: job.id } });
    expect(stored).toBeTruthy();
  });
});

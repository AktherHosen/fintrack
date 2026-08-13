import { afterAll, describe, expect, it } from "vitest";
import { nanoid } from "nanoid";
import {
  createAgent,
  deleteUserByEmail,
  disconnectTestDb,
  loginAdmin,
  registerUser,
  uniqueEmail,
} from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";

describe("payments integration", () => {
  const emailsToCleanup: string[] = [];

  afterAll(async () => {
    for (const email of emailsToCleanup) {
      await deleteUserByEmail(email);
    }
    await disconnectTestDb();
  });

  it("approves a pending payment and activates the Pro subscription", async () => {
    const userAgent = createAgent();
    const adminAgent = createAgent();
    const email = uniqueEmail("payer");
    emailsToCleanup.push(email);

    await registerUser(userAgent, { email });

    const payment = await userAgent.post("/api/v1/payments").send({
      planSlug: "pro-monthly",
      transactionId: `TXN-${nanoid(10)}`,
      senderNumber: "01700000000",
    });

    expect(payment.status).toBe(201);
    expect(payment.body.data.status).toBe("PENDING");
    const paymentId = payment.body.data.id as string;

    await loginAdmin(adminAgent);
    const approve = await adminAgent.post(`/api/v1/admin/payments/${paymentId}/approve`);
    expect(approve.status).toBe(200);

    const subscription = await userAgent.get("/api/v1/subscription");
    expect(subscription.status).toBe(200);
    expect(subscription.body.data.plan.slug).toBe("pro-monthly");
    expect(subscription.body.data.status).toBe("ACTIVE");

    const audit = await prisma.auditLog.findFirst({
      where: { action: "PAYMENT_APPROVED", entityId: paymentId },
    });
    expect(audit).not.toBeNull();
  });

  it("rejects non-admin access to admin routes", async () => {
    const userAgent = createAgent();
    const email = uniqueEmail("not-admin");
    emailsToCleanup.push(email);
    await registerUser(userAgent, { email });

    const res = await userAgent.get("/api/v1/admin/dashboard");
    expect(res.status).toBe(403);
  });
});

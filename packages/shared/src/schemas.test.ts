import { describe, expect, it } from "vitest";
import { createTransferSchema, manualPaymentSchema, registerSchema } from "./schemas/index.js";

describe("shared schemas", () => {
  it("accepts valid register input", () => {
    const result = registerSchema.safeParse({
      name: "Jane",
      email: "jane@test.local",
      password: "Password123!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects transfer to the same account", () => {
    const result = createTransferSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-1",
      amount: "10",
      transferDate: "2026-08-13",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid manual payment input", () => {
    const result = manualPaymentSchema.safeParse({
      planSlug: "pro",
      transactionId: "BK123456",
      senderNumber: "01700000000",
    });
    expect(result.success).toBe(true);
  });
});

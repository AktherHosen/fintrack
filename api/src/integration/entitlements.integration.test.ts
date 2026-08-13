import { afterAll, describe, expect, it } from "vitest";
import {
  createAccount,
  createAgent,
  deleteUserByEmail,
  disconnectTestDb,
  registerUser,
  uniqueEmail,
} from "../test/helpers.js";

describe("entitlements integration", () => {
  const emailsToCleanup: string[] = [];

  afterAll(async () => {
    for (const email of emailsToCleanup) {
      await deleteUserByEmail(email);
    }
    await disconnectTestDb();
  });

  it("enforces the free plan account limit", async () => {
    const agent = createAgent();
    const email = uniqueEmail("limits");
    emailsToCleanup.push(email);
    await registerUser(agent, { email });

    const first = await createAccount(agent, { name: "Account 1", openingBalance: "0" });
    const second = await createAccount(agent, { name: "Account 2", openingBalance: "0" });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const third = await createAccount(agent, { name: "Account 3", openingBalance: "0" });
    expect(third.status).toBe(403);
    expect(third.body.success).toBe(false);
  });
});

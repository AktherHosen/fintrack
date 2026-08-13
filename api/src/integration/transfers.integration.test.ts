import { afterAll, describe, expect, it } from "vitest";
import {
  createAccount,
  createAgent,
  deleteUserByEmail,
  disconnectTestDb,
  registerUser,
  uniqueEmail,
} from "../test/helpers.js";

describe("transfers integration", () => {
  const emailsToCleanup: string[] = [];

  afterAll(async () => {
    for (const email of emailsToCleanup) {
      await deleteUserByEmail(email);
    }
    await disconnectTestDb();
  });

  it("updates account balances without affecting income or expenses", async () => {
    const agent = createAgent();
    const email = uniqueEmail("transfer");
    emailsToCleanup.push(email);
    await registerUser(agent, { email });

    const accountA = await createAccount(agent, { name: "Wallet A", openingBalance: "1000" });
    const accountB = await createAccount(agent, { name: "Wallet B", openingBalance: "500" });
    const fromId = accountA.body.data.id;
    const toId = accountB.body.data.id;

    const transfer = await agent.post("/api/v1/transfers").send({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: "200",
      transferDate: new Date().toISOString().slice(0, 10),
    });

    expect(transfer.status).toBe(201);

    const accounts = await agent.get("/api/v1/accounts");
    const a = accounts.body.data.find((x: { id: string }) => x.id === fromId);
    const b = accounts.body.data.find((x: { id: string }) => x.id === toId);
    expect(a.balance).toBe("800.00");
    expect(b.balance).toBe("700.00");

    const dashboard = await agent.get("/api/v1/reports/dashboard");
    expect(dashboard.body.data.income).toBe("0.00");
    expect(dashboard.body.data.expenses).toBe("0.00");
  });

  it("blocks transfers between accounts owned by different users", async () => {
    const userA = createAgent();
    const userB = createAgent();
    const emailA = uniqueEmail("owner-a");
    const emailB = uniqueEmail("owner-b");
    emailsToCleanup.push(emailA, emailB);

    await registerUser(userA, { email: emailA });
    await registerUser(userB, { email: emailB });

    const victimAccount = await createAccount(userA, { name: "Secret", openingBalance: "1000" });
    const attackerAccount = await createAccount(userB, { name: "Attacker", openingBalance: "100" });

    const attempt = await userB.post("/api/v1/transfers").send({
      fromAccountId: victimAccount.body.data.id,
      toAccountId: attackerAccount.body.data.id,
      amount: "100",
      transferDate: new Date().toISOString().slice(0, 10),
    });

    expect(attempt.status).toBe(404);
  });

  it("rejects transfer to the same account", async () => {
    const agent = createAgent();
    const email = uniqueEmail("same-acct");
    emailsToCleanup.push(email);
    await registerUser(agent, { email });

    const account = await createAccount(agent, { name: "Solo", openingBalance: "100" });
    const id = account.body.data.id;

    const attempt = await agent.post("/api/v1/transfers").send({
      fromAccountId: id,
      toAccountId: id,
      amount: "10",
      transferDate: new Date().toISOString().slice(0, 10),
    });

    expect(attempt.status).toBe(400);
  });
});

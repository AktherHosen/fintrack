import { afterAll, describe, expect, it } from "vitest";
import { nanoid } from "nanoid";
import {
  createAgent,
  deleteUserByEmail,
  disconnectTestDb,
  loginUser,
  registerUser,
  uniqueEmail,
} from "../test/helpers.js";

describe("auth integration", () => {
  const emailsToCleanup: string[] = [];

  afterAll(async () => {
    for (const email of emailsToCleanup) {
      await deleteUserByEmail(email);
    }
    await disconnectTestDb();
  });

  it("registers a user and returns a session", async () => {
    const agent = createAgent();
    const email = uniqueEmail("auth");
    emailsToCleanup.push(email);

    const { res } = await registerUser(agent, { email });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
  });

  it("rejects invalid login credentials", async () => {
    const agent = createAgent();
    const email = uniqueEmail("badlogin");
    emailsToCleanup.push(email);

    await registerUser(agent, { email, password: "TestPass123!" });

    const bad = await loginUser(agent, email, "WrongPassword!");
    expect(bad.status).toBe(401);
    expect(bad.body.success).toBe(false);
  });

  it("logs out and clears the session", async () => {
    const agent = createAgent();
    const email = uniqueEmail("logout");
    emailsToCleanup.push(email);

    await registerUser(agent, { email });
    const logout = await agent.post("/api/v1/auth/logout");
    expect(logout.status).toBe(200);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(401);
  });
});

import { describe, it, expect } from "vitest";
import { addMoney, subMoney, budgetStatus } from "./money.js";

describe("money utils", () => {
  it("adds money correctly", () => {
    expect(addMoney("100.50", "25.25")).toBe("125.75");
  });

  it("subtracts money correctly", () => {
    expect(subMoney("100.00", "30.50")).toBe("69.50");
  });

  it("computes budget status", () => {
    expect(budgetStatus("50.00", "100.00")).toBe("UNDER_BUDGET");
    expect(budgetStatus("85.00", "100.00")).toBe("NEAR_LIMIT");
    expect(budgetStatus("110.00", "100.00")).toBe("OVER_BUDGET");
  });
});

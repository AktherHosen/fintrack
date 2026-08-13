import { Router, type IRouter, type Request } from "express";
import { createLoanSchema, updateLoanSchema, recordLoanPaymentSchema } from "@fintrack/shared";
import { FeatureKey } from "@fintrack/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { success } from "../../middleware/error-handler.js";
import { checkLimit } from "../../services/entitlements.service.js";
import {
  listLoans,
  getLoan,
  createLoan,
  updateLoan,
  closeLoan,
  recordLoanPayment,
  getLoanSummary,
} from "../../services/loan.service.js";
import { prisma } from "../../lib/prisma.js";

function paramId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

function uid(req: Request) {
  return req.user!.id;
}

export const loansRouter: IRouter = Router();
loansRouter.use(requireAuth);

loansRouter.get("/loans/summary", async (req, res, next) => {
  try {
    success(res, await getLoanSummary(uid(req)));
  } catch (e) {
    next(e);
  }
});

loansRouter.get("/loans", async (req, res, next) => {
  try {
    success(res, await listLoans(uid(req)));
  } catch (e) {
    next(e);
  }
});

loansRouter.get("/loans/:id", async (req, res, next) => {
  try {
    success(res, await getLoan(uid(req), paramId(req.params.id)));
  } catch (e) {
    next(e);
  }
});

loansRouter.post("/loans", validateBody(createLoanSchema), async (req, res, next) => {
  try {
    const count = await prisma.loan.count({
      where: { userId: uid(req), status: { not: "CLOSED" } },
    });
    await checkLimit(uid(req), FeatureKey.LOANS_LIMIT, count);

    const loan = await createLoan(uid(req), req.body);
    res.status(201);
    success(res, loan);
  } catch (e) {
    next(e);
  }
});

loansRouter.patch("/loans/:id", validateBody(updateLoanSchema), async (req, res, next) => {
  try {
    success(res, await updateLoan(uid(req), paramId(req.params.id), req.body));
  } catch (e) {
    next(e);
  }
});

loansRouter.delete("/loans/:id", async (req, res, next) => {
  try {
    success(res, await closeLoan(uid(req), paramId(req.params.id)));
  } catch (e) {
    next(e);
  }
});

loansRouter.post("/loans/:id/payments", validateBody(recordLoanPaymentSchema), async (req, res, next) => {
  try {
    const payment = await recordLoanPayment(uid(req), paramId(req.params.id), req.body);
    res.status(201);
    success(res, payment);
  } catch (e) {
    next(e);
  }
});

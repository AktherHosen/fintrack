# Architecture

## Model

Finance Tracker is a **single-user** personal finance SaaS. Every user owns their financial data directly via `userId`. There are no organizations, workspaces, teams, or member roles.

```
User
 ├── Accounts
 ├── Categories
 ├── Transactions
 ├── Transfers
 ├── Budgets
 ├── Recurring Transactions
 ├── Subscription
 └── Payments
```

## Roles

| Role | Description |
|------|-------------|
| `USER` | Normal application user |
| `SUPER_ADMIN` | Platform administrator (users, plans, payments, audit logs) |

SUPER_ADMIN is created only through controlled seed/setup — never via public registration.

## API structure

```
/api/v1/auth          — register, login, logout, password reset
/api/v1/me            — current user profile
/api/v1/accounts      — user accounts
/api/v1/transactions  — income/expense transactions
/api/v1/transfers     — account-to-account transfers
/api/v1/budgets       — budget management
/api/v1/reports       — financial reports
/api/v1/subscription  — plan and subscription
/api/v1/payments      — manual bKash payments
/api/v1/admin/*       — SUPER_ADMIN only
```

All user-scoped endpoints derive `userId` from the authenticated session. Never trust client-supplied ownership fields.

## Money

- Database: `NUMERIC(19, 4)` via Prisma `@db.Decimal(19, 4)`
- Application: Decimal.js via `@fintrack/shared/money`
- JSON serialization: strings (e.g. `"1250.50"`)

## Subscriptions

Feature access is driven by plan entitlements stored in `plans.features` JSON — not hardcoded plan names. The backend enforces limits; the frontend only reflects them.

## Greenfield reset

The codebase was previously built as multi-tenant (Organization + OrgMemberRole). Phase 1 stripped that architecture. Phase 2 introduces the spec-compliant single-user schema.

## Phase roadmap

1. **Project setup** — monorepo, tooling, minimal skeleton (current)
2. **Database** — full Prisma schema, migrations, seed data
3. **Authentication** — register, login, logout, password reset, email verification
4. **Accounts** — CRUD, balance calculation
5. **Categories** — defaults on registration, custom categories
6. **Transactions** — income/expense CRUD, search, filters, pagination
7. **Transfers** — atomic account-to-account moves
8. **Dashboard** — balance, cash flow, recent transactions, charts
9. **Budgets** — create, progress tracking, warnings
10. **Reports** — income vs expense, category breakdown, cash flow, account report
11. **Subscription** — plans, entitlements, usage limits, upgrade UI
12. **Manual payments** — bKash send-money, admin approval, subscription activation
13. **Super Admin** — dashboard, users, plans, payments, audit logs
14. **Security** — authorization testing, rate limiting, CORS, headers
15. **Production** — deployment, backups, monitoring

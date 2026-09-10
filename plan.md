# FinTrack — Full Project Roadmap & Execution Plan

A modern, full-stack personal finance, budget, loan, and subscription management application built with Vite, React, TypeScript, Tailwind CSS, ShadCN UI, Supabase (Auth, RLS, Storage), TanStack Query, Zustand, and i18next.

---

## 📅 Phase Overview & Timeline

| Phase        | Description                    | Key Deliverables                                                          |
| ------------ | ------------------------------ | ------------------------------------------------------------------------- |
| **Phase 1**  | Project Setup & Tooling        | Vite + React + TS, Tailwind CSS, ShadCN UI, Router, Zustand, i18n         |
| **Phase 2**  | Database Schema & Migrations   | 16 tables + 2 new (Banners), PostgreSQL RLS, triggers & seed data         |
| **Phase 3**  | Supabase Auth Integration      | Email/Password, JWT sessions, `useAuth` hook, protected routes            |
| **Phase 4**  | API Layer & Data Hooks         | TanStack Query hooks for all financial modules with offline/mock fallback |
| **Phase 5**  | Frontend Components & Pages    | 11 core pages, Desktop Sidebar, Mobile Bottom Nav, Glassmorphic UI        |
| **Phase 6**  | Banner Promotions System       | Audience targeting, frequency cap, dismiss logic, Carousel & Admin CRUD   |
| **Phase 7**  | Subscriptions & bKash Payments | Plan pricing, bKash TrxID submission, Admin approval & activation         |
| **Phase 8**  | Admin Dashboard                | User management, payment approvals, plan CRUD, banners, audit logs        |
| **Phase 9**  | Background & Edge Jobs         | pg_cron schedules, recurring runner, banner cleanup                       |
| **Phase 10** | Testing & Verification         | TypeScript checks, responsive verification, end-to-end validation         |

---

## 🗄️ Database Architecture (Supabase PostgreSQL + RLS)

### Tables

1. **`users`**: User profile synced with `auth.users(id)`
2. **`accounts`**: Cash, Bank, Mobile Banking (bKash, Nagad, Rocket), Investments
3. **`categories`**: Income & Expense categories with colors and icons
4. **`transactions`**: Income and expense tracking with account balance updates
5. **`transfers`**: Inter-account fund transfers
6. **`budgets`**: Monthly category budget targets and live progress
7. **`loans`**: Lent and Borrowed loan ledgers
8. **`loan_payments`**: Partial and full loan repayments
9. **`recurring_transactions`**: Subscriptions, bills, salary schedules
10. **`recurring_transaction_runs`**: Execution log of recurring schedules
11. **`plans`**: Free, Pro Monthly, Pro Yearly, Lifetime plans
12. **`subscriptions`**: Active user subscriptions & expiration tracking
13. **`payments`**: bKash / manual payment submissions and verification status
14. **`audit_logs`**: System security and mutation audit trail
15. **`banners`** _(NEW)_: Banner promotions, audience targeting, scheduling
16. **`banner_events`** _(NEW)_: Impression, click, and dismiss event analytics

---

## 📱 Page & Route Structure

- `/login` & `/register` & `/forgot-password` — Auth pages with branding & language switch
- `/` — Financial Dashboard (Metrics, Net Worth chart, Spending Donut, Banners, Recent activity)
- `/transactions` — Transaction ledger with search, category/account filters, and CSV export
- `/accounts` — Account manager (bKash, Bank, Cash, Card) with quick transfer
- `/budgets` — Category budget planner with visual thresholds (>80% warning, >100% danger)
- `/categories` — Custom income/expense category builder
- `/transfers` — Double-entry account transfers
- `/loans` — Debt & credit tracker with repayment milestones
- `/recurring` — Automated recurring bill and subscription manager
- `/reports` — Cashflow breakdowns, analytics, and projections
- `/more` / `/settings` — Profile, BDT/USD currency toggle, EN/BN localization, Theme
- `/admin` — System metrics, active subscriptions, revenue overview
- `/admin/users` — User lookup, status toggle, subscription overview
- `/admin/payments` — bKash payment verification queue (Approve/Reject)
- `/admin/banners` — Banner promotion campaign manager
- `/admin/audit-logs` — Security and audit log viewer

---

## 🚀 Execution Strategy

1. **Initialize Project Core**: Scaffold Vite React TS application with all dependencies in `package.json`.
2. **Setup Tailwind & Theme System**: Dark/Light mode, modern glassmorphic styling, and ShadCN component library primitives.
3. **Setup Database Scripts**: Write clean SQL migrations for Supabase in `supabase/migrations/`.
4. **Build API Client & Mock/Supabase Engine**: Seamless Supabase client with local mock mode fallback for instant, reliable local testing.
5. **Implement Modules & Pages**: Build all 11 pages, Auth, Banner carousel, bKash payment flow, and Admin panel.
6. **Verify and Validate**: Complete TypeScript compilation, verify all user journeys and responsive layouts.

# Finance Tracker

Mobile-first personal finance tracking SaaS. Single-user model.

## Quick start

```bash
docker compose up -d
pnpm install
pnpm db:generate
pnpm --filter @fintrack/api db:push
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health

## Default admin

- Email: `admin@fintrack.local`
- Password: `Admin123!`

## MVP features

- Register / login with httpOnly sessions
- Accounts, categories, income/expense transactions, transfers
- Mobile-first dashboard with FAB add transaction
- Budgets with progress tracking
- Reports (income, expenses, category breakdown)
- Free and Pro subscription plans
- Manual bKash payment + admin approval
- Super Admin dashboard

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architecture.

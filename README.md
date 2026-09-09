# FinTrack 💰

A modern, responsive, and fully-featured personal finance tracking application built with React, Vite, and TypeScript. FinTrack helps you monitor your expenses, manage budgets, track loans, and plan for your financial future.

## ✨ Features

- **Dashboard Analytics:** Visual insights into your income, expenses, and overall balance using interactive charts (Recharts).
- **Transaction Ledger:** A mobile-first, robust transaction management system with support for categories, dates, and filtering.
- **Budgeting System:** Set monthly budgets per category and track your spending against your goals.
- **Loan Management:** Keep track of lent and borrowed money, complete with payment history, remaining balances, and PDF statement generation.
- **Recurring Transactions:** Automate your regular subscriptions and bills so you never miss a payment.
- **Multi-language Support:** Full i18n support for English and Bengali (`react-i18next`).
- **Data Persistence:** Local storage fallback (`localDb`) with seamless integration to Supabase for cloud syncing.
- **Responsive Design:** Beautiful, mobile-first UI crafted with Tailwind CSS and Shadcn UI components.

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) (Shadcn UI architecture) + [Lucide Icons](https://lucide.dev/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Client State) + [TanStack Query v5](https://tanstack.com/query) (Server State)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Backend/Database:** [Supabase](https://supabase.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fintrack.git
   cd fintrack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials (if you plan to use cloud syncing):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *Note: If no Supabase credentials are provided, the app will gracefully fall back to local storage (mock database) for a seamless offline experience.*

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and visit `http://localhost:5173`.

## 📦 Building for Production

To build the app for production (e.g., deploying to cPanel, Vercel, Netlify):

```bash
npm run build
```

This will create a `dist` folder containing the optimized assets.

### cPanel / Apache Deployment
If you are deploying to an Apache server (like cPanel), the project automatically includes a `.htaccess` file in the `public` directory. This ensures that client-side routing works correctly by redirecting all requests to `index.html`. 

To deploy, simply compress the contents of the `dist` folder and extract them into your public root (e.g., `public_html/ft`).

## 📁 Project Structure

```
fintrack/
├── public/                 # Static assets and deployment config (.htaccess)
├── src/
│   ├── components/         # Reusable UI components (Shadcn, forms, modals)
│   ├── hooks/              # Custom React hooks & TanStack Query logic
│   ├── i18n/               # Internationalization configurations & locales
│   ├── lib/                # Utility functions, API clients, and Supabase config
│   ├── pages/              # Application views/routes
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript interfaces and database schemas
│   ├── App.tsx             # Main application entry point with routing
│   └── main.tsx            # React DOM rendering
├── package.json            # Project metadata and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler configuration
```

## 📜 Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run lint`: Runs ESLint to identify and report on patterns.
- `npm run format`: Formats code using Prettier.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.

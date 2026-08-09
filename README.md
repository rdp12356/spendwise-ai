# SpendWise AI

**Know what you spend. Know what you can afford.**

## Problem
Traditional expense trackers focus entirely on the past—they tell you where your money went after you've already spent it. For young adults and students, this retrospective view doesn't answer the most crucial daily question: "Can I afford to buy this right now?"

## Solution
SpendWise AI is an AI-powered financial decision assistant. Instead of just logging transactions, it takes your current balance, upcoming income, fixed expenses, and savings goals into account. It provides a real-time **Affordability Score** and an AI-driven personalized recommendation to help you decide whether your next purchase fits your financial situation.

## Key Features
- **Smart Dashboard**: Instantly view your current balance, total income, expenses, and a visual breakdown of your spending.
- **Savings Goals**: Track your progress towards multiple financial goals (e.g., a new laptop, vacation).
- **Purchase Advisor**: Enter a planned purchase to see its immediate impact on your balance and your savings goals.
- **AI Recommendations**: Get personalized, jargon-free advice on whether a purchase is a good idea right now, powered by Gemini AI.
- **Demo Data**: A one-click "Load Demo Data" button to instantly populate the dashboard for a quick evaluation.

## Why It Matters
Most expense trackers tell you where your money went. SpendWise AI helps you decide where your money should go next. By combining deterministic financial math with personalized AI insights, SpendWise AI builds better financial habits rather than just tracking bad ones.

## Tech Stack
- **Frontend**: React (TypeScript), Vite, Tailwind CSS, shadcn/ui
- **Routing**: React Router (SPA)
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **AI Engine**: Google Gemini Pro API

## Architecture
SpendWise AI follows a clean, modern single-page application (SPA) architecture:
1. **Presentation Layer**: React components handling UI, utilizing standard modern design principles and responsive layouts.
2. **State & Routing**: Context-based Auth state and declarative React Router layouts with protected routes.
3. **Service Layer**: 
    - `financeService.ts`: Pure, deterministic mathematical functions that calculate balances, goal impacts, and the core 0-100 Affordability Score.
    - `aiService.ts`: Handles the Gemini API prompt construction, data injection, and deterministic fallbacks if the API is unavailable.
4. **Data Layer**: Supabase client handling real-time CRUD operations against Postgres.

## Database Schema
- `profiles`: Stores user metadata and links to Auth UUID.
- `income`: Tracks all incoming funds (salary, gifts) with dates.
- `expenses`: Tracks all outgoing funds across categories (food, transport).
- `savings_goals`: Tracks specific financial targets with progress and deadlines.
- `purchase_analyses`: Persists historical Purchase Advisor queries and the generated AI advice.

## Security
- **Authentication**: Powered by Supabase Auth (Email/Password).
- **Row Level Security (RLS)**: Every single table enforces strict RLS policies. Users can only ever `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows where `user_id = auth.uid()`.
- **Environment Isolation**: No secrets are committed. All Supabase and AI keys are securely passed via Vite environment variables.

## AI Integration
The Purchase Advisor relies on the Google Gemini API. It receives a sanitized JSON object containing the user's balance, income, expenses, savings goals, and the purchase price.
The AI is strictly instructed to explain the financial impact concisely, never invent financial data, and never act as a regulated financial advisor. 
If the API fails, a robust **deterministic fallback** mechanism ensures the product remains fully functional, generating advice strictly based on the calculated Affordability Score.

## Local Setup
1. Clone the repository: `git clone <repo>`
2. Navigate to the project directory: `cd spendwise-ai`
3. Install dependencies: `npm install`
4. Set up environment variables (see below).
5. Run the dev server: `npm run dev`

## Environment Variables
Create a `.env` file in the root directory based on the `.env.example` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AI_API_KEY=your_gemini_api_key
```

## Deployment
SpendWise AI is optimized for Vercel deployment:
1. Push your code to GitHub.
2. Import the project in the Vercel dashboard.
3. Add the three Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AI_API_KEY`) in the Vercel settings.
4. Vercel will automatically run `npm run build` and deploy the application.

## Future Roadmap
- Plaid integration for read-only bank syncing.
- Multi-currency support.
- Granular recurring subscription detection.
- Mobile Native apps (React Native).

# POSTAI: AI Social Content Generator

POSTAI is a full-stack AI-powered application for generating social media content—including text, images, videos, and stories—using advanced language and generative models. It features user authentication (Google OAuth), subscription management (Stripe), and a modern React frontend.

## Features

- ✍️ AI Text Generation: Instantly create engaging captions, tweets, and posts.
- 🖼️ AI Image Creation: Generate stunning visuals from your ideas.
- 🎬 AI Video & Story Generation: Produce cinematic videos and narrated stories.
- ⚡ Instant Workflow: Streamlined, user-friendly content creation.
- 💳 Subscription Management: Multiple plans with Stripe integration.
- 🔑 Google Sign-In: Secure authentication with OAuth2.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, motion, lucide-react
- **Backend:** Node.js, Express, TypeScript
- **AI Services:** Google Gemini, Google GenAI
- **Payments:** Stripe
- **Auth:** Google OAuth2
- **Other:** Twitter API, dotenv, file-based storage

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/S-A-T-Y-A/POSTAI.git
   cd POSTAI
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your API keys and secrets.

4. **Run the app:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000) (or your configured port).

### Environment Variables

See `.env.example` for all required variables:

- `GEMINI_API_KEY`
- `TWITTER_API_KEY`, `TWITTER_API_KEY_SECRET`, etc.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`

### Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run preview` — Preview the production build
- `npm run lint` — Lint the codebase

## Usage

- Sign in with Google to access the app.
- Select your subscription plan.
- Use the Post Creator to generate text, images, videos, or stories.
- Manage your profile and subscription from the Profile page.

## File Structure

- `App.tsx` — Main React app entry
- `server.ts` — Express backend server
- `components/` — UI components (LandingPage, PostCreator, PlansPage, etc.)
- `services/aiService.ts` — AI integration logic
- `src/contexts/UserContext.tsx` — User authentication and context
- `.env.example` — Example environment variables

## Deployment

- Set all environment variables in your production environment.
- Build the app: `npm run build`
- Start the server: `npm start` (ensure your process manager uses `server.ts`)

## License

MIT

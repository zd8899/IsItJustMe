# IsItJustMe

An anonymous community platform where users share everyday frustrations using "negative question" templates like "Why is it so hard to...?". Connect with others who understand your struggles.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)
![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?style=flat-square&logo=trpc)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)

---

## Features

- **Anonymous Posting**: Share frustrations instantly without creating an account
- **Structured Format**: "Why is it so hard to...?" + "I am..." template
- **Categories**: Filter by Work, Relationships, Technology, Health, and more
- **Voting System**: Upvote/downvote posts and comments
- **Comments**: Engage with nested comment threads
- **Optional Accounts**: Sign up to track karma and post history
- **Hot & New Feeds**: Discover trending frustrations or fresh posts

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/isitjustme.git
   cd isitjustme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/isitjustme"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Start PostgreSQL** (using Docker)
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database** (categories)
   ```bash
   npx prisma db seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**
   ```
   http://localhost:3000
   ```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Playwright tests |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run database migrations |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **API** | tRPC |
| **Auth** | NextAuth.js |
| **State** | TanStack Query + Zustand |
| **Testing** | Playwright |

---

## Project Structure

```
src/
├── app/          # Next.js pages and routes
├── components/   # React components
├── server/       # tRPC routers and backend logic
├── lib/          # Utilities and configurations
├── hooks/        # Custom React hooks
└── stores/       # Zustand state stores
```

---

## Documentation

- [Product Requirements (PRD)](./docs/PRD.md)
- [Technical Architecture](./docs/ARCHITECTURE.md)

---

## License

MIT

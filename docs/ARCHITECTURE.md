# Technical Architecture: IsItJustMe

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router, SSR/SSG |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling (formal design system) |
| **React Query (TanStack Query)** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Backend API |
| **tRPC** | Type-safe API layer |
| **Prisma** | PostgreSQL ORM |
| **NextAuth.js** | Authentication |
| **bcrypt** | Password hashing |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **Prisma Migrate** | Schema migrations |

### Infrastructure & Tools
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Playwright** | E2E testing |
| **Docker** | Local PostgreSQL |

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Category     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ username        │       │ name            │
│ passwordHash    │       │ slug            │
│ karma           │       │ createdAt       │
│ createdAt       │       └────────┬────────┘
│ updatedAt       │                │
└────────┬────────┘                │
         │                         │
         │ 1:N                     │ 1:N
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────┐
│                    Post                      │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ frustration (text)                           │
│ identity (text)                              │
│ categoryId (FK)                              │
│ userId (FK, nullable - anonymous posts)      │
│ anonymousId (for session tracking)           │
│ upvotes                                      │
│ downvotes                                    │
│ score (computed: upvotes - downvotes)        │
│ commentCount                                 │
│ createdAt                                    │
│ updatedAt                                    │
└────────┬────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────┐
│                  Comment                     │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ content (text)                               │
│ postId (FK)                                  │
│ userId (FK, nullable)                        │
│ parentId (FK, nullable - for nesting)        │
│ anonymousId                                  │
│ upvotes                                      │
│ downvotes                                    │
│ score                                        │
│ createdAt                                    │
│ updatedAt                                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                   Vote                       │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ value (+1 or -1)                             │
│ postId (FK, nullable)                        │
│ commentId (FK, nullable)                     │
│ userId (FK, nullable)                        │
│ anonymousId (for anonymous votes)            │
│ ipHash (for rate limiting)                   │
│ createdAt                                    │
└─────────────────────────────────────────────┘
```

### Prisma Schema

```prisma
model User {
  id           String    @id @default(cuid())
  username     String    @unique
  passwordHash String
  karma        Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  posts        Post[]
  comments     Comment[]
  votes        Vote[]
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id           String    @id @default(cuid())
  frustration  String
  identity     String
  categoryId   String
  category     Category  @relation(fields: [categoryId], references: [id])
  userId       String?
  user         User?     @relation(fields: [userId], references: [id])
  anonymousId  String?
  upvotes      Int       @default(0)
  downvotes    Int       @default(0)
  score        Int       @default(0)
  commentCount Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  comments     Comment[]
  votes        Vote[]

  @@index([categoryId])
  @@index([score, createdAt])
  @@index([createdAt])
}

model Comment {
  id          String    @id @default(cuid())
  content     String
  postId      String
  post        Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  parentId    String?
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  anonymousId String?
  upvotes     Int       @default(0)
  downvotes   Int       @default(0)
  score       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  votes       Vote[]

  @@index([postId])
  @@index([parentId])
}

model Vote {
  id          String   @id @default(cuid())
  value       Int      // +1 or -1
  postId      String?
  post        Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  commentId   String?
  comment     Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  anonymousId String?
  ipHash      String
  createdAt   DateTime @default(now())

  @@unique([postId, userId])
  @@unique([postId, anonymousId])
  @@unique([commentId, userId])
  @@unique([commentId, anonymousId])
  @@index([ipHash])
}
```

---

## API Structure (tRPC)

### Router Organization

```
src/server/routers/
├── _app.ts          # Root router
├── post.ts          # Post operations
├── comment.ts       # Comment operations
├── vote.ts          # Voting operations
├── category.ts      # Category operations
└── user.ts          # User/auth operations
```

### Endpoints

#### Post Router (`post`)
| Procedure | Type | Description |
|-----------|------|-------------|
| `post.create` | mutation | Create new post |
| `post.getById` | query | Get single post with comments |
| `post.listHot` | query | Get hot posts (paginated) |
| `post.listNew` | query | Get new posts (paginated) |
| `post.listByCategory` | query | Get posts by category |
| `post.listByUser` | query | Get user's posts |

#### Comment Router (`comment`)
| Procedure | Type | Description |
|-----------|------|-------------|
| `comment.create` | mutation | Add comment to post |
| `comment.listByPost` | query | Get comments for post |

#### Vote Router (`vote`)
| Procedure | Type | Description |
|-----------|------|-------------|
| `vote.castPostVote` | mutation | Vote on post |
| `vote.castCommentVote` | mutation | Vote on comment |

#### Category Router (`category`)
| Procedure | Type | Description |
|-----------|------|-------------|
| `category.list` | query | Get all categories |

#### User Router (`user`)
| Procedure | Type | Description |
|-----------|------|-------------|
| `user.register` | mutation | Create account |
| `user.getProfile` | query | Get user profile |
| `user.getKarma` | query | Get karma breakdown |

---

## Folder Structure

```
IsItJustMe/
├── .tdad/                      # TDAD workflow files
│   └── workflows/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── README.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                 # Seed categories
│   └── migrations/
├── public/
│   └── fonts/                  # Formal fonts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home/Feed page
│   │   ├── post/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Post detail
│   │   ├── profile/
│   │   │   └── page.tsx        # User profile
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── trpc/
│   │       │   └── [trpc]/
│   │       │       └── route.ts
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Container.tsx
│   │   ├── post/
│   │   │   ├── PostForm.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostList.tsx
│   │   │   └── PostDetail.tsx
│   │   ├── comment/
│   │   │   ├── CommentForm.tsx
│   │   │   ├── CommentCard.tsx
│   │   │   └── CommentList.tsx
│   │   ├── vote/
│   │   │   └── VoteButtons.tsx
│   │   ├── feed/
│   │   │   ├── FeedTabs.tsx
│   │   │   └── CategoryFilter.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── UserMenu.tsx
│   ├── server/
│   │   ├── routers/
│   │   │   ├── _app.ts
│   │   │   ├── post.ts
│   │   │   ├── comment.ts
│   │   │   ├── vote.ts
│   │   │   ├── category.ts
│   │   │   └── user.ts
│   │   ├── trpc.ts             # tRPC setup
│   │   └── db.ts               # Prisma client
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config
│   │   ├── utils.ts            # Utility functions
│   │   ├── validations.ts      # Zod schemas
│   │   └── constants.ts        # App constants
│   ├── hooks/
│   │   ├── useVote.ts
│   │   └── useAnonymousId.ts
│   ├── stores/
│   │   └── feedStore.ts        # Zustand store
│   └── styles/
│       └── globals.css         # Tailwind + custom styles
├── tests/
│   ├── e2e/                    # Playwright tests
│   └── fixtures/
├── .env.example
├── .gitignore
├── docker-compose.yml          # Local PostgreSQL
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Hot Score Algorithm

```typescript
function calculateHotScore(
  upvotes: number,
  downvotes: number,
  createdAt: Date
): number {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = (createdAt.getTime() - new Date('2024-01-01').getTime()) / 1000;
  return sign * order + seconds / 45000;
}
```

---

## Rate Limiting Strategy

| Action | Limit | Window |
|--------|-------|--------|
| Anonymous post | 5 | 1 hour |
| Anonymous vote | 30 | 1 hour |
| Anonymous comment | 10 | 1 hour |
| Registered post | 20 | 1 hour |
| Registered vote | 100 | 1 hour |
| Registered comment | 50 | 1 hour |

Implementation: Use IP hash + Redis (or in-memory for MVP)

---

## Security Measures

1. **Input Validation**: Zod schemas on all inputs
2. **SQL Injection**: Prisma ORM (parameterized queries)
3. **XSS Prevention**: React's automatic escaping + DOMPurify for any HTML
4. **CSRF**: NextAuth.js built-in CSRF tokens
5. **Password Security**: bcrypt with cost factor 12
6. **Rate Limiting**: Per-IP tracking with configurable limits
7. **Anonymous ID**: UUID stored in localStorage (not sensitive data)

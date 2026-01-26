# Product Requirements Document: IsItJustMe

## Executive Summary

**IsItJustMe** is an anonymous community platform where users share everyday frustrations using "negative question" templates like "Why is it so hard to...?". The platform creates a supportive space for users to realize they're not alone in their daily struggles. With instant anonymous posting, optional user accounts, voting, and commenting features, IsItJustMe fosters genuine connection through shared human experiences. The formal UI aesthetic emphasizes the legitimacy and seriousness of users' concerns while maintaining a professional atmosphere.

---

## User Personas

### 1. Anonymous Venter (Primary)
- **Who:** Anyone experiencing daily frustrations
- **Goal:** Quickly share a frustration and see if others relate
- **Behavior:** Posts without creating an account, browses to feel validated
- **Need:** Zero-friction posting, instant community feedback

### 2. Engaged Community Member
- **Who:** Regular user who enjoys the community
- **Goal:** Build reputation, track their posts, engage with others
- **Behavior:** Creates an account, comments, votes, returns frequently
- **Need:** Profile page, karma tracking, post history

### 3. Browser/Lurker
- **Who:** Passive consumer of content
- **Goal:** Read relatable content, feel less alone
- **Behavior:** Scrolls feed, reads comments, rarely posts
- **Need:** Easy navigation, category filtering, good content discovery

---

## Core Features

### Must Have (MVP)

#### F1: Anonymous Post Creation
- Template-based posting: "Why is it so hard to [frustration]?"
- "I am [identity context]" field (e.g., "I am a parent", "I am a developer")
- Category selection from predefined list
- "Ask" button to submit
- No account required

#### F2: Category System
- Predefined categories: Work, Relationships, Technology, Health, Parenting, Finance, Daily Life, Social, Other
- Filter feed by category
- Category badges on posts

#### F3: Feed System
- **Hot Feed:** Weighted by votes, comments, and recency
- **New Feed:** Chronologically sorted (newest first)
- Category filtering overlay
- Infinite scroll pagination

#### F4: Voting System
- Upvote/downvote on posts
- Upvote/downvote on comments
- Vote counts displayed
- Anonymous users can vote (rate-limited by session/IP)
- Registered users: one vote per item

#### F5: Comment System
- Nested comments (2 levels max for simplicity)
- Anonymous commenting allowed
- Comment voting
- Comment count on post cards

#### F6: Optional User Accounts
- Simple signup: username + password (no email verification)
- Profile page showing:
  - Username
  - Join date
  - Total karma (post votes + comment votes)
  - List of their posts
- Login/logout functionality

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- Feed pagination loads in < 500ms
- Support 1000 concurrent users initially
- Database queries optimized with proper indexing

### Security
- Rate limiting on anonymous posts (5 posts per hour per IP)
- Rate limiting on votes (prevent manipulation)
- Input sanitization (prevent XSS)
- SQL injection prevention via ORM
- Password hashing with bcrypt
- CSRF protection on forms

### Scalability
- Stateless API design for horizontal scaling
- Database connection pooling
- CDN-ready static assets

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- Proper color contrast (formal style supports this)

### SEO
- Server-side rendering for public pages
- Meta tags for social sharing
- Semantic HTML structure

---

## User Flows

### Flow 1: Anonymous Post Creation
```
1. User lands on home page (feed)
2. User sees post creation form at top
3. User fills "Why is it so hard to..." field
4. User fills "I am..." field
5. User selects category from dropdown
6. User clicks "Ask" button
7. Post appears at top of "New" feed
8. User sees success confirmation
```

### Flow 2: Browse and Vote
```
1. User lands on home page (Hot feed default)
2. User scrolls through posts
3. User clicks upvote on relatable post
4. Vote count updates immediately
5. User can switch to "New" tab
6. User can filter by category
```

### Flow 3: Comment on Post
```
1. User clicks on a post card
2. Post detail page opens
3. User reads existing comments
4. User types comment in text area
5. User clicks "Reply"
6. Comment appears in thread
```

### Flow 4: User Registration
```
1. User clicks "Sign Up" in header
2. Modal/page shows registration form
3. User enters username and password
4. User clicks "Create Account"
5. Account created, user logged in
6. User redirected to home with profile access
```

### Flow 5: View Profile
```
1. Logged-in user clicks profile icon
2. Profile page shows:
   - Username
   - Karma score
   - Join date
   - List of their posts
3. User can click on any post to view it
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users | 500+ within 3 months |
| Posts per day | 100+ |
| Average session duration | 5+ minutes |
| Bounce rate | < 40% |
| User registration rate | 10% of active users |

---

## Timeline Estimate

| Phase | Features | Duration |
|-------|----------|----------|
| Phase 1 (MVP) | F1-F6 | Core launch |
| Phase 2 | F7-F9 | Enhancement |
| Phase 3 | F10-F12 | Growth features |

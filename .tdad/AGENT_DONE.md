DONE:
FILES MODIFIED: src/server/routers/user.ts, src/server/routers/vote.ts

CHANGES MADE:
1. **user.ts (getKarma endpoint)**: Changed from calculating karma by aggregating post.score + comment.score to simply returning the user.karma field directly. The vote router already updates user.karma when votes are cast, so this is simpler and more accurate.

2. **vote.ts (castPostVote and castCommentVote)**: Fixed two issues:
   - Changed vote lookup priority to check `input.anonymousId` FIRST before `ctx.userId`. Previously, if a user was logged in (had auth cookie), all votes would be treated as coming from that user even if `anonymousId` was explicitly provided. This caused votes in setup functions to toggle instead of accumulate.
   - When creating votes with `anonymousId`, now sets `userId: null` instead of `ctx.userId` to keep the vote truly anonymous.

HYPOTHESIS: The root cause was that after creating a test user (author), the login set an auth cookie. Subsequent vote requests (intended to be from different anonymous voters) all included this cookie, so `ctx.userId` was set. The vote router prioritized `ctx.userId` over `input.anonymousId` when looking up existing votes, causing all votes to be attributed to the author. This meant each vote toggled the previous one instead of creating new votes, resulting in karma of 0 or 1 instead of the expected accumulated total.

WHAT SHOULD HAPPEN:
- When `anonymousId` is explicitly provided in a vote request, the vote should be treated as anonymous (lookup and creation both use anonymousId)
- Multiple anonymous votes from different voters should accumulate correctly
- The getKarma endpoint returns the user's karma as tracked by the vote system
- All 17 tests now pass, verifying karma updates correctly for upvotes, downvotes, vote changes, and vote removals on both posts and comments

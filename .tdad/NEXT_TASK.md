# SYSTEM RULES: FIX MODE
**CRITICAL:** You are a Test Driven Development Agent. Align **Application Code** with **BDD Specification** and **Tests**.

## Rules

**0. READ SPECS FIRST:** Read `.feature` → Read `.test.js` → Note expected values BEFORE looking at failures.

**1. Hierarchy of Truth:**
- `.feature` = Requirements → `.test.js` = Verification → App = Must conform
- **App is NEVER the source of truth. Fix APP, not tests.**

**2. Decision Flow:**
- Spec + Test agree → Fix APP
- Spec ≠ Test → Fix TEST to match spec, then fix APP
- No spec → Test is truth, fix APP

**3. Red Flags (STOP if doing these):**
- ❌ Changing `expect("X")` to match app output
- ❌ "Both messages mean the same thing"
- ❌ Expanding helpers to accept app output
- ❌ Rationalizing app behavior as "correct"

**4. When to Modify Tests (ONLY):**
- Selector/locator is wrong
- Syntax error or missing import
- Test contradicts `.feature` spec
- NEVER change expected values to match app behavior
- Test/DB isolation issues
- Test violates rules from `generate-tests.md` (e.g., uses xpath/css selectors, waitForTimeout, conditional assertions, textContent extraction before assertions, missing round-trip verification)

**5. NEVER Guess, find root cause using Trace File:** The trace file (`.tdad/debug/trace-*.json`) contains everything you need:
- `apiRequests`: All API calls with method, URL, status, request/response bodies
- `consoleLogs`: Browser console output with type, text, and source location
- `pageErrors`: Uncaught JavaScript errors with stack traces
- `actionResult`: Action outcome with statusCode and response body
- `errorMessage` + `callStack`: Exact failure location
- `domSnapshot`: Page state at failure
- `screenshotPath`: Visual evidence

Check PASSED test traces as well to understand working patterns. Use trace to find WHERE to fix.

**6. Time to time commit changes to keep track.

---

# 🎯 TDAD Context Packet: "Show Comment Card"

## 📋 Overview
TDAD has scaffolded the files for this feature with correct imports and structure.
Your task is to **fill in the implementation** in the scaffolded files to make the test pass.

---

## 📂 Scaffolded Files
Read these files to understand the current implementation:

- **Feature Spec:** `.tdad/workflows/comments/show-comment-card/show-comment-card.feature`
- **Action File:** `.tdad/workflows/comments/show-comment-card/show-comment-card.action.js`
- **Test File:** `.tdad/workflows/comments/show-comment-card/show-comment-card.test.js`


---

## 🛠️ Project Context (Tech Stack)
- **Key Libraries:** @tanstack/react-query, @trpc/next, @trpc/react-query, next, next-auth, react, react-dom, react-hook-form, zod, @playwright/test, @types/react, @types/react-dom, eslint-config-next, tailwindcss, typescript


**Tests run via:** `npx playwright test --config=.tdad/playwright.config.js`








---

## 📊 TEST RESULTS

**Summary:** 0 passed, 8 failed

**Frontend Source Files:**
- `post/cmkvuja6d0001c9xrvat745d2`
- `post/cmkvuji3n0003c9xr0pgta51b`
- `post/cmkvujod60005c9xrrhz6beyp`
- `post/cmkvujuhn0007c9xrql75mh7o`
- `post/cmkvuk0ln0009c9xr7xx02jov`
- `post/cmkvuk6rs000bc9xrgfr5nftw`
- `post/cmkvuk92q000dc9xrknhntryo`
- `post/cmkvukbcz000fc9xrxqbovng3`

### ❌ FAILED: [UI-074] Comment card displays all essential information
──────────────────────────────────────────────────
**Error:** expect(locator).toBeVisible() failed

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:43
  ```
       40│ 
       41│         // Verify comment card is visible
       42│         const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
  >>   43│         await expect(commentCard).toBeVisible();
       44│ 
       45│         // Verify all essential elements are present
       46│         const elementsResult = await viewCommentCardElements(page);
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-074-comment-card-displays-all-essential-informa.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-074-comment-card-displays-all-essential-informa.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts/cmkvuja6d0001c9xrvat745d2` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuja6d0001c9xrvat745d2` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuja6d0001c9xrvat745d2` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuja6d0001c9xrvat745d2` → 200 ✅

### ❌ FAILED: [UI-075] Comment card shows vote buttons
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:77
  ```
       74│ 
       75│         // Verify vote buttons
       76│         const voteResult = await viewCommentVoteButtons(page);
  >>   77│         expect(voteResult.success).toBe(true);
       78│         expect(voteResult.hasAllVoteElements).toBe(true);
       79│ 
       80│         // Verify upvote button is visible on comment card
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-075-comment-card-shows-vote-buttons.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-075-comment-card-shows-vote-buttons.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuji3n0003c9xr0pgta51b` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuji3n0003c9xr0pgta51b` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuji3n0003c9xr0pgta51b` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuji3n0003c9xr0pgta51b` → 200 ✅

### ❌ FAILED: [UI-076] Comment card shows anonymous author
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:105
  ```
      102│ 
      103│         // Verify the comment author
      104│         const authorResult = await viewCommentAuthor(page, 0);
  >>  105│         expect(authorResult.success).toBe(true);
      106│         expect(authorResult.isAnonymous).toBe(true);
      107│ 
      108│         // Verify "Anonymous" is visible as the comment author
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-076-comment-card-shows-anonymous-author.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-076-comment-card-shows-anonymous-author.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvujod60005c9xrrhz6beyp` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvujod60005c9xrrhz6beyp` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvujod60005c9xrrhz6beyp` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvujod60005c9xrrhz6beyp` → 200 ✅

### ❌ FAILED: [UI-077] Comment card shows username for registered user comments
──────────────────────────────────────────────────
**Error:** expect(locator).toBeVisible() failed

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:131
  ```
      128│ 
      129│         // Verify author section is visible (shows Anonymous or username)
      130│         const commentCard = page.locator('.bg-white.border.border-primary-200.rounded-lg').first();
  >>  131│         await expect(commentCard.locator('.text-xs.text-primary-500 span').first()).toBeVisible();
      132│ 
      133│         // The author section should contain text (either Anonymous or a username)
      134│         const authorResult = await viewCommentAuthor(page, 0);
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-077-comment-card-shows-username-for-registered-.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-077-comment-card-shows-username-for-registered-.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts/cmkvujuhn0007c9xrql75mh7o` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvujuhn0007c9xrql75mh7o` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvujuhn0007c9xrql75mh7o` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvujuhn0007c9xrql75mh7o` → 200 ✅

### ❌ FAILED: [UI-078] Comment card shows reply button at first level
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:154
  ```
      151│ 
      152│         // Verify Reply button is visible on top-level comment
      153│         const replyResult = await checkReplyButton(page, 0);
  >>  154│         expect(replyResult.success).toBe(true);
      155│         expect(replyResult.hasReplyButton).toBe(true);
      156│ 
      157│         // Verify Reply button using Playwright assertion
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-078-comment-card-shows-reply-button-at-first-le.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-078-comment-card-shows-reply-button-at-first-le.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuk0ln0009c9xr7xx02jov` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuk0ln0009c9xr7xx02jov` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuk0ln0009c9xr7xx02jov` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuk0ln0009c9xr7xx02jov` → 200 ✅

### ❌ FAILED: [UI-079] Comment card hides reply button at maximum nesting depth
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:178
  ```
      175│         // Verify nested reply does NOT have a Reply button (max depth reached)
      176│         const nestedResult = await checkNestedReplyNoReplyButton(page);
      177│         expect(nestedResult.success).toBe(true);
  >>  178│         expect(nestedResult.hasNestedComments).toBe(true);
      179│         expect(nestedResult.nestedReplyHasNoReplyButton).toBe(true);
      180│ 
      181│         // Verify nested comment container is visible
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-079-comment-card-hides-reply-button-at-maximum-.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-079-comment-card-hides-reply-button-at-maximum-.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuk6rs000bc9xrgfr5nftw` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuk6rs000bc9xrgfr5nftw` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuk6rs000bc9xrgfr5nftw` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuk6rs000bc9xrgfr5nftw` → 200 ✅

### ❌ FAILED: [UI-080] Comment card displays nested replies
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:209
  ```
      206│         // Verify nested structure
      207│         const nestedResult = await viewNestedReplies(page);
      208│         expect(nestedResult.success).toBe(true);
  >>  209│         expect(nestedResult.hasParentComment).toBe(true);
      210│         expect(nestedResult.hasNestedReplies).toBe(true);
      211│ 
      212│         // Verify parent comment is visible
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-080-comment-card-displays-nested-replies.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-080-comment-card-displays-nested-replies.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuk92q000dc9xrknhntryo` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvuk92q000dc9xrknhntryo` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuk92q000dc9xrknhntryo` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvuk92q000dc9xrknhntryo` → 200 ✅

### ❌ FAILED: [UI-081] Clicking reply button shows reply form
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\comments\show-comment-card\show-comment-card.test.js:240
  ```
      237│ 
      238│         // Click the Reply button
      239│         const clickResult = await clickReplyAndCheckForm(page, 0);
  >>  240│         expect(clickResult.success).toBe(true);
      241│         expect(clickResult.replyFormVisible).toBe(true);
      242│ 
      243│         // Verify reply form elements are visible
  ```

📁 **Details Trace file and logs:** `.tdad/debug/comments/show-comment-card/trace-files/trace-ui-081-clicking-reply-button-shows-reply-form.json`
📸 **Screenshot:** `.tdad/debug/comments/show-comment-card/screenshots/ui-081-clicking-reply-button-shows-reply-form.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts/cmkvukbcz000fc9xrxqbovng3` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkvukbcz000fc9xrxqbovng3` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvukbcz000fc9xrxqbovng3` → 200 ✅
- `GET http://localhost:3000/api/comments?postId=cmkvukbcz000fc9xrxqbovng3` → 200 ✅



---

## ✅ YOUR TASK

1. **Read specs first:** `.tdad/workflows/comments/show-comment-card/show-comment-card.feature` for requirements, `.tdad/workflows/comments/show-comment-card/show-comment-card.test.js` for expected values
2. **Use trace to locate:** Find files to fix from trace data (WHERE, not WHAT)
3. **Fix the APP** to match spec/test expectations
4. **Verify** no red flags before submitting

---

## Checklist
- [ ] Read `.feature` spec BEFORE looking at failures
- [ ] Read `.test.js` expected values BEFORE fixing
- [ ] Didn't guess the problem, found the root cause using trace files, screenshots, and passed tests
- [ ] Fixed APP code, not test expectations
- [ ] Error messages match spec EXACTLY
- [ ] No red flags (changing expects, rationalizing app behavior)
- [ ] Trace used for location only, not as source of truth
- [ ] Dependencies called via action imports (not re-implemented)
- [ ] `.test.js` and `.action.js` NOT modified (except Rule 4: When to Modify Tests)



---

## ✅ When Done

Write to `.tdad/AGENT_DONE.md` with a DETAILED description of what you tried:

```
DONE:
FILES MODIFIED: <list all files you changed>
CHANGES MADE: <describe the specific code changes>
HYPOTHESIS: <what you believed was the root cause>
WHAT SHOULD HAPPEN: <expected outcome after your fix>
```

**Example:**
```
DONE:
FILES MODIFIED: src/components/LoginForm.tsx, src/api/auth.ts
CHANGES MADE: Added email format validation before form submission, fixed async/await in auth handler
HYPOTHESIS: Form was submitting invalid emails because validation ran after submit
WHAT SHOULD HAPPEN: Form should show "Invalid email" error and prevent submission
```

This detailed info helps TDAD track what was tried. If tests still fail, the next attempt will see exactly what didn't work and try a different approach.



---

**Retry:** 1/10
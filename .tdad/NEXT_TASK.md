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

# 🎯 TDAD Context Packet: "Create Prisma Schema"

## 📋 Overview
TDAD has scaffolded the files for this feature with correct imports and structure.
Your task is to **fill in the implementation** in the scaffolded files to make the test pass.

---

## 📂 Scaffolded Files
Read these files to understand the current implementation:

- **Feature Spec:** `.tdad/workflows/database/create-prisma-schema/create-prisma-schema.feature`
- **Action File:** `.tdad/workflows/database/create-prisma-schema/create-prisma-schema.action.js`
- **Test File:** `.tdad/workflows/database/create-prisma-schema/create-prisma-schema.test.js`


---

## 🛠️ Project Context (Tech Stack)
- **Key Libraries:** @tanstack/react-query, @trpc/next, @trpc/react-query, next, next-auth, react, react-dom, react-hook-form, zod, @playwright/test, @types/react, @types/react-dom, eslint-config-next, tailwindcss, typescript


**Tests run via:** `npx playwright test --config=.tdad/playwright.config.js`








---

## 📊 TEST RESULTS

**Summary:** 16 passed, 5 failed

### ❌ FAILED: [API-015] Prevent duplicate vote on post by same user
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\database\create-prisma-schema\create-prisma-schema.test.js:513
  ```
      510│     });
      511│ 
      512│     // Assertions - expect failure for duplicate vote
  >>  513│     expect(result.statusCode).toBe(400);
      514│     expect(result.error).toContain('Already voted');
      515│   });
      516│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-015-prevent-duplicate-vote-on-post-by-same-use.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-016] Prevent duplicate vote on post by same anonymous user
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\database\create-prisma-schema\create-prisma-schema.test.js:554
  ```
      551│     });
      552│ 
      553│     // Assertions - expect failure for duplicate vote
  >>  554│     expect(result.statusCode).toBe(400);
      555│     expect(result.error).toContain('Already voted');
      556│   });
      557│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-016-prevent-duplicate-vote-on-post-by-same-ano.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-019] Query posts by category efficiently
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\database\create-prisma-schema\create-prisma-schema.test.js:691
  ```
      688│     });
      689│ 
      690│     // Assertions
  >>  691│     expect(result.success).toBe(true);
      692│     expect(result.statusCode).toBe(200);
      693│     expect(Array.isArray(result.posts)).toBe(true);
      694│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-019-query-posts-by-category-efficiently.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-020] Query posts sorted by score and date (hot)
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\database\create-prisma-schema\create-prisma-schema.test.js:733
  ```
      730│     // Assertions
      731│     expect(result.success).toBe(true);
      732│     expect(result.statusCode).toBe(200);
  >>  733│     expect(Array.isArray(result.posts)).toBe(true);
      734│     // Posts should be returned (sorted by hot score algorithm)
      735│   });
      736│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-020-query-posts-sorted-by-score-and-date-hot.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-021] Query posts sorted by creation date (new)
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\database\create-prisma-schema\create-prisma-schema.test.js:771
  ```
      768│     // Assertions
      769│     expect(result.success).toBe(true);
      770│     expect(result.statusCode).toBe(200);
  >>  771│     expect(Array.isArray(result.posts)).toBe(true);
      772│ 
      773│     // Posts should be sorted by createdAt descending (newest first)
      774│     if (result.posts.length >= 2) {
  ```

📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-021-query-posts-sorted-by-creation-date-new.json`
📡 **API Calls:** (none)

### ✅ PASSED TESTS (16)
──────────────────────────────────────────────────

**✅ [API-001] Create user with required fields**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-001-create-user-with-required-fields.json`
📡 **API Calls:** (none)

**✅ [API-002] User username must be unique**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-002-user-username-must-be-unique.json`
📡 **API Calls:** (none)

**✅ [API-003] List all categories**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-003-list-all-categories.json`
📡 **API Calls:** (none)

**✅ [API-004] Category name and slug must be unique**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-004-category-name-and-slug-must-be-unique.json`
📡 **API Calls:** (none)

**✅ [API-005] Create anonymous post with required fields**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-005-create-anonymous-post-with-required-fields.json`
📡 **API Calls:** (none)

**✅ [API-006] Create post with user association**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-006-create-post-with-user-association.json`
📡 **API Calls:** (none)

**✅ [API-007] Post must have valid category reference**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-007-post-must-have-valid-category-reference.json`
📡 **API Calls:** (none)

**✅ [API-008] Get post by ID with category relation**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-008-get-post-by-id-with-category-relation.json`
📡 **API Calls:** (none)

**✅ [API-009] Create comment on post**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-009-create-comment-on-post.json`
📡 **API Calls:** (none)

**✅ [API-010] Create nested comment reply**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-010-create-nested-comment-reply.json`
📡 **API Calls:** (none)

**✅ [API-011] Comment must reference valid post**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-011-comment-must-reference-valid-post.json`
📡 **API Calls:** (none)

**✅ [API-012] Deleting post cascades to comments**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-012-deleting-post-cascades-to-comments.json`
📡 **API Calls:** (none)

**✅ [API-013] Cast upvote on post**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-013-cast-upvote-on-post.json`
📡 **API Calls:** (none)

**✅ [API-014] Cast downvote on comment**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-014-cast-downvote-on-comment.json`
📡 **API Calls:** (none)

**✅ [API-017] Deleting post cascades to votes**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-017-deleting-post-cascades-to-votes.json`
📡 **API Calls:** (none)

**✅ [API-018] Deleting comment cascades to votes**
📁 **Details Trace file and logs:** `.tdad/debug/database/create-prisma-schema/trace-files/trace-api-018-deleting-comment-cascades-to-votes.json`
📡 **API Calls:** (none)


---

## ✅ YOUR TASK

1. **Read specs first:** `.tdad/workflows/database/create-prisma-schema/create-prisma-schema.feature` for requirements, `.tdad/workflows/database/create-prisma-schema/create-prisma-schema.test.js` for expected values
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
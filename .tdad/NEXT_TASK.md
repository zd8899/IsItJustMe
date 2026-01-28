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

# 🎯 TDAD Context Packet: "Show Post Card"

## 📋 Overview
TDAD has scaffolded the files for this feature with correct imports and structure.
Your task is to **fill in the implementation** in the scaffolded files to make the test pass.

---

## 📂 Scaffolded Files
Read these files to understand the current implementation:

- **Feature Spec:** `.tdad/workflows/posts/show-post-card/show-post-card.feature`
- **Action File:** `.tdad/workflows/posts/show-post-card/show-post-card.action.js`
- **Test File:** `.tdad/workflows/posts/show-post-card/show-post-card.test.js`


---

## 🛠️ Project Context (Tech Stack)
- **Key Libraries:** @tanstack/react-query, @trpc/next, @trpc/react-query, next, next-auth, react, react-dom, react-hook-form, zod, @playwright/test, @types/react, @types/react-dom, eslint-config-next, tailwindcss, typescript


**Tests run via:** `npx playwright test --config=.tdad/playwright.config.js`








---

## 📊 TEST RESULTS

**Summary:** 5 passed, 1 failed

### ❌ FAILED: [UI-048] Post card shows username for registered user posts
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\posts\show-post-card\show-post-card.test.js:97
  ```
       94│         // Check for registered user author
       95│         const result = await viewRegisteredUserPostCard(page);
       96│         expect(result.success).toBe(true);
  >>   97│         expect(result.hasUsernameAuthor).toBe(true);
       98│ 
       99│         // Verify "by [username]" pattern is visible
      100│         await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').filter({ hasText: /by \w+/ }).first()).toBeVisible();
  ```

📁 **Details Trace file and logs:** `.tdad/debug/posts/show-post-card/trace-files/trace-ui-048-post-card-shows-username-for-registered-use.json`
📸 **Screenshot:** `.tdad/debug/posts/show-post-card/screenshots/ui-048-post-card-shows-username-for-registered-use.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅

### ✅ PASSED TESTS (5)
──────────────────────────────────────────────────

**✅ [UI-045] Post card displays all essential information**
📁 **Details Trace file and logs:** `.tdad/debug/posts/show-post-card/trace-files/trace-ui-045-post-card-displays-all-essential-informatio.json`
📸 **Screenshot:** `.tdad/debug/posts/show-post-card/screenshots/ui-045-post-card-displays-all-essential-informatio.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅

**✅ [UI-046] Post card shows vote buttons**
📁 **Details Trace file and logs:** `.tdad/debug/posts/show-post-card/trace-files/trace-ui-046-post-card-shows-vote-buttons.json`
📸 **Screenshot:** `.tdad/debug/posts/show-post-card/screenshots/ui-046-post-card-shows-vote-buttons.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅

**✅ [UI-047] Post card shows anonymous author**
📁 **Details Trace file and logs:** `.tdad/debug/posts/show-post-card/trace-files/trace-ui-047-post-card-shows-anonymous-author.json`
📸 **Screenshot:** `.tdad/debug/posts/show-post-card/screenshots/ui-047-post-card-shows-anonymous-author.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅

**✅ [UI-049] Post card is clickable and navigates to detail page**
📁 **Details Trace file and logs:** `.tdad/debug/posts/show-post-card/trace-files/trace-ui-049-post-card-is-clickable-and-navigates-to-det.json`
📸 **Screenshot:** `.tdad/debug/posts/show-post-card/screenshots/ui-049-post-card-is-clickable-and-navigates-to-det.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkxdhlzg00akbajnt8uv8uyu` → 200 ✅
- `GET http://localhost:3000/api/posts/cmkxdhlzg00akbajnt8uv8uyu` → 200 ✅

**✅ [UI-050] Post card displays comment count correctly**
📁 **Details Trace file and logs:** `.tdad/debug/posts/show-post-card/trace-files/trace-ui-050-post-card-displays-comment-count-correctly.json`
📸 **Screenshot:** `.tdad/debug/posts/show-post-card/screenshots/ui-050-post-card-displays-comment-count-correctly.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/categories` → 200 ✅
- `GET http://localhost:3000/api/posts?sortBy=hot` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅


---

## ✅ YOUR TASK

1. **Read specs first:** `.tdad/workflows/posts/show-post-card/show-post-card.feature` for requirements, `.tdad/workflows/posts/show-post-card/show-post-card.test.js` for expected values
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
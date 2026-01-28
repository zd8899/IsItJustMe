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

# 🎯 TDAD Context Packet: "Fetch Posts By Category"

## 📋 Overview
TDAD has scaffolded the files for this feature with correct imports and structure.
Your task is to **fill in the implementation** in the scaffolded files to make the test pass.

---

## 📂 Scaffolded Files
Read these files to understand the current implementation:

- **Feature Spec:** `.tdad/workflows/feed/fetch-posts-by-category/fetch-posts-by-category.feature`
- **Action File:** `.tdad/workflows/feed/fetch-posts-by-category/fetch-posts-by-category.action.js`
- **Test File:** `.tdad/workflows/feed/fetch-posts-by-category/fetch-posts-by-category.test.js`


---

## 🛠️ Project Context (Tech Stack)
- **Key Libraries:** @tanstack/react-query, @trpc/next, @trpc/react-query, next, next-auth, react, react-dom, react-hook-form, zod, @playwright/test, @types/react, @types/react-dom, eslint-config-next, tailwindcss, typescript


**Tests run via:** `npx playwright test --config=.tdad/playwright.config.js`








---

## 📊 TEST RESULTS

**Summary:** 3 passed, 8 failed

### ❌ FAILED: [API-312] Fetch posts by category returns filtered posts
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:59
  ```
       56│         tdadTrace.setActionResult(result);
       57│ 
       58│         // Assertions
  >>   59│         expect(result.success).toBe(true);
       60│         expect(result.statusCode).toBe(200);
       61│         expect(Array.isArray(result.posts)).toBe(true);
       62│         expect(result.posts.length).toBeGreaterThan(0);
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-312-fetch-posts-by-category-returns-filtered-p.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-313] Fetch posts by category returns post data with required fields
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:91
  ```
       88│         tdadTrace.setActionResult(result);
       89│ 
       90│         // Assertions
  >>   91│         expect(result.success).toBe(true);
       92│         expect(result.statusCode).toBe(200);
       93│         expect(result.posts.length).toBeGreaterThan(0);
       94│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-313-fetch-posts-by-category-returns-post-data-.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-314] Fetch posts by category with default pagination limit
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:134
  ```
      131│         tdadTrace.setActionResult(result);
      132│ 
      133│         // Assertions
  >>  134│         expect(result.success).toBe(true);
      135│         expect(result.statusCode).toBe(200);
      136│         expect(Array.isArray(result.posts)).toBe(true);
      137│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-314-fetch-posts-by-category-with-default-pagin.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-315] Fetch posts by category with custom limit
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:169
  ```
      166│         tdadTrace.setActionResult(result);
      167│ 
      168│         // Assertions
  >>  169│         expect(result.success).toBe(true);
      170│         expect(result.statusCode).toBe(200);
      171│         expect(Array.isArray(result.posts)).toBe(true);
      172│         expect(result.posts.length).toBeLessThanOrEqual(10);
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-315-fetch-posts-by-category-with-custom-limit.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-316] Fetch posts by category with cursor-based pagination
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:199
  ```
      196│         });
      197│ 
      198│         // Assertions for first page
  >>  199│         expect(firstPageResult.success).toBe(true);
      200│         expect(firstPageResult.statusCode).toBe(200);
      201│         expect(firstPageResult.posts.length).toBeGreaterThan(0);
      202│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-316-fetch-posts-by-category-with-cursor-based-.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-317] Fetch posts by category returns empty array when category has no posts
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:249
  ```
      246│         tdadTrace.setActionResult(result);
      247│ 
      248│         // Assertions - verify the response format is correct
  >>  249│         expect(result.success).toBe(true);
      250│         expect(result.statusCode).toBe(200);
      251│         expect(Array.isArray(result.posts)).toBe(true);
      252│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-317-fetch-posts-by-category-returns-empty-arra.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-318] Fetch posts by category with invalid category slug
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:276
  ```
      273│ 
      274│         // Assertions - expect 404 for non-existent category
      275│         expect(result.success).toBe(false);
  >>  276│         expect(result.statusCode).toBe(404);
      277│ 
      278│         const errorMessage = getErrorFromResult(result);
      279│         expect(errorMessage).toBeTruthy();
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-318-fetch-posts-by-category-with-invalid-categ.json`
📡 **API Calls:** (none)

### ❌ FAILED: [API-322] Fetch posts by category returns posts sorted by creation date descending
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\feed\fetch-posts-by-category\fetch-posts-by-category.test.js:395
  ```
      392│         tdadTrace.setActionResult(result);
      393│ 
      394│         // Assertions
  >>  395│         expect(result.success).toBe(true);
      396│         expect(result.statusCode).toBe(200);
      397│         expect(result.posts.length).toBeGreaterThan(0);
      398│ 
  ```

📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-322-fetch-posts-by-category-returns-posts-sort.json`
📡 **API Calls:** (none)

### ✅ PASSED TESTS (3)
──────────────────────────────────────────────────

**✅ [API-319] Fetch posts by category without required categorySlug parameter**
📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-319-fetch-posts-by-category-without-required-c.json`
📡 **API Calls:** (none)

**✅ [API-320] Fetch posts by category with invalid limit below minimum**
📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-320-fetch-posts-by-category-with-invalid-limit.json`
📡 **API Calls:** (none)

**✅ [API-321] Fetch posts by category with invalid limit above maximum**
📁 **Details Trace file and logs:** `.tdad/debug/feed/fetch-posts-by-category/trace-files/trace-api-321-fetch-posts-by-category-with-invalid-limit.json`
📡 **API Calls:** (none)


---

## ✅ YOUR TASK

1. **Read specs first:** `.tdad/workflows/feed/fetch-posts-by-category/fetch-posts-by-category.feature` for requirements, `.tdad/workflows/feed/fetch-posts-by-category/fetch-posts-by-category.test.js` for expected values
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
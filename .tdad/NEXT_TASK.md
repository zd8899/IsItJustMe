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

# 🎯 TDAD Context Packet: "Show Register Form"

## 📋 Overview
TDAD has scaffolded the files for this feature with correct imports and structure.
Your task is to **fill in the implementation** in the scaffolded files to make the test pass.

---

## 📂 Scaffolded Files
Read these files to understand the current implementation:

- **Feature Spec:** `.tdad/workflows/auth/show-register-form/show-register-form.feature`
- **Action File:** `.tdad/workflows/auth/show-register-form/show-register-form.action.js`
- **Test File:** `.tdad/workflows/auth/show-register-form/show-register-form.test.js`


---

## 🛠️ Project Context (Tech Stack)
- **Key Libraries:** @tanstack/react-query, @trpc/next, @trpc/react-query, next, next-auth, react, react-dom, react-hook-form, zod, @playwright/test, @types/react, @types/react-dom, eslint-config-next, tailwindcss, typescript


**Tests run via:** `npx playwright test --config=.tdad/playwright.config.js`








---

## 📊 TEST RESULTS

**Summary:** 4 passed, 1 failed

**Frontend Source Files:**
- `auth/register`

### ❌ FAILED: [UI-001] Display registration form with all required fields
──────────────────────────────────────────────────
**Error:** expect(received).toBe(expected) // Object.is equality

  📍 Code at .tdad\workflows\auth\show-register-form\show-register-form.test.js:31
  ```
       28│         const result = await performShowRegisterFormAction(page, { navigationType: 'header' });
       29│ 
       30│         // Unconditional assertion - always assert
  >>   31│         expect(result.success).toBe(true);
       32│ 
       33│         // Then the user should see the registration form
       34│         // And the user should see a "Username" input field
  ```

📁 **Details Trace file and logs:** `.tdad/debug/auth/show-register-form/trace-files/trace-ui-001-display-registration-form-with-all-required.json`
📸 **Screenshot:** `.tdad/debug/auth/show-register-form/screenshots/ui-001-display-registration-form-with-all-required.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/posts?sortBy=hot` → 0 ❌

### ✅ PASSED TESTS (4)
──────────────────────────────────────────────────

**✅ [UI-002] Navigate directly to registration page**
📁 **Details Trace file and logs:** `.tdad/debug/auth/show-register-form/trace-files/trace-ui-002-navigate-directly-to-registration-page.json`
📸 **Screenshot:** `.tdad/debug/auth/show-register-form/screenshots/ui-002-navigate-directly-to-registration-page.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅

**✅ [UI-003] Form fields are empty by default**
📁 **Details Trace file and logs:** `.tdad/debug/auth/show-register-form/trace-files/trace-ui-003-form-fields-are-empty-by-default.json`
📸 **Screenshot:** `.tdad/debug/auth/show-register-form/screenshots/ui-003-form-fields-are-empty-by-default.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅

**✅ [UI-004] Password field masks input**
📁 **Details Trace file and logs:** `.tdad/debug/auth/show-register-form/trace-files/trace-ui-004-password-field-masks-input.json`
📸 **Screenshot:** `.tdad/debug/auth/show-register-form/screenshots/ui-004-password-field-masks-input.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅

**✅ [UI-005] Display link to login page for existing users**
📁 **Details Trace file and logs:** `.tdad/debug/auth/show-register-form/trace-files/trace-ui-005-display-link-to-login-page-for-existing-use.json`
📸 **Screenshot:** `.tdad/debug/auth/show-register-form/screenshots/ui-005-display-link-to-login-page-for-existing-use.png`
📡 **API Calls:**
- `GET http://localhost:3000/api/auth/session` → 200 ✅
- `GET http://localhost:3000/api/auth/session` → 200 ✅


---

## ✅ YOUR TASK

1. **Read specs first:** `.tdad/workflows/auth/show-register-form/show-register-form.feature` for requirements, `.tdad/workflows/auth/show-register-form/show-register-form.test.js` for expected values
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
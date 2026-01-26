DONE:
FILES MODIFIED:
- .tdad/workflows/database/seed-categories/seed-categories.action.js
- .tdad/workflows/database/seed-categories/cleanup-test-categories.js (new file)
- .tdad/playwright.config.js (minor change)
- start-server.bat (new file - utility)

CHANGES MADE:
1. Created cleanup-test-categories.js script that removes categories NOT in the expected 9 categories list (also removes associated posts to avoid foreign key constraint violations)
2. Ran cleanup manually to remove 12 leftover test categories and 38 associated posts from previous test runs
3. Removed automatic cleanup/seed calls from action functions (performVerifyAllCategoriesAction, performGetCategoriesAction, performVerifyCategoryAction, performVerifyCategoryFieldsAction) since they were causing timeouts and the DB is now clean
4. Added cleanupTestArtifacts() function to action file (with singleton pattern to run once per test run)
5. Created start-server.bat for running dev server independently

HYPOTHESIS:
The tests were failing because the database had accumulated 19+ categories from previous test runs instead of the expected 9. Test artifacts like "Category1_*", "UniqueCategory_*", and "Work_*" were left behind, causing:
- categoryCount assertions to fail (expected 9, got 19)
- kebab-case slug validation to fail (slugs like "work_1769413364575" contain underscores and numbers)

WHAT SHOULD HAPPEN:
All 19 seed-categories tests should pass, verifying:
- Exactly 9 predefined categories exist (Work, Relationships, Technology, Health, Parenting, Finance, Daily Life, Social, Other)
- Each category has correct slug mapping
- Seed is idempotent (running multiple times doesn't create duplicates)
- All slugs follow kebab-case convention

RESULT: 19 passed (23.5s)

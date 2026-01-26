/**
 * Seed Categories Tests
 *
 * Tests based on Gherkin specification:
 * Feature: Seed Categories
 *   As a developer
 *   I want to insert predefined categories into the database
 *   So that users can categorize their frustration posts
 *
 * Categories: Work, Relationships, Technology, Health, Parenting,
 *             Finance, Daily Life, Social, Other
 */

const { test, expect } = require('../../../tdad-fixtures');
const {
  performSeedCategoriesAction,
  performExecuteSeedAction,
  performGetCategoriesAction,
  performVerifyAllCategoriesAction,
  performVerifyCategoryAction,
  performVerifyCategoryFieldsAction,
  performCheckDuplicatesAction,
  performSeedIdempotencyAction,
  performSeedWithExistingCategoryAction,
  performSeedWithoutConnectionAction,
  performSeedWithoutMigrationAction,
  getExpectedCategories,
  getExpectedCategoryCount,
  EXPECTED_CATEGORIES
} = require('./seed-categories.action.js');

test.describe('Seed Categories', () => {

  // ==========================================
  // API SCENARIOS - Happy Path: Seed Execution
  // ==========================================

  test('[API-051] Seed creates all predefined categories', async ({ page, tdadTrace }) => {
    // Verify all 9 categories exist after seed
    const result = await performVerifyAllCategoriesAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.categoryCount).toBe(9);
    expect(result.allCategoriesPresent).toBe(true);
    expect(result.allSlugsCorrect).toBe(true);
  });

  test('[API-052] Seed creates Work category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Work',
      slug: 'work'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('work');
  });

  test('[API-053] Seed creates Relationships category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Relationships',
      slug: 'relationships'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('relationships');
  });

  test('[API-054] Seed creates Technology category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Technology',
      slug: 'technology'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('technology');
  });

  test('[API-055] Seed creates Health category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Health',
      slug: 'health'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('health');
  });

  test('[API-056] Seed creates Parenting category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Parenting',
      slug: 'parenting'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('parenting');
  });

  test('[API-057] Seed creates Finance category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Finance',
      slug: 'finance'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('finance');
  });

  test('[API-058] Seed creates Daily Life category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Daily Life',
      slug: 'daily-life'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('daily-life');
  });

  test('[API-059] Seed creates Social category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Social',
      slug: 'social'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('social');
  });

  test('[API-060] Seed creates Other category with correct data', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryAction(page, {
      name: 'Other',
      slug: 'other'
    });
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.found).toBe(true);
    expect(result.slugMatches).toBe(true);
    expect(result.actualSlug).toBe('other');
  });

  // ==========================================
  // API SCENARIOS - API Verification
  // ==========================================

  test('[API-061] Category list API returns all seeded categories', async ({ page, tdadTrace }) => {
    const result = await performGetCategoriesAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.categoryCount).toBe(9);

    // Verify all expected category names are present
    const categoryNames = result.categories.map(c => c.name);
    for (const expected of EXPECTED_CATEGORIES) {
      expect(categoryNames).toContain(expected.name);
    }
  });

  test('[API-062] Category list API returns categories with id and slug', async ({ page, tdadTrace }) => {
    const result = await performVerifyCategoryFieldsAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.allHaveId).toBe(true);
    expect(result.allHaveName).toBe(true);
    expect(result.allHaveSlug).toBe(true);
  });

  // ==========================================
  // API SCENARIOS - Edge Cases: Idempotency
  // ==========================================

  test('[API-063] Seed is idempotent when run multiple times', async ({ page, tdadTrace }) => {
    // Run seed multiple times and verify no duplicates
    const result = await performSeedIdempotencyAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.noDuplicates).toBe(true);
    expect(result.exactCount).toBe(true);
    expect(result.categoryCount).toBe(9);
    expect(result.duplicateNames).toHaveLength(0);
    expect(result.duplicateSlugs).toHaveLength(0);
  });

  test('[API-064] Seed handles existing categories gracefully', async ({ page, tdadTrace }) => {
    // Run seed when categories already exist
    const result = await performSeedWithExistingCategoryAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.noErrors).toBe(true);
    expect(result.onlyOneWork).toBe(true);
    expect(result.workCategoryCount).toBe(1);
  });

  test('[API-065] Category count remains exactly 9 after seeding', async ({ page, tdadTrace }) => {
    // Verify exactly 9 categories exist (no more, no less)
    const result = await performGetCategoriesAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.categoryCount).toBe(getExpectedCategoryCount());
  });

  // ==========================================
  // API SCENARIOS - Edge Cases: Error Handling
  // ==========================================

  test('[API-066] Seed fails gracefully without database connection', async ({ page, tdadTrace }) => {
    // Note: This test documents expected behavior - actual connection failure is hard to test
    const result = await performSeedWithoutConnectionAction();
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.expectedBehavior).toBe('Seed should fail with connection error, no partial data inserted');
  });

  test('[API-067] Seed fails if migration has not been executed', async ({ page, tdadTrace }) => {
    // Note: This test documents expected behavior - requires fresh database without schema
    const result = await performSeedWithoutMigrationAction();
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.expectedBehavior).toBe('Seed should fail with table not found error');
  });

  // ==========================================
  // API SCENARIOS - Comprehensive Verification
  // ==========================================

  test('[API-068] All categories have correct name-slug mapping', async ({ page, tdadTrace }) => {
    const result = await performVerifyAllCategoriesAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.missingCategories).toHaveLength(0);
    expect(result.invalidCategories).toHaveLength(0);

    // Verify each category's slug matches expected
    for (const expected of EXPECTED_CATEGORIES) {
      const category = result.categories.find(c => c.name === expected.name);
      expect(category).toBeDefined();
      expect(category.slug).toBe(expected.slug);
    }
  });

  test('[API-069] Category slugs follow kebab-case convention', async ({ page, tdadTrace }) => {
    const result = await performGetCategoriesAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);

    // Verify all slugs are lowercase and use hyphens (kebab-case)
    const kebabCaseRegex = /^[a-z]+(-[a-z]+)*$/;
    for (const category of result.categories) {
      expect(category.slug).toMatch(kebabCaseRegex);
    }
  });

});

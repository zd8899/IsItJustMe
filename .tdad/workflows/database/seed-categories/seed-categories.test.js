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
  performGetCategoriesAction,
  performVerifyAllCategoriesAction,
  performVerifyCategoryAction,
  performVerifyCategoryFieldsAction,
  performCheckDuplicatesAction,
  getExpectedCategories,
  getExpectedCategoryCount,
  EXPECTED_CATEGORIES
} = require('./seed-categories.action.js');

test.describe('Seed Categories', () => {

  // ==========================================
  // API SCENARIOS - Happy Path: Seed Execution
  // ==========================================

  test('[API] Seed creates all predefined categories', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Work category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Relationships category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Technology category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Health category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Parenting category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Finance category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Daily Life category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Social category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Seed creates Other category with correct data', async ({ page, tdadTrace }) => {
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

  test('[API] Category list API returns all seeded categories', async ({ page, tdadTrace }) => {
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

  test('[API] Category list API returns categories with id and slug', async ({ page, tdadTrace }) => {
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

  test('[API] Seed is idempotent - no duplicate categories exist', async ({ page, tdadTrace }) => {
    // Verify no duplicates after seed (seed uses upsert so should be idempotent)
    const result = await performCheckDuplicatesAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.noDuplicates).toBe(true);
    expect(result.exactCount).toBe(true);
    expect(result.categoryCount).toBe(9);
    expect(result.duplicateNames).toHaveLength(0);
    expect(result.duplicateSlugs).toHaveLength(0);
  });

  test('[API] Category count remains exactly 9 after seeding', async ({ page, tdadTrace }) => {
    // Verify exactly 9 categories exist (no more, no less)
    const result = await performGetCategoriesAction(page);
    tdadTrace.setActionResult(result);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.categoryCount).toBe(getExpectedCategoryCount());
  });

  // ==========================================
  // API SCENARIOS - Comprehensive Verification
  // ==========================================

  test('[API] All categories have correct name-slug mapping', async ({ page, tdadTrace }) => {
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

  test('[API] Category slugs follow kebab-case convention', async ({ page, tdadTrace }) => {
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

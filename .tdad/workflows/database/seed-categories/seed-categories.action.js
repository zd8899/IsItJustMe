/**
 * Seed Categories Action
 *
 * This action provides API testing functions for validating that database
 * seeding creates all predefined categories correctly.
 *
 * Categories (from PRD):
 * - Work, Relationships, Technology, Health, Parenting, Finance, Daily Life, Social, Other
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

// Expected categories as defined in PRD and prisma/seed.ts
const EXPECTED_CATEGORIES = [
  { name: 'Work', slug: 'work' },
  { name: 'Relationships', slug: 'relationships' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Health', slug: 'health' },
  { name: 'Parenting', slug: 'parenting' },
  { name: 'Finance', slug: 'finance' },
  { name: 'Daily Life', slug: 'daily-life' },
  { name: 'Social', slug: 'social' },
  { name: 'Other', slug: 'other' }
];

// ==========================================
// HELPER: Get expected categories
// ==========================================

/**
 * Returns the list of expected categories
 * @returns {Array} Array of { name, slug } objects
 */
function getExpectedCategories() {
  return EXPECTED_CATEGORIES;
}

/**
 * Get expected category count
 * @returns {number} Number of expected categories
 */
function getExpectedCategoryCount() {
  return EXPECTED_CATEGORIES.length;
}

// ==========================================
// CORE ACTIONS
// ==========================================

/**
 * Fetch all categories from the API
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - { success, statusCode, categories, body }
 */
async function performGetCategoriesAction(page) {
  try {
    const response = await page.request.get('/api/trpc/category.list');

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    const categories = body?.result?.data?.json || [];

    return {
      success: response.ok(),
      statusCode,
      body,
      categories,
      categoryCount: categories.length
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify all seeded categories exist with correct data
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - { success, categories, missingCategories, invalidCategories }
 */
async function performVerifyAllCategoriesAction(page) {
  try {
    const result = await performGetCategoriesAction(page);

    if (!result.success) {
      return {
        success: false,
        errorMessage: `Failed to fetch categories: ${result.errorMessage || 'API error'}`,
        statusCode: result.statusCode
      };
    }

    const categories = result.categories;
    const missingCategories = [];
    const invalidCategories = [];

    // Check each expected category exists
    for (const expected of EXPECTED_CATEGORIES) {
      const found = categories.find(c => c.name === expected.name);
      if (!found) {
        missingCategories.push(expected.name);
      } else if (found.slug !== expected.slug) {
        invalidCategories.push({
          name: expected.name,
          expectedSlug: expected.slug,
          actualSlug: found.slug
        });
      }
    }

    const allValid = missingCategories.length === 0 && invalidCategories.length === 0;
    const correctCount = categories.length === EXPECTED_CATEGORIES.length;

    return {
      success: allValid && correctCount,
      statusCode: result.statusCode,
      categories,
      categoryCount: categories.length,
      expectedCount: EXPECTED_CATEGORIES.length,
      missingCategories,
      invalidCategories,
      allCategoriesPresent: missingCategories.length === 0,
      allSlugsCorrect: invalidCategories.length === 0,
      correctCount
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify a specific category exists with correct data
 * @param {Object} page - Playwright page object
 * @param {Object} context - { name, slug } - expected category data
 * @returns {Promise<Object>} - { success, category, found, slugMatches }
 */
async function performVerifyCategoryAction(page, context = {}) {
  try {
    const { name, slug } = context;

    if (!name) {
      return { success: false, errorMessage: 'Category name is required' };
    }

    const result = await performGetCategoriesAction(page);

    if (!result.success) {
      return {
        success: false,
        errorMessage: `Failed to fetch categories: ${result.errorMessage || 'API error'}`,
        statusCode: result.statusCode
      };
    }

    const category = result.categories.find(c => c.name === name);
    const found = !!category;
    const slugMatches = slug ? category?.slug === slug : true;
    const hasId = category?.id !== undefined;
    const hasName = category?.name !== undefined;
    const hasSlug = category?.slug !== undefined;

    return {
      success: found && slugMatches,
      statusCode: result.statusCode,
      category,
      found,
      slugMatches,
      hasId,
      hasName,
      hasSlug,
      expectedName: name,
      expectedSlug: slug,
      actualSlug: category?.slug
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify categories have required fields (id, name, slug)
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - { success, allHaveId, allHaveName, allHaveSlug }
 */
async function performVerifyCategoryFieldsAction(page) {
  try {
    const result = await performGetCategoriesAction(page);

    if (!result.success) {
      return {
        success: false,
        errorMessage: `Failed to fetch categories: ${result.errorMessage || 'API error'}`,
        statusCode: result.statusCode
      };
    }

    const categories = result.categories;
    const allHaveId = categories.every(c => c.id !== undefined && c.id !== null);
    const allHaveName = categories.every(c => c.name !== undefined && c.name !== null);
    const allHaveSlug = categories.every(c => c.slug !== undefined && c.slug !== null);

    return {
      success: allHaveId && allHaveName && allHaveSlug,
      statusCode: result.statusCode,
      categoryCount: categories.length,
      allHaveId,
      allHaveName,
      allHaveSlug
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Check for duplicate categories (verifies idempotency)
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - { success, duplicates, noDuplicates }
 */
async function performCheckDuplicatesAction(page) {
  try {
    const result = await performGetCategoriesAction(page);

    if (!result.success) {
      return {
        success: false,
        errorMessage: `Failed to fetch categories: ${result.errorMessage || 'API error'}`,
        statusCode: result.statusCode
      };
    }

    const categories = result.categories;
    const nameCount = {};
    const slugCount = {};

    for (const category of categories) {
      nameCount[category.name] = (nameCount[category.name] || 0) + 1;
      slugCount[category.slug] = (slugCount[category.slug] || 0) + 1;
    }

    const duplicateNames = Object.entries(nameCount)
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));

    const duplicateSlugs = Object.entries(slugCount)
      .filter(([, count]) => count > 1)
      .map(([slug, count]) => ({ slug, count }));

    const noDuplicates = duplicateNames.length === 0 && duplicateSlugs.length === 0;

    return {
      success: noDuplicates,
      statusCode: result.statusCode,
      categoryCount: categories.length,
      expectedCount: EXPECTED_CATEGORIES.length,
      exactCount: categories.length === EXPECTED_CATEGORIES.length,
      duplicateNames,
      duplicateSlugs,
      noDuplicates
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// MAIN ACTION ENTRY POINT
// ==========================================

/**
 * Main action entry point for seed categories validation
 * @param {Object} page - Playwright page object
 * @param {Object} context - { mode, action, name, slug }
 * @returns {Promise<Object>} - { success, errorMessage, ...data }
 */
async function performSeedCategoriesAction(page, context = {}) {
  try {
    // API mode - fetch and verify categories
    if (context.mode === 'api' || !context.mode) {
      const action = context.action;

      switch (action) {
        case 'getCategories':
          return await performGetCategoriesAction(page);

        case 'verifyAll':
          return await performVerifyAllCategoriesAction(page);

        case 'verifyCategory':
          return await performVerifyCategoryAction(page, context);

        case 'verifyFields':
          return await performVerifyCategoryFieldsAction(page);

        case 'checkDuplicates':
          return await performCheckDuplicatesAction(page);

        default:
          // Default: verify all categories are seeded correctly
          return await performVerifyAllCategoriesAction(page);
      }
    }

    return { success: false, errorMessage: 'Invalid mode' };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Main action
  performSeedCategoriesAction,

  // Individual actions
  performGetCategoriesAction,
  performVerifyAllCategoriesAction,
  performVerifyCategoryAction,
  performVerifyCategoryFieldsAction,
  performCheckDuplicatesAction,

  // Helpers
  getExpectedCategories,
  getExpectedCategoryCount,

  // Constants
  EXPECTED_CATEGORIES
};

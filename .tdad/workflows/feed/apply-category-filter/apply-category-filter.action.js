const { performShowCategoryFilterAction, selectCategory, CATEGORIES } = require('../show-category-filter/show-category-filter.action.js');
const { performFetchPostsByCategoryAction, createTestPost, getCategoryBySlug, getAllCategories } = require('../fetch-posts-by-category/fetch-posts-by-category.action.js');

/**
 * Apply Category Filter Action
 *
 * Provides functionality to filter the feed by selecting a category from the dropdown.
 * Supports both API testing (direct tRPC calls) and UI testing (browser interactions).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and options
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {string} context.categorySlug - Category slug to filter by (e.g., 'technology', 'work')
 * @param {string} context.categoryLabel - Category label to select in UI (e.g., 'Technology', 'Work')
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

/**
 * Main action: Apply category filter (API or UI mode)
 */
async function performApplyCategoryFilterAction(page, context = {}) {
  try {
    const { mode, categorySlug, categoryLabel } = context;

    // ==========================================
    // API MODE - Direct tRPC request
    // ==========================================
    if (mode === 'api') {
      if (!categorySlug) {
        return { success: false, errorMessage: 'categorySlug is required for API mode' };
      }

      // Use the fetch-posts-by-category action for API calls
      const result = await performFetchPostsByCategoryAction(page, {
        mode: 'api',
        categorySlug: categorySlug
      });

      return {
        success: result.success,
        statusCode: result.statusCode,
        body: result.body,
        posts: result.posts || [],
        postCount: result.postCount || 0,
        categorySlug: categorySlug,
        errorMessage: result.errorMessage
      };
    }

    // ==========================================
    // UI MODE - Browser interaction
    // ==========================================
    // Navigate to feed page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get the category filter dropdown
    const categoryFilter = page.getByRole('combobox');

    // Wait for the category filter to be visible
    const errorLocator = page.getByRole('alert');
    const filterOutcome = await Promise.race([
      categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
      errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (filterOutcome.type === 'error') {
      const errorMsg = await errorLocator.first().textContent();
      return { success: false, errorMessage: errorMsg };
    }

    if (filterOutcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for category filter dropdown to appear' };
    }

    // Determine the value to select
    let selectValue = categorySlug;
    if (!selectValue && categoryLabel) {
      const category = CATEGORIES.find(c => c.label === categoryLabel);
      selectValue = category ? category.value : null;
    }

    if (!selectValue) {
      return { success: false, errorMessage: 'Either categorySlug or categoryLabel must be provided' };
    }

    // Select the category from the dropdown
    await categoryFilter.first().selectOption({ value: selectValue });

    // Wait for the feed to update (loading state then content)
    await page.waitForLoadState('domcontentloaded');

    // Check if loading indicator appears (optional - may be fast)
    const loadingIndicator = page.getByText('Loading posts...');
    let loadingAppeared = false;
    try {
      await loadingIndicator.waitFor({ state: 'visible', timeout: 1000 });
      loadingAppeared = true;
      // Wait for loading to complete
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch (e) {
      // Loading may have been too fast to catch
    }

    // Wait for the content to stabilize
    await page.waitForLoadState('networkidle');

    // Get the selected value after selection
    const selectedValue = await categoryFilter.first().inputValue();
    const selectedCategory = CATEGORIES.find(c => c.value === selectedValue);

    // Check for empty state
    const emptyStateLocator = page.getByText('No posts yet');
    let hasEmptyState = false;
    try {
      hasEmptyState = await emptyStateLocator.isVisible();
    } catch (e) {
      // Element may not exist
    }

    // Count visible post cards
    const postCards = page.locator('.bg-white.border');
    const postCount = await postCards.count();

    return {
      success: true,
      selectedValue: selectedValue,
      selectedLabel: selectedCategory ? selectedCategory.label : null,
      loadingAppeared: loadingAppeared,
      hasEmptyState: hasEmptyState,
      postCount: postCount
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Select a category from the dropdown and wait for feed update (without page navigation)
 */
async function selectCategoryAndWait(page, context = {}) {
  try {
    const { categorySlug, categoryLabel, skipNavigation } = context;

    if (!skipNavigation) {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    }

    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Determine the value to select
    let selectValue = categorySlug;
    if (!selectValue && categoryLabel) {
      const category = CATEGORIES.find(c => c.label === categoryLabel);
      selectValue = category ? category.value : null;
    }

    if (!selectValue) {
      return { success: false, errorMessage: 'Either categorySlug or categoryLabel must be provided' };
    }

    // Select the category
    await categoryFilter.first().selectOption({ value: selectValue });

    // Wait for feed to update
    await page.waitForLoadState('networkidle');

    const selectedValue = await categoryFilter.first().inputValue();
    const selectedCategory = CATEGORIES.find(c => c.value === selectedValue);

    return {
      success: true,
      selectedValue: selectedValue,
      selectedLabel: selectedCategory ? selectedCategory.label : null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify that all visible posts belong to the selected category
 */
async function verifyPostsBelongToCategory(page, context = {}) {
  try {
    const { categoryLabel } = context;

    if (!categoryLabel) {
      return { success: false, errorMessage: 'categoryLabel is required' };
    }

    // Get all category badges from post cards
    const categoryBadges = page.locator('.bg-primary-100.rounded');
    const badgeCount = await categoryBadges.count();

    if (badgeCount === 0) {
      // No posts visible - this might be valid for empty category
      const emptyStateLocator = page.getByText('No posts yet');
      const hasEmptyState = await emptyStateLocator.isVisible().catch(() => false);

      if (hasEmptyState) {
        return {
          success: true,
          allPostsMatch: true,
          postCount: 0,
          hasEmptyState: true
        };
      }

      return {
        success: false,
        errorMessage: 'No posts found and no empty state displayed'
      };
    }

    // Check each badge matches the expected category
    let allMatch = true;
    const foundCategories = [];

    for (let i = 0; i < badgeCount; i++) {
      const badgeText = await categoryBadges.nth(i).textContent();
      foundCategories.push(badgeText.trim());
      if (badgeText.trim() !== categoryLabel) {
        allMatch = false;
      }
    }

    return {
      success: allMatch,
      allPostsMatch: allMatch,
      postCount: badgeCount,
      foundCategories: foundCategories,
      expectedCategory: categoryLabel,
      errorMessage: allMatch ? null : `Found posts from categories: ${[...new Set(foundCategories)].join(', ')}`
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify that posts from multiple categories are displayed (unfiltered feed)
 */
async function verifyMultipleCategoriesDisplayed(page, context = {}) {
  try {
    // Get all category badges from post cards
    const categoryBadges = page.locator('.bg-primary-100.rounded');
    const badgeCount = await categoryBadges.count();

    if (badgeCount === 0) {
      return {
        success: false,
        errorMessage: 'No posts found to verify multiple categories'
      };
    }

    // Collect unique categories
    const foundCategories = new Set();
    for (let i = 0; i < badgeCount; i++) {
      const badgeText = await categoryBadges.nth(i).textContent();
      foundCategories.add(badgeText.trim());
    }

    const uniqueCategories = [...foundCategories];
    const hasMultipleCategories = uniqueCategories.length > 1;

    return {
      success: true,
      hasMultipleCategories: hasMultipleCategories,
      uniqueCategories: uniqueCategories,
      postCount: badgeCount
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify empty state is displayed for a category with no posts
 */
async function verifyEmptyState(page, context = {}) {
  try {
    // Look for empty state message
    const emptyStateLocator = page.getByText('No posts yet');
    const loadingLocator = page.getByText('Loading posts...');

    // Wait for loading to complete if visible
    try {
      await loadingLocator.waitFor({ state: 'hidden', timeout: 5000 });
    } catch (e) {
      // Loading may not have appeared
    }

    // Check for empty state
    const hasEmptyState = await emptyStateLocator.isVisible().catch(() => false);

    // Count post cards to verify no posts
    const postCards = page.locator('.bg-white.border');
    const postCount = await postCards.count();

    return {
      success: hasEmptyState && postCount === 0,
      hasEmptyState: hasEmptyState,
      postCount: postCount,
      errorMessage: !hasEmptyState ? 'Empty state message not displayed' : null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Switch feed tab (Hot/New) and verify category filter persists
 */
async function switchFeedTabAndVerifyFilter(page, context = {}) {
  try {
    const { targetTab, expectedCategoryValue } = context;

    if (!targetTab) {
      return { success: false, errorMessage: 'targetTab is required (hot or new)' };
    }

    // Click the target tab button
    const tabButton = page.getByRole('button', { name: new RegExp(targetTab, 'i') });
    await tabButton.click();

    // Wait for feed to update
    await page.waitForLoadState('networkidle');

    // Check the category filter value
    const categoryFilter = page.getByRole('combobox');
    const selectedValue = await categoryFilter.first().inputValue();

    const filterPersisted = selectedValue === expectedCategoryValue;
    const selectedCategory = CATEGORIES.find(c => c.value === selectedValue);

    return {
      success: filterPersisted,
      filterPersisted: filterPersisted,
      selectedValue: selectedValue,
      selectedLabel: selectedCategory ? selectedCategory.label : null,
      expectedValue: expectedCategoryValue,
      errorMessage: filterPersisted ? null : `Filter changed to "${selectedValue}" instead of persisting "${expectedCategoryValue}"`
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Check if loading indicator is visible
 */
async function checkLoadingIndicator(page, context = {}) {
  try {
    const loadingIndicator = page.getByText('Loading posts...');
    const isVisible = await loadingIndicator.isVisible().catch(() => false);

    return {
      success: true,
      loadingVisible: isVisible
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Get the current selected category from the filter dropdown
 */
async function getCurrentSelectedCategory(page, context = {}) {
  try {
    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    const selectedValue = await categoryFilter.first().inputValue();
    const selectedCategory = CATEGORIES.find(c => c.value === selectedValue);

    return {
      success: true,
      selectedValue: selectedValue,
      selectedLabel: selectedCategory ? selectedCategory.label : null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Helper: Get list of all available categories
 */
function getAvailableCategories() {
  return CATEGORIES;
}

/**
 * Helper: Get category from slug
 */
function getCategoryFromSlug(slug) {
  return CATEGORIES.find(c => c.value === slug) || null;
}

/**
 * Helper: Get category from label
 */
function getCategoryFromLabel(label) {
  return CATEGORIES.find(c => c.label === label) || null;
}

/**
 * Helper: Extract posts from API result
 */
function getPostsFromResult(result) {
  return result?.posts || result?.body?.result?.data?.json || [];
}

/**
 * Helper: Check if all posts in result belong to a specific category
 */
function allPostsBelongToCategorySlug(posts, categorySlug) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return true;
  }
  return posts.every(post => post.category?.slug === categorySlug);
}

module.exports = {
  performApplyCategoryFilterAction,
  selectCategoryAndWait,
  verifyPostsBelongToCategory,
  verifyMultipleCategoriesDisplayed,
  verifyEmptyState,
  switchFeedTabAndVerifyFilter,
  checkLoadingIndicator,
  getCurrentSelectedCategory,
  getAvailableCategories,
  getCategoryFromSlug,
  getCategoryFromLabel,
  getPostsFromResult,
  allPostsBelongToCategorySlug,
  // Re-export from dependencies
  createTestPost,
  getCategoryBySlug,
  getAllCategories,
  CATEGORIES
};

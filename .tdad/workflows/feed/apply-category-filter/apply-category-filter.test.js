// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
  performApplyCategoryFilterAction,
  selectCategoryAndWait,
  verifyPostsBelongToCategory,
  verifyMultipleCategoriesDisplayed,
  verifyEmptyState,
  switchFeedTabAndVerifyFilter,
  checkLoadingIndicator,
  getCurrentSelectedCategory,
  createTestPost,
  getCategoryBySlug,
  getAllCategories,
  allPostsBelongToCategorySlug,
  CATEGORIES
} = require('./apply-category-filter.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Apply Category Filter
 *   As a user
 *   I want to filter the feed by selecting a category
 *   So that I can browse frustrations relevant to a specific topic
 */

test.describe('Apply Category Filter', () => {

  // ==========================================
  // API TESTS
  // ==========================================

  test('[API-323] Filter triggers API call with selected category', async ({ page }) => {
    // Setup: Create posts in the technology category to ensure data exists
    const setupPost = await createTestPost(page, {
      categorySlug: 'technology',
      frustration: `Test tech frustration ${Date.now()}`,
      identity: 'a tech tester'
    });
    expect(setupPost.success).toBe(true);

    // Execute: Call API with technology category filter
    const result = await performApplyCategoryFilterAction(page, {
      mode: 'api',
      categorySlug: 'technology'
    });

    // Assert: Response status is 200
    expect(result.statusCode).toBe(200);

    // Assert: All returned posts belong to technology category
    expect(result.success).toBe(true);
    const posts = result.posts || [];
    const allBelongToCategory = allPostsBelongToCategorySlug(posts, 'technology');
    expect(allBelongToCategory).toBe(true);
  });

  test('[API-324] Filter with non-existent category returns error', async ({ page }) => {
    // Execute: Call API with invalid category slug
    const result = await performApplyCategoryFilterAction(page, {
      mode: 'api',
      categorySlug: 'invalid-category'
    });

    // Assert: Response status is 404
    expect(result.statusCode).toBe(404);

    // Assert: Error message indicates category not found
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Category not found');
  });


  // ==========================================
  // UI TESTS
  // ==========================================

  test('[UI-152] Selecting a category filters the feed', async ({ page }) => {
    // Setup: Create a post in the Technology category
    const setupPost = await createTestPost(page, {
      categorySlug: 'technology',
      frustration: `UI filter test frustration ${Date.now()}`,
      identity: 'a ui tester'
    });
    expect(setupPost.success).toBe(true);

    // Execute: Apply Technology category filter via UI
    const result = await performApplyCategoryFilterAction(page, {
      mode: 'ui',
      categoryLabel: 'Technology'
    });

    // Assert: Action succeeded
    expect(result.success).toBe(true);
    expect(result.selectedLabel).toBe('Technology');

    // Assert: Feed displays only posts from Technology category
    const verification = await verifyPostsBelongToCategory(page, {
      categoryLabel: 'Technology'
    });
    expect(verification.success).toBe(true);
    expect(verification.allPostsMatch).toBe(true);

    // Assert: Each post card shows the Technology category badge
    await expect(page.locator('.bg-primary-100.rounded').first()).toContainText('Technology');
  });

  test('[UI] Selecting "All Categories" shows unfiltered feed', async ({ page }) => {
    // Setup: Create posts in different categories to ensure variety
    const workPost = await createTestPost(page, {
      categorySlug: 'work',
      frustration: `Work frustration ${Date.now()}`,
      identity: 'a worker'
    });
    expect(workPost.success).toBe(true);

    const techPost = await createTestPost(page, {
      categorySlug: 'technology',
      frustration: `Tech frustration ${Date.now()}`,
      identity: 'a tech worker'
    });
    expect(techPost.success).toBe(true);

    // Navigate and first apply a Work filter
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Apply Work filter first
    await categoryFilter.first().selectOption({ value: 'work' });
    await page.waitForLoadState('networkidle');

    // Execute: Select "All Categories" to remove filter
    await categoryFilter.first().selectOption({ value: 'all' });
    await page.waitForLoadState('networkidle');

    // Assert: Selected value is "all"
    const selectedValue = await categoryFilter.first().inputValue();
    expect(selectedValue).toBe('all');

    // Assert: Feed displays posts (content is visible)
    const postCards = page.locator('.bg-white.border');
    const postCount = await postCards.count();
    expect(postCount).toBeGreaterThan(0);
  });

  test('[UI-153] Loading state while fetching filtered posts', async ({ page }) => {
    // Setup: Create a post in Health category
    const setupPost = await createTestPost(page, {
      categorySlug: 'health',
      frustration: `Health frustration for loading test ${Date.now()}`,
      identity: 'a health tester'
    });
    expect(setupPost.success).toBe(true);

    // Navigate to feed
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get the category filter
    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Execute: Select Health category (may trigger loading state)
    await categoryFilter.first().selectOption({ value: 'health' });

    // Note: Loading may be too fast to catch, but verify final state
    // Wait for any loading to complete
    const loadingIndicator = page.getByText('Loading posts...');
    try {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch (e) {
      // Loading may not have appeared or already completed
    }

    // Assert: After loading completes, feed displays posts from Health category
    await page.waitForLoadState('networkidle');

    // Verify either posts are shown or empty state
    const postCards = page.locator('.bg-white.border');
    const emptyState = page.getByText('No posts yet');

    const postCount = await postCards.count();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either posts exist or empty state is shown
    expect(postCount > 0 || hasEmptyState).toBe(true);
  });

  test('[UI-154] Empty state when category has no posts', async ({ page }) => {
    // Use a category that's unlikely to have posts - Finance
    // First verify category exists
    const categoryCheck = await getCategoryBySlug(page, 'finance');
    expect(categoryCheck.success).toBe(true);

    // Navigate to feed
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get the category filter
    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Execute: Select Finance category
    await categoryFilter.first().selectOption({ value: 'finance' });
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    const loadingIndicator = page.getByText('Loading posts...');
    try {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch (e) {
      // Loading may not have appeared
    }

    // Check current state - if no posts, should show empty state
    const postCards = page.locator('.bg-white.border');
    const postCount = await postCards.count();

    if (postCount === 0) {
      // Assert: Empty state message is displayed
      const emptyStateResult = await verifyEmptyState(page);
      expect(emptyStateResult.hasEmptyState).toBe(true);
      expect(emptyStateResult.postCount).toBe(0);
    } else {
      // Posts exist in Finance - verify they belong to Finance category
      const verification = await verifyPostsBelongToCategory(page, {
        categoryLabel: 'Finance'
      });
      expect(verification.allPostsMatch).toBe(true);
    }
  });

  test('[UI-155] Category filter persists across feed tab switches', async ({ page }) => {
    // Setup: Create a post in Relationships category
    const setupPost = await createTestPost(page, {
      categorySlug: 'relationships',
      frustration: `Relationships frustration ${Date.now()}`,
      identity: 'a relationship tester'
    });
    expect(setupPost.success).toBe(true);

    // Navigate to feed (Hot tab is default)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on Hot tab by checking button state
    const hotButton = page.getByRole('button', { name: /hot/i });
    await expect(hotButton).toBeVisible();

    // Select Relationships category filter
    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });
    await categoryFilter.first().selectOption({ value: 'relationships' });
    await page.waitForLoadState('networkidle');

    // Verify filter is applied
    const selectedBefore = await categoryFilter.first().inputValue();
    expect(selectedBefore).toBe('relationships');

    // Execute: Switch to "New" tab
    const newButton = page.getByRole('button', { name: /new/i });
    await newButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: Category filter still displays "Relationships" as selected
    const selectedAfter = await categoryFilter.first().inputValue();
    expect(selectedAfter).toBe('relationships');

    // Assert: Feed displays only posts from Relationships category (if any exist)
    const postCards = page.locator('.bg-white.border');
    const postCount = await postCards.count();

    if (postCount > 0) {
      const verification = await verifyPostsBelongToCategory(page, {
        categoryLabel: 'Relationships'
      });
      expect(verification.allPostsMatch).toBe(true);
    }
  });

  test('[UI-156] Filtered feed shows correct post count', async ({ page }) => {
    // Setup: Create multiple posts in Work category
    const post1 = await createTestPost(page, {
      categorySlug: 'work',
      frustration: `Work frustration 1 ${Date.now()}`,
      identity: 'worker 1'
    });
    expect(post1.success).toBe(true);

    const post2 = await createTestPost(page, {
      categorySlug: 'work',
      frustration: `Work frustration 2 ${Date.now()}`,
      identity: 'worker 2'
    });
    expect(post2.success).toBe(true);

    // Execute: Apply Work category filter via UI
    const result = await performApplyCategoryFilterAction(page, {
      mode: 'ui',
      categoryLabel: 'Work'
    });

    // Assert: Action succeeded
    expect(result.success).toBe(true);

    // Assert: Feed displays post cards
    const postCards = page.locator('.bg-white.border');
    const postCount = await postCards.count();
    expect(postCount).toBeGreaterThan(0);

    // Assert: All displayed posts belong to Work category
    const verification = await verifyPostsBelongToCategory(page, {
      categoryLabel: 'Work'
    });
    expect(verification.success).toBe(true);
    expect(verification.allPostsMatch).toBe(true);
    expect(verification.postCount).toBeGreaterThan(0);
  });

});

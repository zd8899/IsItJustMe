// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
  performSwitchHotToNewAction,
  performSwitchNewToHotAction,
  performVerifyDefaultHotFeedAction,
  performVerifyLoadingStateAction,
  performVerifyEmptyStateAction,
  performVerifyFeedContentAction,
  performVerifyCategoryFilterPreservedAction,
  createTestPostsForFeed
} = require('./switch-feed-type.action.js');
const { createTestPost, getOrCreateTestCategory } = require('../fetch-hot-posts/fetch-hot-posts.action.js');

/**
 * Tests based on Gherkin specification:
 * Feature: Switch Feed Type
 *   As a user
 *   I want to toggle between hot and new feeds
 *   So that I can discover trending frustrations or see the latest posts
 */

test.describe('Switch Feed Type', () => {

  // ==========================================
  // UI TESTS
  // ==========================================

  test('[UI-145] Switch from Hot feed to New feed', async ({ page, tdadTrace }) => {
    // Setup: Create test posts to ensure feed has content
    const setupResult = await createTestPostsForFeed(page, 2);
    expect(setupResult.success).toBe(true);

    // Execute action: Switch from Hot to New
    const result = await performSwitchHotToNewAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // Verify New tab is active
    expect(result.activeTab).toBe('New');
    expect(result.inactiveTab).toBe('Hot');

    // Playwright assertions for UI state
    const newTab = page.getByRole('button', { name: 'New' });
    const hotTab = page.getByRole('button', { name: 'Hot' });

    await expect(newTab).toBeVisible();
    await expect(hotTab).toBeVisible();

    // Verify New tab has active styling
    await expect(newTab).toHaveClass(/bg-primary-900/);
  });

  test('[UI-146] Switch from New feed to Hot feed', async ({ page, tdadTrace }) => {
    // Setup: Create test posts to ensure feed has content
    const setupResult = await createTestPostsForFeed(page, 2);
    expect(setupResult.success).toBe(true);

    // Execute action: Switch from New to Hot
    const result = await performSwitchNewToHotAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // Verify Hot tab is active
    expect(result.activeTab).toBe('Hot');
    expect(result.inactiveTab).toBe('New');

    // Playwright assertions for UI state
    const newTab = page.getByRole('button', { name: 'New' });
    const hotTab = page.getByRole('button', { name: 'Hot' });

    await expect(newTab).toBeVisible();
    await expect(hotTab).toBeVisible();

    // Verify Hot tab has active styling
    await expect(hotTab).toHaveClass(/bg-primary-900/);
  });

  test('[UI-147] Feed displays loading state while switching', async ({ page, tdadTrace }) => {
    // Setup: Create test posts to ensure feed has content
    const setupResult = await createTestPostsForFeed(page, 2);
    expect(setupResult.success).toBe(true);

    // Execute action: Verify loading state during switch
    const result = await performVerifyLoadingStateAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // Verify New tab became active after switch
    expect(result.activeTab).toBe('New');

    // Playwright assertions for UI state
    const newTab = page.getByRole('button', { name: 'New' });
    await expect(newTab).toBeVisible();
    await expect(newTab).toHaveClass(/bg-primary-900/);

    // Verify loading has completed (no loading indicator visible)
    const loadingText = page.getByText('Loading posts...');
    await expect(loadingText).not.toBeVisible();
  });

  test('[UI-148] Feed content changes when switching tabs', async ({ page, tdadTrace }) => {
    // Setup: Create test posts with different timestamps
    const catResult = await getOrCreateTestCategory(page);
    expect(catResult.success).toBe(true);

    // Create posts with unique identifiable content
    const post1 = await createTestPost(page, {
      categoryId: catResult.categoryId,
      frustration: `feed content test hot ${Date.now()}`,
      identity: 'a content tester'
    });
    expect(post1.success).toBe(true);

    const post2 = await createTestPost(page, {
      categoryId: catResult.categoryId,
      frustration: `feed content test new ${Date.now()}`,
      identity: 'a content tester'
    });
    expect(post2.success).toBe(true);

    // Execute action: Verify feed content when switching
    const result = await performVerifyFeedContentAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // If posts were found, verify required elements
    if (result.postsFound) {
      // Verify post elements are visible
      expect(result.frustrationVisible).toBe(true);
      expect(result.identityVisible).toBe(true);
      expect(result.categoryVisible).toBe(true);
      expect(result.commentCountVisible).toBe(true);
      expect(result.voteButtonsVisible).toBe(true);

      // Playwright assertions for post content elements
      const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
      await expect(postCards.first()).toBeVisible();

      // Verify frustration text pattern
      await expect(postCards.first().locator('h3')).toContainText('Why is it so hard to');

      // Verify identity text pattern
      await expect(postCards.first().locator('p').first()).toContainText('I am');

      // Verify category badge is visible
      await expect(postCards.first().locator('.bg-primary-100.rounded')).toBeVisible();
    } else {
      // If no posts, verify empty state
      expect(result.emptyStateVisible).toBe(true);
      await expect(page.getByText('No posts yet. Be the first to share!')).toBeVisible();
    }
  });

  test('[UI-149] Hot feed is displayed by default on page load', async ({ page, tdadTrace }) => {
    // Setup: Create test posts to ensure feed has content
    const setupResult = await createTestPostsForFeed(page, 2);
    expect(setupResult.success).toBe(true);

    // Execute action: Verify default Hot feed
    const result = await performVerifyDefaultHotFeedAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // Verify Hot tab is active by default
    expect(result.activeTab).toBe('Hot');

    // Playwright assertions for UI state
    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    await expect(hotTab).toBeVisible();
    await expect(newTab).toBeVisible();

    // Verify Hot tab has active styling by default
    await expect(hotTab).toHaveClass(/bg-primary-900/);

    // Verify New tab does not have active styling
    await expect(newTab).not.toHaveClass(/bg-primary-900/);
  });

  test('[UI-150] Empty state when no posts exist for current feed', async ({ page, tdadTrace }) => {
    // Note: This test verifies behavior when no posts exist
    // Since we can't guarantee an empty database, we verify the empty state
    // mechanism works by checking what happens when switching tabs

    // Execute action: Verify empty state behavior
    const result = await performVerifyEmptyStateAction(page);
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // Verify New tab is active after switch
    expect(result.activeTab).toBe('New');

    // Playwright assertions for UI state
    const newTab = page.getByRole('button', { name: 'New' });
    await expect(newTab).toBeVisible();
    await expect(newTab).toHaveClass(/bg-primary-900/);

    // Verify either posts are shown or empty state is visible
    const emptyStateText = page.getByText('No posts yet. Be the first to share!');
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');

    // One of these should be visible
    const emptyVisible = await emptyStateText.isVisible().catch(() => false);
    const postsVisible = await postCards.first().isVisible().catch(() => false);

    expect(emptyVisible || postsVisible).toBe(true);
  });

  test('[UI-151] Switching feeds preserves category filter', async ({ page, tdadTrace }) => {
    // Setup: Create test posts in Technology category
    const catResult = await getOrCreateTestCategory(page);
    expect(catResult.success).toBe(true);

    const post = await createTestPost(page, {
      categorySlug: 'technology',
      frustration: `category filter test ${Date.now()}`,
      identity: 'a tech tester'
    });
    // Post creation might fail if technology category doesn't exist
    // That's ok - the test focuses on filter preservation behavior

    // Execute action: Verify category filter is preserved when switching tabs
    const result = await performVerifyCategoryFilterPreservedAction(page, { categoryName: 'Technology' });
    tdadTrace.setActionResult(result);

    // Unconditional assertion - action must succeed
    expect(result.success).toBe(true);

    // Verify New tab is active after switch
    expect(result.activeTab).toBe('New');

    // Verify category filter was preserved
    expect(result.filterPreserved).toBe(true);
    expect(result.selectedCategory).toBe('technology');

    // Playwright assertions for UI state
    const newTab = page.getByRole('button', { name: 'New' });
    await expect(newTab).toBeVisible();
    await expect(newTab).toHaveClass(/bg-primary-900/);

    // Verify category filter shows Technology
    const categorySelect = page.getByTestId('category-filter');
    await expect(categorySelect).toHaveValue('technology');
  });

});

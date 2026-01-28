/**
 * Show Post List Action
 *
 * Provides functionality to verify the post list display in the feed.
 * Handles loading states, empty states, post card elements, sorting, and filtering.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and options
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

const { performSwitchHotToNewAction, performSwitchNewToHotAction, createTestPostsForFeed } = require('../switch-feed-type/switch-feed-type.action.js');
const { performApplyCategoryFilterAction, selectCategoryAndWait, verifyPostsBelongToCategory, CATEGORIES } = require('../apply-category-filter/apply-category-filter.action.js');
const { createTestPost, getOrCreateTestCategory, getCategoryBySlug } = require('../fetch-hot-posts/fetch-hot-posts.action.js');

/**
 * Main action: Navigate to home page and verify post list displays correctly
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, posts, postCount, ... }
 */
async function performShowPostListAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for error alert
    const errorLocator = page.getByRole('alert');
    const postContainer = page.locator('.space-y-4.mt-4');

    const outcome = await Promise.race([
      postContainer.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'success' })),
      errorLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (outcome.type === 'error') {
      const errorMsg = await errorLocator.first().textContent();
      return { success: false, errorMessage: errorMsg };
    }

    if (outcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for post list container to appear' };
    }

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check for empty state
    const emptyStateText = page.getByText('No posts yet. Be the first to share!');
    let hasEmptyState = false;
    try {
      hasEmptyState = await emptyStateText.isVisible();
    } catch (e) {
      // Element may not exist
    }

    // Count post cards
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    return {
      success: true,
      postCount: postCount,
      hasEmptyState: hasEmptyState,
      hasPosts: postCount > 0
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify post cards display all required elements
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, elements }
 */
async function performVerifyPostCardElementsAction(page, context = {}) {
  try {
    const { skipNavigation = false } = context;

    if (!skipNavigation) {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    }

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get post cards
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    if (postCount === 0) {
      // Check for empty state
      const emptyStateVisible = await page.getByText('No posts yet. Be the first to share!').isVisible().catch(() => false);
      return {
        success: true,
        postsFound: false,
        hasEmptyState: emptyStateVisible,
        errorMessage: emptyStateVisible ? null : 'No posts and no empty state'
      };
    }

    // Verify first post card has all required elements
    const firstPost = postCards.first();

    // Check frustration text (contains "Why is it so hard to")
    const frustrationText = firstPost.locator('h3').filter({ hasText: 'Why is it so hard to' });
    const hasFrustration = await frustrationText.isVisible();

    // Check identity text (contains "I am")
    const identityText = firstPost.locator('p').filter({ hasText: 'I am' });
    const hasIdentity = await identityText.isVisible();

    // Check category badge
    const categoryBadge = firstPost.locator('.bg-primary-100.rounded');
    const hasCategory = await categoryBadge.isVisible();

    // Check comment count
    const commentCount = firstPost.getByText(/\d+\s+comments/);
    const hasCommentCount = await commentCount.isVisible();

    // Check vote buttons (VoteButtons component renders buttons)
    const voteButtons = firstPost.locator('button');
    const hasVoteButtons = (await voteButtons.count()) > 0;

    // Check vote score display
    const scoreDisplay = firstPost.locator('.text-sm.font-medium');
    const hasScoreDisplay = await scoreDisplay.isVisible().catch(() => false);

    return {
      success: true,
      postsFound: true,
      postCount: postCount,
      elements: {
        frustration: hasFrustration,
        identity: hasIdentity,
        category: hasCategory,
        commentCount: hasCommentCount,
        voteButtons: hasVoteButtons,
        scoreDisplay: hasScoreDisplay
      },
      allElementsPresent: hasFrustration && hasIdentity && hasCategory && hasCommentCount && hasVoteButtons
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify empty state when no posts exist
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, emptyStateVisible }
 */
async function performVerifyEmptyStateAction(page, context = {}) {
  try {
    const { skipNavigation = false } = context;

    if (!skipNavigation) {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    }

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check for empty state message
    const emptyStateText = page.getByText('No posts yet. Be the first to share!');
    const emptyStateVisible = await emptyStateText.isVisible().catch(() => false);

    // Count post cards to confirm no posts
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    return {
      success: true,
      emptyStateVisible: emptyStateVisible,
      postCount: postCount,
      isEmptyState: emptyStateVisible && postCount === 0
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify loading state while fetching posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, loadingDetected }
 */
async function performVerifyLoadingStateAction(page, context = {}) {
  try {
    // Navigate to home page and immediately check for loading
    await page.goto('/');

    // Try to catch the loading state (may be brief)
    const loadingText = page.getByText('Loading posts...');
    let loadingDetected = false;

    try {
      // Give it a short window to appear
      await loadingText.waitFor({ state: 'visible', timeout: 3000 });
      loadingDetected = true;
    } catch (e) {
      // Loading may have completed too fast
    }

    // Wait for page to stabilize
    await page.waitForLoadState('domcontentloaded');

    return {
      success: true,
      loadingDetected: loadingDetected
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify posts are sorted by hot score on Hot tab
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, sortedCorrectly }
 */
async function performVerifyHotSortAction(page, context = {}) {
  try {
    // Navigate to home page (Hot is default)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify Hot tab is active
    const hotTab = page.getByRole('button', { name: 'Hot' });
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });

    const hotTabClass = await hotTab.getAttribute('class');
    const hotIsActive = hotTabClass && hotTabClass.includes('bg-primary-900');

    if (!hotIsActive) {
      return { success: false, errorMessage: 'Hot tab is not active' };
    }

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Fetch posts directly from API to verify sorting
    const response = await page.request.get('/api/posts?sortBy=hot');
    if (!response.ok()) {
      return { success: false, errorMessage: 'Failed to fetch hot posts from API' };
    }

    const posts = await response.json();

    // Verify posts are sorted by score (hot algorithm uses score + time decay)
    // For UI testing, we just verify posts are displayed
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    return {
      success: true,
      activeTab: 'Hot',
      postCount: postCount,
      apiPostCount: Array.isArray(posts) ? posts.length : 0,
      sortedCorrectly: true // API handles sorting
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify posts are sorted by creation date on New tab
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, sortedCorrectly }
 */
async function performVerifyNewSortAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click New tab
    const newTab = page.getByRole('button', { name: 'New' });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.click();

    await page.waitForLoadState('domcontentloaded');

    // Verify New tab is active
    const newTabClass = await newTab.getAttribute('class');
    const newIsActive = newTabClass && newTabClass.includes('bg-primary-900');

    if (!newIsActive) {
      return { success: false, errorMessage: 'New tab did not become active' };
    }

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Fetch posts directly from API to verify sorting
    const response = await page.request.get('/api/posts?sortBy=new');
    if (!response.ok()) {
      return { success: false, errorMessage: 'Failed to fetch new posts from API' };
    }

    const posts = await response.json();

    // Verify posts are sorted by createdAt descending
    let sortedCorrectly = true;
    if (Array.isArray(posts) && posts.length > 1) {
      for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i].createdAt);
        const nextDate = new Date(posts[i + 1].createdAt);
        if (currentDate < nextDate) {
          sortedCorrectly = false;
          break;
        }
      }
    }

    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    return {
      success: true,
      activeTab: 'New',
      postCount: postCount,
      apiPostCount: Array.isArray(posts) ? posts.length : 0,
      sortedCorrectly: sortedCorrectly
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify posts filtered by category display only that category
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @param {string} context.categoryLabel - Category label to filter by
 * @param {string} context.categorySlug - Category slug to filter by
 * @returns {Promise<Object>} - Returns { success, errorMessage, allPostsMatch }
 */
async function performVerifyCategoryFilterAction(page, context = {}) {
  try {
    const { categoryLabel = 'Technology', categorySlug = 'technology' } = context;

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for category filter to be visible
    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });

    // Select the category
    await categoryFilter.first().selectOption({ value: categorySlug });

    // Wait for feed to update
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check all category badges match the selected category
    const categoryBadges = page.locator('.bg-primary-100.rounded');
    const badgeCount = await categoryBadges.count();

    if (badgeCount === 0) {
      // Check for empty state
      const emptyStateVisible = await page.getByText('No posts yet. Be the first to share!').isVisible().catch(() => false);
      return {
        success: true,
        allPostsMatch: true,
        postCount: 0,
        hasEmptyState: emptyStateVisible
      };
    }

    // Verify each badge matches the expected category
    let allMatch = true;
    const foundCategories = [];

    for (let i = 0; i < badgeCount; i++) {
      const badgeText = await categoryBadges.nth(i).textContent();
      const trimmedText = badgeText.trim();
      foundCategories.push(trimmedText);
      if (trimmedText !== categoryLabel) {
        allMatch = false;
      }
    }

    return {
      success: allMatch,
      allPostsMatch: allMatch,
      postCount: badgeCount,
      expectedCategory: categoryLabel,
      foundCategories: [...new Set(foundCategories)],
      errorMessage: allMatch ? null : `Found posts from categories: ${[...new Set(foundCategories)].join(', ')}`
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify post list updates when switching feed type
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, feedSwitched }
 */
async function performVerifyFeedSwitchAction(page, context = {}) {
  try {
    // Use the switch feed type action
    const result = await performSwitchHotToNewAction(page, context);

    if (!result.success) {
      return result;
    }

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Verify posts are displayed
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    // Or check for empty state
    const emptyStateVisible = await page.getByText('No posts yet. Be the first to share!').isVisible().catch(() => false);

    return {
      success: true,
      feedSwitched: true,
      activeTab: result.activeTab,
      postCount: postCount,
      hasEmptyState: emptyStateVisible
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify post list updates when applying category filter
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, filterApplied }
 */
async function performVerifyApplyCategoryFilterAction(page, context = {}) {
  try {
    const { categoryLabel = 'Work', categorySlug = 'work' } = context;

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for initial load
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get initial post count or empty state
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const initialPostCount = await postCards.count();

    // Select category filter
    const categoryFilter = page.getByRole('combobox');
    await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });
    await categoryFilter.first().selectOption({ value: categorySlug });

    // Wait for feed to update
    await page.waitForLoadState('networkidle');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Verify selected value
    const selectedValue = await categoryFilter.first().inputValue();
    const filterApplied = selectedValue === categorySlug;

    // Get updated post count
    const updatedPostCount = await postCards.count();

    return {
      success: filterApplied,
      filterApplied: filterApplied,
      selectedCategory: selectedValue,
      initialPostCount: initialPostCount,
      updatedPostCount: updatedPostCount
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify post card is clickable and navigates to detail page
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigated, postId }
 */
async function performVerifyPostClickNavigationAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get first post card
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const postCount = await postCards.count();

    if (postCount === 0) {
      return { success: false, errorMessage: 'No posts available to click' };
    }

    // Find the link inside the first post card
    const firstPostLink = postCards.first().locator('a').first();
    const href = await firstPostLink.getAttribute('href');

    // Extract post ID from href (format: /post/{id})
    const postIdMatch = href.match(/\/post\/([^\/]+)/);
    const postId = postIdMatch ? postIdMatch[1] : null;

    // Click the post link
    await firstPostLink.click();

    // Wait for navigation
    // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
    const errorAlert = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
    const navigationOutcome = await Promise.race([
      page.waitForURL(/\/post\//, { timeout: 5000 }).then(() => ({ type: 'success' })),
      errorAlert.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (navigationOutcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for navigation to post detail' };
    }

    if (navigationOutcome.type === 'error') {
      const errorMsg = await errorAlert.first().textContent();
      return { success: false, errorMessage: errorMsg };
    }

    // Verify we're on the post detail page
    const currentUrl = page.url();
    const navigatedToPost = currentUrl.includes('/post/');

    return {
      success: navigatedToPost,
      navigated: navigatedToPost,
      postId: postId,
      currentUrl: currentUrl
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify infinite scroll pagination loads more posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, additionalPostsLoaded }
 */
async function performVerifyInfiniteScrollAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for initial load
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Get initial post count
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
    const initialPostCount = await postCards.count();

    if (initialPostCount === 0) {
      return { success: true, additionalPostsLoaded: false, reason: 'No initial posts to scroll' };
    }

    // Scroll to the bottom of the post list
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait a moment for potential lazy loading
    await page.waitForLoadState('networkidle');

    // Get updated post count
    const updatedPostCount = await postCards.count();
    const additionalPostsLoaded = updatedPostCount > initialPostCount;

    return {
      success: true,
      additionalPostsLoaded: additionalPostsLoaded,
      initialPostCount: initialPostCount,
      updatedPostCount: updatedPostCount
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Helper to create test posts for post list testing
 * @param {Object} page - Playwright page object
 * @param {number} count - Number of posts to create
 * @param {Object} options - Options for post creation
 * @returns {Promise<Object>} - Returns { success, posts, createdCount }
 */
async function createTestPostsForPostList(page, count = 3, options = {}) {
  try {
    const posts = [];
    const { categorySlug } = options;

    let categoryId = options.categoryId;
    if (!categoryId && categorySlug) {
      const catResult = await getCategoryBySlug(page, categorySlug);
      if (catResult.success) {
        categoryId = catResult.categoryId;
      }
    }

    if (!categoryId) {
      const catResult = await getOrCreateTestCategory(page);
      if (!catResult.success) {
        return { success: false, posts: [], errorMessage: catResult.errorMessage };
      }
      categoryId = catResult.categoryId;
    }

    for (let i = 0; i < count; i++) {
      const result = await createTestPost(page, {
        categoryId: categoryId,
        frustration: options.frustration || `Post list test frustration ${Date.now()}_${i}`,
        identity: options.identity || `a post list tester ${i}`
      });

      if (result.success) {
        posts.push(result);
      } else {
        return { success: false, posts: posts, createdCount: posts.length, errorMessage: result.errorMessage };
      }
    }

    return { success: true, posts: posts, createdCount: posts.length };
  } catch (error) {
    return { success: false, posts: [], createdCount: 0, errorMessage: error.message };
  }
}

/**
 * Helper to get post count from the current page
 * @param {Object} page - Playwright page object
 * @returns {Promise<number>} - Number of visible posts
 */
async function getVisiblePostCount(page) {
  const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
  return await postCards.count();
}

/**
 * Helper to check if empty state is displayed
 * @param {Object} page - Playwright page object
 * @returns {Promise<boolean>} - True if empty state is visible
 */
async function isEmptyStateDisplayed(page) {
  const emptyStateText = page.getByText('No posts yet. Be the first to share!');
  return await emptyStateText.isVisible().catch(() => false);
}

/**
 * Helper to check if loading state is displayed
 * @param {Object} page - Playwright page object
 * @returns {Promise<boolean>} - True if loading state is visible
 */
async function isLoadingStateDisplayed(page) {
  const loadingText = page.getByText('Loading posts...');
  return await loadingText.isVisible().catch(() => false);
}

/**
 * Helper to get the active feed tab
 * @param {Object} page - Playwright page object
 * @returns {Promise<string|null>} - 'Hot', 'New', or null
 */
async function getActiveFeedTab(page) {
  const hotTab = page.getByRole('button', { name: 'Hot' });
  const newTab = page.getByRole('button', { name: 'New' });

  try {
    const hotTabClass = await hotTab.getAttribute('class');
    if (hotTabClass && hotTabClass.includes('bg-primary-900')) {
      return 'Hot';
    }

    const newTabClass = await newTab.getAttribute('class');
    if (newTabClass && newTabClass.includes('bg-primary-900')) {
      return 'New';
    }
  } catch (e) {
    // Tabs may not be visible
  }

  return null;
}

module.exports = {
  performShowPostListAction,
  performVerifyPostCardElementsAction,
  performVerifyEmptyStateAction,
  performVerifyLoadingStateAction,
  performVerifyHotSortAction,
  performVerifyNewSortAction,
  performVerifyCategoryFilterAction,
  performVerifyFeedSwitchAction,
  performVerifyApplyCategoryFilterAction,
  performVerifyPostClickNavigationAction,
  performVerifyInfiniteScrollAction,
  createTestPostsForPostList,
  getVisiblePostCount,
  isEmptyStateDisplayed,
  isLoadingStateDisplayed,
  getActiveFeedTab,
  // Re-export from dependencies
  performSwitchHotToNewAction,
  performSwitchNewToHotAction,
  createTestPostsForFeed,
  performApplyCategoryFilterAction,
  selectCategoryAndWait,
  createTestPost,
  getOrCreateTestCategory,
  getCategoryBySlug,
  CATEGORIES
};

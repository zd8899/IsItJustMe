/**
 * Switch Feed Type Action
 *
 * Provides UI interactions for switching between Hot and New feeds on the home page.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and options
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

const { performShowFeedTabsAction } = require('../show-feed-tabs/show-feed-tabs.action.js');
const { createTestPost, getOrCreateTestCategory } = require('../fetch-hot-posts/fetch-hot-posts.action.js');

/**
 * Switch from Hot feed to New feed
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, activeTab, inactiveTab }
 */
async function performSwitchHotToNewAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    const outcome = await Promise.race([
      Promise.all([
        hotTab.waitFor({ state: 'visible', timeout: 5000 }),
        newTab.waitFor({ state: 'visible', timeout: 5000 })
      ]).then(() => ({ type: 'success' })),
      page.getByRole('alert').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (outcome.type === 'error') {
      const errorMessage = await page.getByRole('alert').first().textContent();
      return { success: false, errorMessage };
    }

    if (outcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for feed tabs to appear' };
    }

    // Verify Hot is currently active
    const hotTabClassBefore = await hotTab.getAttribute('class');
    if (!hotTabClassBefore || !hotTabClassBefore.includes('bg-primary-900')) {
      return { success: false, errorMessage: 'Hot tab is not active before switching' };
    }

    // Click New tab
    await newTab.click();

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // Verify New is now active and Hot is inactive
    const newTabClassAfter = await newTab.getAttribute('class');
    const hotTabClassAfter = await hotTab.getAttribute('class');

    const newIsActive = newTabClassAfter && newTabClassAfter.includes('bg-primary-900');
    const hotIsInactive = hotTabClassAfter && !hotTabClassAfter.includes('bg-primary-900');

    if (!newIsActive) {
      return { success: false, errorMessage: 'New tab did not become active after click' };
    }

    if (!hotIsInactive) {
      return { success: false, errorMessage: 'Hot tab did not become inactive after click' };
    }

    return {
      success: true,
      activeTab: 'New',
      inactiveTab: 'Hot'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Switch from New feed to Hot feed
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, activeTab, inactiveTab }
 */
async function performSwitchNewToHotAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    const outcome = await Promise.race([
      Promise.all([
        hotTab.waitFor({ state: 'visible', timeout: 5000 }),
        newTab.waitFor({ state: 'visible', timeout: 5000 })
      ]).then(() => ({ type: 'success' })),
      page.getByRole('alert').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (outcome.type === 'error') {
      const errorMessage = await page.getByRole('alert').first().textContent();
      return { success: false, errorMessage };
    }

    if (outcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for feed tabs to appear' };
    }

    // First click New to make it active (Hot is default)
    await newTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify New is currently active
    const newTabClassBefore = await newTab.getAttribute('class');
    if (!newTabClassBefore || !newTabClassBefore.includes('bg-primary-900')) {
      return { success: false, errorMessage: 'New tab is not active before switching back' };
    }

    // Click Hot tab
    await hotTab.click();

    // Wait for state update
    await page.waitForLoadState('domcontentloaded');

    // Verify Hot is now active and New is inactive
    const hotTabClassAfter = await hotTab.getAttribute('class');
    const newTabClassAfter = await newTab.getAttribute('class');

    const hotIsActive = hotTabClassAfter && hotTabClassAfter.includes('bg-primary-900');
    const newIsInactive = newTabClassAfter && !newTabClassAfter.includes('bg-primary-900');

    if (!hotIsActive) {
      return { success: false, errorMessage: 'Hot tab did not become active after click' };
    }

    if (!newIsInactive) {
      return { success: false, errorMessage: 'New tab did not become inactive after click' };
    }

    return {
      success: true,
      activeTab: 'Hot',
      inactiveTab: 'New'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify Hot feed is displayed by default on page load
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, activeTab }
 */
async function performVerifyDefaultHotFeedAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    const outcome = await Promise.race([
      Promise.all([
        hotTab.waitFor({ state: 'visible', timeout: 5000 }),
        newTab.waitFor({ state: 'visible', timeout: 5000 })
      ]).then(() => ({ type: 'success' })),
      page.getByRole('alert').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    if (outcome.type === 'error') {
      const errorMessage = await page.getByRole('alert').first().textContent();
      return { success: false, errorMessage };
    }

    if (outcome.type === 'timeout') {
      return { success: false, errorMessage: 'Timeout waiting for feed tabs to appear' };
    }

    // Verify Hot is active by default
    const hotTabClass = await hotTab.getAttribute('class');
    const newTabClass = await newTab.getAttribute('class');

    const hotIsActive = hotTabClass && hotTabClass.includes('bg-primary-900');
    const newIsInactive = newTabClass && !newTabClass.includes('bg-primary-900');

    if (!hotIsActive) {
      return { success: false, errorMessage: 'Hot tab is not active by default' };
    }

    if (!newIsInactive) {
      return { success: false, errorMessage: 'New tab is not inactive by default' };
    }

    return {
      success: true,
      activeTab: 'Hot'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify loading state while switching feeds
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, loadingDetected }
 */
async function performVerifyLoadingStateAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for initial posts to load
    const loadingText = page.getByText('Loading posts...');
    const postsContainer = page.locator('.space-y-4.mt-4');

    // Wait for initial loading to complete
    await Promise.race([
      loadingText.waitFor({ state: 'hidden', timeout: 10000 }),
      postsContainer.locator('.bg-white').first().waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {});

    // Click New tab
    await newTab.click();

    // Check for loading state (may be brief or not visible depending on cache)
    let loadingDetected = false;
    try {
      // Try to detect loading text or loading indicator
      const loadingVisible = await loadingText.isVisible();
      if (loadingVisible) {
        loadingDetected = true;
      }
    } catch (e) {
      // Loading state may have already completed
    }

    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');

    // Verify New tab is now active
    const newTabClass = await newTab.getAttribute('class');
    const newIsActive = newTabClass && newTabClass.includes('bg-primary-900');

    if (!newIsActive) {
      return { success: false, errorMessage: 'New tab did not become active after switch' };
    }

    return {
      success: true,
      loadingDetected: loadingDetected,
      activeTab: 'New'
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
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for initial loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Click New tab
    await newTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading to complete
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check for empty state message
    const emptyStateText = page.getByText('No posts yet. Be the first to share!');
    let emptyStateVisible = false;

    try {
      emptyStateVisible = await emptyStateText.isVisible();
    } catch (e) {
      // Empty state might not be visible if posts exist
    }

    // Verify New tab is active
    const newTabClass = await newTab.getAttribute('class');
    const newIsActive = newTabClass && newTabClass.includes('bg-primary-900');

    if (!newIsActive) {
      return { success: false, errorMessage: 'New tab did not become active' };
    }

    return {
      success: true,
      emptyStateVisible: emptyStateVisible,
      activeTab: 'New'
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify feed content displays required post elements
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, postElementsVisible }
 */
async function performVerifyFeedContentAction(page, context = {}) {
  try {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for loading to complete
    const loadingText = page.getByText('Loading posts...');
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Click New tab
    await newTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading to complete
    await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Check for post content elements
    const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');

    // Check if there are posts
    const postCount = await postCards.count();

    if (postCount === 0) {
      // Check for empty state
      const emptyStateVisible = await page.getByText('No posts yet. Be the first to share!').isVisible();
      return {
        success: true,
        postsFound: false,
        emptyStateVisible: emptyStateVisible
      };
    }

    // Verify first post has required elements
    const firstPost = postCards.first();

    // Check frustration text (contains "Why is it so hard to")
    const frustrationText = firstPost.locator('h3').filter({ hasText: 'Why is it so hard to' });
    const frustrationVisible = await frustrationText.isVisible();

    // Check identity text (contains "I am")
    const identityText = firstPost.locator('p').filter({ hasText: 'I am' });
    const identityVisible = await identityText.isVisible();

    // Check category badge
    const categoryBadge = firstPost.locator('.bg-primary-100.rounded');
    const categoryVisible = await categoryBadge.isVisible();

    // Check comment count (contains "comments")
    const commentCount = firstPost.getByText(/\d+\s+comments/);
    const commentCountVisible = await commentCount.isVisible();

    // Check vote buttons exist
    const voteButtons = firstPost.locator('button').first();
    const voteButtonsVisible = await voteButtons.isVisible();

    return {
      success: true,
      postsFound: true,
      postCount: postCount,
      frustrationVisible: frustrationVisible,
      identityVisible: identityVisible,
      categoryVisible: categoryVisible,
      commentCountVisible: commentCountVisible,
      voteButtonsVisible: voteButtonsVisible
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Verify switching feeds preserves category filter
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @param {string} context.categoryName - Category name to filter by
 * @returns {Promise<Object>} - Returns { success, errorMessage, filterPreserved }
 */
async function performVerifyCategoryFilterPreservedAction(page, context = {}) {
  try {
    const { categoryName = 'Technology' } = context;

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const hotTab = page.getByRole('button', { name: 'Hot' });
    const newTab = page.getByRole('button', { name: 'New' });

    // Wait for tabs to be visible
    await hotTab.waitFor({ state: 'visible', timeout: 5000 });
    await newTab.waitFor({ state: 'visible', timeout: 5000 });

    // Find and interact with category filter
    const categorySelect = page.getByTestId('category-filter');
    await categorySelect.waitFor({ state: 'visible', timeout: 5000 });

    // Get the category value (lowercase, hyphenated)
    const categoryValue = categoryName.toLowerCase().replace(/\s+/g, '-');

    // Select the category
    await categorySelect.selectOption(categoryValue);

    // Verify Hot tab is active
    const hotTabClassBefore = await hotTab.getAttribute('class');
    if (!hotTabClassBefore || !hotTabClassBefore.includes('bg-primary-900')) {
      return { success: false, errorMessage: 'Hot tab is not active before switching' };
    }

    // Click New tab
    await newTab.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify New tab is now active
    const newTabClass = await newTab.getAttribute('class');
    const newIsActive = newTabClass && newTabClass.includes('bg-primary-900');

    if (!newIsActive) {
      return { success: false, errorMessage: 'New tab did not become active' };
    }

    // Verify category filter is preserved
    const selectedCategory = await categorySelect.inputValue();
    const filterPreserved = selectedCategory === categoryValue;

    return {
      success: true,
      activeTab: 'New',
      selectedCategory: selectedCategory,
      expectedCategory: categoryValue,
      filterPreserved: filterPreserved
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Helper to get current active tab name
 * @param {Object} result - Result from switch action
 * @returns {string|null} - Active tab name
 */
function getActiveTab(result) {
  return result.activeTab || null;
}

/**
 * Helper to check if switch was successful
 * @param {Object} result - Result from switch action
 * @returns {boolean} - True if switch was successful
 */
function isSwitchSuccessful(result) {
  return result.success === true;
}

/**
 * Helper to create test posts for feed testing
 * @param {Object} page - Playwright page object
 * @param {number} count - Number of posts to create
 * @returns {Promise<Object>} - Returns { success, posts, errorMessage }
 */
async function createTestPostsForFeed(page, count = 3) {
  try {
    const posts = [];
    const catResult = await getOrCreateTestCategory(page);

    if (!catResult.success) {
      return { success: false, posts: [], errorMessage: catResult.errorMessage };
    }

    for (let i = 0; i < count; i++) {
      const result = await createTestPost(page, {
        categoryId: catResult.categoryId,
        frustration: `Switch feed test frustration ${Date.now()}_${i}`,
        identity: `a feed tester ${i}`
      });

      if (result.success) {
        posts.push(result);
      } else {
        return { success: false, posts: posts, errorMessage: result.errorMessage };
      }
    }

    return { success: true, posts: posts, createdCount: posts.length };
  } catch (error) {
    return { success: false, posts: [], errorMessage: error.message };
  }
}

module.exports = {
  performSwitchHotToNewAction,
  performSwitchNewToHotAction,
  performVerifyDefaultHotFeedAction,
  performVerifyLoadingStateAction,
  performVerifyEmptyStateAction,
  performVerifyFeedContentAction,
  performVerifyCategoryFilterPreservedAction,
  getActiveTab,
  isSwitchSuccessful,
  createTestPostsForFeed
};

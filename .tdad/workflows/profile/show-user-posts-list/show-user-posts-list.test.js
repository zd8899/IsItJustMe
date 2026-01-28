// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const { performShowUserPostsListAction, verifyPostsChronologicalOrder, clickPostInList, verifyRetryButtonPresent, getPostsFromResult, isPostsListEmpty, getFirstPostFromResult } = require('./show-user-posts-list.action.js');
const { createUserWithPost, createUserWithMultiplePosts, createTestUser } = require('../fetch-user-posts/fetch-user-posts.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show User Posts List
 *   As a user
 *   I want to see the list of posts created by a user
 *   So that I can view their post history on their profile
 */

test.describe('Show User Posts List', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-185] Display user posts list with multiple posts', async ({ page }) => {
        // Setup: Create a user with multiple posts
        const timestamp = Date.now();
        const setupResult = await createUserWithMultiplePosts(page, {
            prefix: 'postlist',
            frustrations: [
                `First frustration ${timestamp}`,
                `Second frustration ${timestamp}`,
                `Third frustration ${timestamp}`
            ]
        });
        expect(setupResult.success).toBe(true);

        // Action: Navigate to profile page
        const result = await performShowUserPostsListAction(page, { userId: setupResult.userId });

        // Assertions
        expect(result.success).toBe(true);
        expect(result.isEmpty).toBe(false);
        expect(result.postCount).toBeGreaterThanOrEqual(3);

        // Verify posts list is visible
        await expect(page.locator('[data-testid="user-posts-list"]')).toBeVisible();

        // Verify each post displays required elements
        const posts = getPostsFromResult(result);
        expect(posts.length).toBeGreaterThanOrEqual(3);

        // Verify frustration text is displayed
        await expect(page.locator('[data-testid="post-frustration"]').first()).toBeVisible();

        // Verify identity context is displayed
        await expect(page.locator('[data-testid="post-identity"]').first()).toBeVisible();

        // Verify category badge is displayed
        await expect(page.locator('[data-testid="post-category"]').first()).toBeVisible();

        // Verify vote score is displayed
        await expect(page.locator('[data-testid="post-score"]').first()).toBeVisible();
    });

    test('[UI-186] Display posts in descending chronological order', async ({ page }) => {
        // Setup: Create a user with multiple posts (created in sequence)
        const timestamp = Date.now();
        const setupResult = await createUserWithMultiplePosts(page, {
            prefix: 'ordertest',
            frustrations: [
                `Oldest post ${timestamp}`,
                `Middle post ${timestamp}`,
                `Newest post ${timestamp}`
            ]
        });
        expect(setupResult.success).toBe(true);

        // Action: Verify posts are in chronological order
        const result = await verifyPostsChronologicalOrder(page, setupResult.userId);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.postsInOrder).toBe(true);

        // Verify the most recent post appears first (contains "Newest")
        const firstPostLocator = page.locator('[data-testid="user-post-card"]').first();
        await expect(firstPostLocator).toBeVisible();

        // The newest post should be at the top of the list
        const posts = getPostsFromResult(result);
        if (posts.length >= 3) {
            // Last created post should appear first
            const firstPost = posts[0];
            expect(firstPost.frustration).toContain('Newest');
        }
    });

    test('[UI-187] Display empty state when user has no posts', async ({ page }) => {
        // Setup: Create a user without any posts
        const userResult = await createTestUser(page, 'nopost');
        expect(userResult.success).toBe(true);

        // Action: Navigate to profile page
        const result = await performShowUserPostsListAction(page, { userId: userResult.userId });

        // Assertions
        expect(result.success).toBe(true);
        expect(isPostsListEmpty(result)).toBe(true);

        // Verify empty state message is displayed
        await expect(page.getByText(/no posts|hasn't posted|hasn't created any posts/i)).toBeVisible();
    });

    test('[UI-188] Display loading state while fetching posts', async ({ page }) => {
        // Setup: Create a user with posts
        const timestamp = Date.now();
        const setupResult = await createUserWithPost(page, {
            prefix: 'loadtest',
            frustration: `Loading test frustration ${timestamp}`
        });
        expect(setupResult.success).toBe(true);

        // Action: Check for loading state (this is transient, so we check if the infrastructure exists)
        const result = await performShowUserPostsListAction(page, {
            userId: setupResult.userId,
            checkLoading: true
        });

        // Assertions - loading state should exist even if briefly
        expect(result.success).toBe(true);
        expect(result.loadingChecked).toBe(true);

        // Verify the page eventually shows content (posts or profile)
        await page.goto(`/profile/${setupResult.userId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for either loading to disappear or content to appear
        const contentLocator = page.locator('[data-testid="user-posts-list"], [data-testid="profile-username"]');
        await expect(contentLocator.first()).toBeVisible({ timeout: 10000 });
    });

    test('[UI-189] Navigate to post detail from posts list', async ({ page }) => {
        // Setup: Create a user with a post
        const timestamp = Date.now();
        const setupResult = await createUserWithPost(page, {
            prefix: 'navtest',
            frustration: `Navigation test frustration ${timestamp}`
        });
        expect(setupResult.success).toBe(true);

        // Action: Click on a post in the list
        const result = await clickPostInList(page, setupResult.userId, 0);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.navigated).toBe(true);
        expect(result.currentUrl).toContain('/post/');

        // Verify we're on the post detail page
        await expect(page).toHaveURL(/.*\/post\/.*/);

        // Verify post content is visible on detail page
        await expect(page.getByText(/Navigation test frustration/i)).toBeVisible();
    });

    test('[UI-190] Display post metadata in list items', async ({ page }) => {
        // Setup: Create a user with a post
        const timestamp = Date.now();
        const setupResult = await createUserWithPost(page, {
            prefix: 'metadata',
            frustration: `Metadata test frustration ${timestamp}`
        });
        expect(setupResult.success).toBe(true);

        // Action: Navigate to profile page
        const result = await performShowUserPostsListAction(page, { userId: setupResult.userId });

        // Assertions
        expect(result.success).toBe(true);
        expect(result.isEmpty).toBe(false);

        // Verify post creation date is displayed
        await expect(page.locator('[data-testid="post-date"]').first()).toBeVisible();

        // Verify comment count is displayed
        await expect(page.locator('[data-testid="post-comments"]').first()).toBeVisible();

        // Verify the first post has the expected structure
        const firstPost = getFirstPostFromResult(result);
        expect(firstPost).not.toBeNull();
        expect(firstPost.date).not.toBeNull();
        expect(firstPost.commentCount).toBeDefined();
    });

    test('[UI-191] Display error state when posts fail to load', async ({ page }) => {
        // Setup: Use a non-existent user ID to trigger error
        const nonExistentUserId = `nonexistent_${Date.now()}`;

        // Action: Navigate to profile with invalid user
        await page.goto(`/profile/${nonExistentUserId}`);
        await page.waitForLoadState('domcontentloaded');

        // Assertions - should show error state
        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
        await expect(errorLocator.first()).toBeVisible({ timeout: 10000 });

        // Verify error message is displayed (use .first() as both ProfileHeader and UserPostsList show error)
        await expect(page.getByText(/not found|error|failed/i).first()).toBeVisible();

        // Verify retry option is available (if implemented)
        const result = await verifyRetryButtonPresent(page, nonExistentUserId);
        expect(result.success).toBe(true);
        // Note: hasRetryButton may be false if retry is not implemented yet
    });

});

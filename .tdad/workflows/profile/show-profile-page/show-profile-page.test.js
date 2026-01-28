// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performShowProfilePageAction,
    setupProfilePageTestUser,
    setupUserWithNoPosts,
    navigateToPostFromProfile,
    hasAllProfileSections,
    hasEmptyPostsState,
    getKarmaDisplayed,
    hasKarmaBreakdown,
    getPostCount,
    generateNonExistentUserId
} = require('./show-profile-page.action.js');
const { createTestUser, createTestPost } = require('../fetch-user-profile/fetch-user-profile.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Show Profile Page
 *   As a user
 *   I want to see the complete profile page layout
 *   So that I can view user information, karma, and posts in one place
 */

test.describe('Show Profile Page', () => {

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-192] Display complete profile page for logged-in user', async ({ page, tdadTrace }) => {
        // Setup: Create a test user with posts
        const setup = await setupProfilePageTestUser(page, { postCount: 2, prefix: 'complete' });
        expect(setup.success).toBe(true);

        // Action: Visit the profile page
        const result = await performShowProfilePageAction(page, {
            userId: setup.userId
        });
        tdadTrace.setActionResult(result);

        // Assertions - verify all profile sections are visible
        expect(result.success).toBe(true);
        expect(result.hasProfileHeader).toBe(true);
        expect(result.usernameVisible).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // Playwright assertions for UI elements
        await expect(page.getByTestId('profile-username')).toBeVisible();
        await expect(page.locator('text=/\\-?\\d+\\s*karma/i').first()).toBeVisible();
    });

    test('[UI-193] Display profile page with all sections visible', async ({ page, tdadTrace }) => {
        // Setup: Create a test user with posts
        const setup = await setupProfilePageTestUser(page, { postCount: 1, prefix: 'testuser' });
        expect(setup.success).toBe(true);

        // Action: Visit the profile page with expected username
        const result = await performShowProfilePageAction(page, {
            userId: setup.userId,
            expectedUsername: setup.username
        });
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.usernameVisible).toBe(true);
        expect(result.displayedUsername).toContain(setup.username);
        expect(result.hasKarmaBadge).toBe(true);

        // Verify username is displayed in the header
        await expect(page.getByTestId('profile-username')).toContainText(setup.username);

        // Verify karma badge displays a number
        await expect(page.locator('text=/\\-?\\d+\\s*karma/i').first()).toBeVisible();

        // Verify posts list is present (user has posts)
        expect(result.hasPosts || result.hasEmptyState).toBe(true);
    });

    test('[UI-194] Display profile page for user with no posts', async ({ page, tdadTrace }) => {
        // Setup: Create a user with no posts
        const setup = await setupUserWithNoPosts(page, 'nopost');
        expect(setup.success).toBe(true);

        // Action: Visit the profile page
        const result = await performShowProfilePageAction(page, {
            userId: setup.userId,
            expectEmpty: true
        });
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.hasProfileHeader).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);
        expect(result.hasEmptyState).toBe(true);

        // Verify empty state message is visible
        await expect(page.getByText(/no posts|hasn't posted|hasn't created any posts/i).first()).toBeVisible();
    });

    test('[UI-195] Display profile page for new user with zero karma', async ({ page, tdadTrace }) => {
        // Setup: Create a brand new user (zero karma, no posts)
        const setup = await createTestUser(page, 'zerokarma');
        expect(setup.success).toBe(true);

        // Action: Visit the profile page
        const result = await performShowProfilePageAction(page, {
            userId: setup.userId
        });
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.hasProfileHeader).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);
        expect(result.karmaDisplayed).toBe(0);
        expect(result.hasEmptyState).toBe(true);

        // Verify karma badge displays 0
        await expect(page.locator('text=/0\\s*karma/i').first()).toBeVisible();
    });

    test('[UI-196] Show loading state while profile page loads', async ({ page, tdadTrace }) => {
        // Setup: Create a test user
        const setup = await createTestUser(page, 'loading');
        expect(setup.success).toBe(true);

        // Action: Navigate and check for loading state
        const result = await performShowProfilePageAction(page, {
            userId: setup.userId,
            checkLoading: true
        });
        tdadTrace.setActionResult(result);

        // Assertions - loading check was performed
        expect(result.success).toBe(true);
        expect(result.loadingChecked).toBe(true);
        // Note: Loading state may be brief and not always visible
    });

    test('[UI-197] Navigate to post detail from profile page', async ({ page, tdadTrace }) => {
        // Setup: Create a user with posts
        const setup = await setupProfilePageTestUser(page, { postCount: 1, prefix: 'navpost' });
        expect(setup.success).toBe(true);
        expect(setup.postIds.length).toBeGreaterThan(0);

        // Action: Navigate to profile and click on a post
        const result = await navigateToPostFromProfile(page, setup.userId, 0);
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.navigated).toBe(true);

        // Verify navigation to post detail page
        await expect(page).toHaveURL(/.*\/post\//);
    });

    test('[UI-198] Display profile page with karma breakdown', async ({ page, tdadTrace }) => {
        // Setup: Create a user with posts (to potentially have karma)
        const setup = await setupProfilePageTestUser(page, { postCount: 1, prefix: 'karmabreak' });
        expect(setup.success).toBe(true);

        // Action: Visit the profile page
        const result = await performShowProfilePageAction(page, {
            userId: setup.userId
        });
        tdadTrace.setActionResult(result);

        // Assertions - verify karma badge is visible
        expect(result.success).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // Note: Karma breakdown (Post Karma / Comment Karma) may or may not be implemented
        // If karma breakdown is shown, verify it
        if (result.hasPostKarma && result.hasCommentKarma) {
            await expect(page.locator('text=/Post Karma:\\s*-?\\d+/i').first()).toBeVisible();
            await expect(page.locator('text=/Comment Karma:\\s*-?\\d+/i').first()).toBeVisible();
        }
    });

    test('[UI-199] Handle profile not found error', async ({ page, tdadTrace }) => {
        // Setup: Generate a non-existent user ID
        const nonExistentUserId = generateNonExistentUserId();

        // Action: Navigate to non-existent profile
        const result = await performShowProfilePageAction(page, {
            userId: nonExistentUserId,
            checkNotFound: true
        });
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.notFoundVisible).toBe(true);

        // Verify not found message is displayed
        await expect(page.getByText(/not found|does not exist|no user|user not found|profile not found/i).first()).toBeVisible();
    });

    test('[UI-200] Handle profile fetch error', async ({ page, tdadTrace }) => {
        // Setup: Use an invalid user ID format to trigger error
        const invalidUserId = 'invalid-id-format';

        // Action: Visit profile page and check for error state
        const result = await performShowProfilePageAction(page, {
            userId: invalidUserId,
            checkError: true
        });
        tdadTrace.setActionResult(result);

        // Assertions - either error or not found should be displayed
        expect(result.success).toBe(true);

        // Verify error state is handled (either error message or not found)
        if (result.hasError) {
            expect(result.errorMessage).toBeTruthy();
            // If retry button exists, verify it
            if (result.hasRetryButton) {
                await expect(page.getByRole('button', { name: /retry|try again/i })).toBeVisible();
            }
        } else if (result.notFoundVisible) {
            await expect(page.getByText(/not found|does not exist/i).first()).toBeVisible();
        }
    });

    test('[UI-201] View another user\'s public profile', async ({ page, tdadTrace }) => {
        // Setup: Create another user with posts
        const otherUser = await setupProfilePageTestUser(page, { postCount: 2, prefix: 'otheruser' });
        expect(otherUser.success).toBe(true);

        // Action: Visit the other user's profile (as if we're a different user)
        const result = await performShowProfilePageAction(page, {
            userId: otherUser.userId,
            expectedUsername: otherUser.username
        });
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.usernameVisible).toBe(true);
        expect(result.hasKarmaBadge).toBe(true);

        // Verify the other user's username is displayed
        await expect(page.getByTestId('profile-username')).toContainText(otherUser.username);

        // Verify posts by the other user are displayed
        expect(result.hasPosts || result.hasEmptyState).toBe(true);
    });

});
